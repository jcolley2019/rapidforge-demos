// Vault ingest (RFD.VAULT.4): a Claude vision pass over every captured site.
//
// For each vaults/raw/<vertical>/<slug>/ that has facts.json, renders the
// desktop full-page PNG in Chromium as JPEG strips (1200 px wide, 2400 page
// px each; up to 6 per site, and a longer page sends its top 4 and bottom 2),
// sends them with the site's DOM facts to the Claude API (claude-sonnet-5-5,
// structured JSON output) and writes entry.json beside facts.json: the
// site's search metadata, the vision read and the facts, one entry per site.
//
// ANTHROPIC_API_KEY comes from the environment; when it is unset the
// gitignored .env at the repo root is loaded. With no key the script stops
// with exit code 1 before writing anything - no entry is ever faked.
// Entries already made from the current capture are kept unless --force.
// Exit code 1 when any captured site is left without an entry.
//
//   node scripts/vault-ingest.mjs [--force] [--only <vertical|slug>]

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { chromium } from 'playwright'
import { z } from 'zod/v4'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const option = (name) => {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : undefined
}
const OUT = resolve(root, option('--out') ?? 'vaults/raw')
const ONLY = option('--only')
const FORCE = args.includes('--force')

const MODEL = 'claude-sonnet-5-5'
const EFFORT = 'medium'
const CONCURRENCY = 4
const STRIP_WIDTH = 1200
const STRIP_PAGE_PX = 2400
const MAX_STRIPS = 6
const PRICE = { input: 2 / 1e6, output: 10 / 1e6 } // claude-sonnet-5-5, USD per token

if (!process.env.ANTHROPIC_API_KEY && existsSync(join(root, '.env'))) process.loadEnvFile(join(root, '.env'))
const key = process.env.ANTHROPIC_API_KEY ?? ''
if (!key || /paste|your-key/i.test(key)) {
  console.error('ANTHROPIC_API_KEY is not set (environment or .env). Stopping: no vision entries were written.')
  process.exit(1)
}

const Hex = z.string().describe('6-digit hex colour, e.g. #1f3a5c')
const Vision = z.object({
  aesthetic: z.string().describe('One line, under 20 words, naming the overall look'),
  palette: z.object({ bg: Hex, surface: Hex, text: Hex, accent: Hex, accent2: Hex }),
  typePairing: z.object({
    display: z.string().describe('Headline typeface'),
    body: z.string().describe('Body typeface'),
    source: z.string().describe('google-fonts, adobe-fonts, system, custom or unknown'),
  }),
  sectionOrder: z.array(z.string()).describe('Homepage sections top to bottom, short lowercase names'),
  heroTreatment: z.string().describe('One line: how the hero is built'),
  trustSignals: z.array(z.string()).describe('Concrete trust signals as they appear on the page'),
  ctaPattern: z.string().describe('One line: primary and secondary calls to action and where they repeat'),
  distinctiveMoves: z.array(z.string()).describe('Up to 4 reusable design moves most contractor sites do not make'),
  weaknesses: z.array(z.string()).describe('Up to 3 specific weaknesses'),
  segmentFit: z
    .object({ residential: z.number(), commercial: z.number(), new_construction: z.number() })
    .describe('Independent 0-1 confidence that the site is built to win each segment'),
  vocabulary: z.array(z.string()).describe('8 to 12 short noun phrases naming reusable visual traits'),
  flags: z.object({
    trustBar: z.boolean(),
    couponOrFinancingBlock: z.boolean(),
    serviceAreaList: z.boolean(),
    reviewsWidget: z.boolean(),
    bookingForm: z.boolean(),
    conversion: z.enum(['phone-first', 'form-or-booking-first', 'balanced']),
  }),
  heroImageRecipe: z.string().describe('Image-generation prompt for a 16:9 hero photo in this style, subject as [SUBJECT: ...]'),
})

const SYSTEM = `You are a senior web designer building a taste vault of real local trade-contractor websites (plumbing, HVAC, electrical) for an agency that designs sites for these businesses. Each request shows one homepage as consecutive strips of a full-page desktop screenshot (1440 px wide, scaled to 1200), plus facts measured in the browser.

Describe what is actually on the page. Do not invent sections, badges, offers or features you cannot see. Use the measured fonts and colours when they agree with the screenshot.

Fields:
- aesthetic: one line, under 20 words, naming the overall look (e.g. "Workwear-bold black and red header over truck-wrap photography").
- palette: hex colours from the page. bg = main page background; surface = cards or alternating section panels; text = main body text; accent = the main CTA or brand colour; accent2 = the secondary accent.
- typePairing: display = the headline typeface, body = the body typeface (name them, using the measured fonts), source = where they come from (google-fonts, adobe-fonts, system, custom or unknown).
- sectionOrder: homepage sections top to bottom as short lowercase names (utility bar, header, hero, trust bar, services, about, reviews, coupons, financing, service areas, projects, blog, faq, cta band, contact form, map, footer, ...).
- heroTreatment: one line on how the hero is built (image or video, overlay, layout, where the headline and CTAs sit).
- trustSignals: concrete signals as they appear (e.g. "BBB A+ badge", "Licensed & insured", "4.9 Google rating, 1,200 reviews", "Family owned since 1985").
- ctaPattern: one line naming the primary and secondary calls to action and where they repeat.
- distinctiveMoves: up to 4 specific, reusable design moves this site makes that most contractor sites do not.
- weaknesses: up to 3 specific weaknesses (conversion, legibility, clutter, dated or generic look).
- segmentFit: a confidence from 0 to 1, independently for each, that the site is built to win residential homeowner work, commercial work, and new-construction/builder work.
- vocabulary: 8 to 12 short noun phrases (2-5 words each) naming visual traits a designer could reuse, like a taste-vault entry (e.g. "truck-wrap hero photo", "black utility bar", "red pill CTA", "condensed caps headlines").
- flags: trustBar = a dedicated strip or row of trust badges or claims near the top; couponOrFinancingBlock = a visible coupon, special-offer or financing block on this page; serviceAreaList = a visible list or map of the towns served; reviewsWidget = a reviews section with ratings or testimonials; bookingForm = an on-page form or embedded scheduler, not just a button; conversion = the path the page pushes hardest.
- heroImageRecipe: an image-generation prompt for a 16:9 hero background photo in this site's style, with the subject as a [SUBJECT: ...] placeholder; give camera, light, palette and where the negative space for the headline sits. No text or logos in the image.`

const pct = (x) => `${Math.round(x * 100)}%`
const yes = (b) => (b ? 'yes' : 'no')
const list = (a) => (a && a.length ? a.join(', ') : 'none')

function siteBrief(f) {
  const s = f.signals
  return `Site: ${f.company} (${f.finalUrl}), a ${f.vertical} contractor in ${f.metro}; found by the search "${f.search.query}" (rank ${f.search.rank}) for the ${f.segment.replace('_', ' ')} segment.

Measured in the browser (use where they agree with the screenshot):
- Title: ${f.title}
- Meta description: ${f.metaDescription ?? 'none'}
- H1: ${list(f.headings.h1)}; first H2s: ${list(f.headings.h2.slice(0, 10))}
- Computed fonts: body ${f.fonts.body}; h1 ${f.fonts.h1 ?? 'none'}; h2 ${f.fonts.h2 ?? 'none'}; webfonts loaded: ${list(f.fonts.loaded)}
- Most common backgrounds: ${f.colors.background.map((c) => `${c.hex} ${pct(c.share)}`).join(', ')}; photo/background-image share ${pct(f.colors.imageShare)}
- Most common text colours: ${f.colors.text.map((c) => `${c.hex} ${pct(c.share)}`).join(', ')}
- Sticky header: ${yes(f.stickyHeader)}; phone pinned while scrolling: desktop ${yes(f.stickyPhone.desktop)}, mobile ${yes(f.stickyPhone.mobile)}
- Phone number visible in the first 390 px mobile viewport: ${yes(f.phoneVisibleFirstViewport390)}${f.phoneSeen390 ? ` (${f.phoneSeen390})` : ''}
- tel: links: ${f.telLinkCount}; CTA labels in page order: ${list(f.ctaLabels.slice(0, 14).map((c) => c.label))}
- Text signals: trust words [${list(s.trust)}]; coupon ${yes(s.coupon)}; financing ${yes(s.financing)}; maintenance plan ${yes(s.membership)}; service-area wording ${yes(s.serviceArea)}; 24/7 or emergency ${yes(s.emergency)}; license number ${s.licenseNumber ?? 'none found'}
- Embedded vendors: reviews [${list(s.reviewVendors)}], scheduling [${list(s.schedulerVendors)}], chat [${list(s.chatVendors)}]; lead forms on the page: ${s.leadForms}; badge/partner images: [${list(s.badges)}]; platform: ${list(s.platform)}

Describe this homepage for the vault.`
}

// Renders the full-page PNG through a routed page (same origin, no file://)
// and screenshots strips of it as JPEG.
async function renderStrips(page, png) {
  const body = readFileSync(png)
  await page.unrouteAll()
  await page.route('http://vault.local/**', (route) => {
    const path = new URL(route.request().url()).pathname
    if (path === '/shot.png') return route.fulfill({ contentType: 'image/png', body })
    return route.fulfill({
      contentType: 'text/html',
      body: `<!doctype html><html><body style="margin:0;background:#fff"><img id="s" src="/shot.png" style="display:block;width:${STRIP_WIDTH}px;height:auto"></body></html>`,
    })
  })
  await page.goto('http://vault.local/')
  await page.waitForFunction(() => document.getElementById('s')?.complete)
  const natural = await page.evaluate(() => {
    const img = document.getElementById('s')
    return { w: img.naturalWidth, h: img.naturalHeight }
  })
  const scale = STRIP_WIDTH / natural.w
  const rendered = Math.round(natural.h * scale)
  const step = Math.round(STRIP_PAGE_PX * scale)
  const count = Math.ceil(rendered / step)
  const picks = count <= MAX_STRIPS ? [...Array(count).keys()] : [0, 1, 2, 3, count - 2, count - 1]
  const strips = []
  for (const [n, i] of picks.entries()) {
    const y = i * step
    const height = Math.min(step, rendered - y)
    if (height < 40 && strips.length) continue
    const jpg = await page.screenshot({ clip: { x: 0, y, width: STRIP_WIDTH, height }, fullPage: true, type: 'jpeg', quality: 80 })
    strips.push({
      from: Math.round(y / scale),
      to: Math.round((y + height) / scale),
      gapBefore: n > 0 && picks[n - 1] !== i - 1,
      data: jpg.toString('base64'),
    })
  }
  return strips
}

const client = new Anthropic({ apiKey: key, maxRetries: 4 })

async function readSite(facts, strips) {
  const content = []
  for (const [i, s] of strips.entries()) {
    const gap = s.gapBefore ? ' (the middle of the page is skipped before this strip)' : ''
    content.push({ type: 'text', text: `Strip ${i + 1} of ${strips.length}: page y ${s.from}-${s.to} px of ${facts.page.desktopHeight} px${gap}` })
    content.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: s.data } })
  }
  content.push({ type: 'text', text: siteBrief(facts) })
  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    system: SYSTEM,
    output_config: { effort: EFFORT, format: zodOutputFormat(Vision) },
    messages: [{ role: 'user', content }],
  })
  if (response.stop_reason === 'refusal') throw new Error(`refused (${response.stop_details?.category ?? 'no category'})`)
  if (response.stop_reason === 'max_tokens') throw new Error('hit max_tokens')
  if (!response.parsed_output) throw new Error(`no parsed output (stop_reason ${response.stop_reason})`)
  return response
}

// The schema cannot carry numeric ranges or array lengths, so they are
// enforced here.
function tidy(v) {
  const hex = (h) => {
    const m = String(h).trim().match(/^#?([0-9a-f]{6}|[0-9a-f]{3})$/i)
    if (!m) return String(h).trim()
    const x = m[1].length === 3 ? [...m[1]].map((c) => c + c).join('') : m[1]
    return `#${x.toLowerCase()}`
  }
  const clamp = (n) => Math.min(1, Math.max(0, Number(n) || 0))
  return {
    ...v,
    palette: Object.fromEntries(Object.entries(v.palette).map(([k, h]) => [k, hex(h)])),
    distinctiveMoves: v.distinctiveMoves.slice(0, 4),
    weaknesses: v.weaknesses.slice(0, 3),
    vocabulary: v.vocabulary.slice(0, 12),
    segmentFit: {
      residential: clamp(v.segmentFit.residential),
      commercial: clamp(v.segmentFit.commercial),
      new_construction: clamp(v.segmentFit.new_construction),
    },
  }
}

const captured = []
for (const vertical of existsSync(OUT) ? readdirSync(OUT) : []) {
  const vdir = join(OUT, vertical)
  if (vertical.includes('.') || !existsSync(vdir)) continue
  for (const slug of readdirSync(vdir)) {
    const dir = join(vdir, slug)
    if (slug.endsWith('.tmp') || !existsSync(join(dir, 'facts.json'))) continue
    if (ONLY && vertical !== ONLY && slug !== ONLY) continue
    captured.push({ vertical, slug, dir })
  }
}

const todo = []
for (const site of captured) {
  const facts = JSON.parse(readFileSync(join(site.dir, 'facts.json'), 'utf8'))
  const entryPath = join(site.dir, 'entry.json')
  if (!FORCE && existsSync(entryPath)) {
    const entry = JSON.parse(readFileSync(entryPath, 'utf8'))
    if (entry.facts?.capturedAt === facts.capturedAt) continue
  }
  todo.push({ ...site, facts, entryPath })
}
console.log(`${captured.length} captured sites, ${todo.length} to ingest with ${MODEL} (effort ${EFFORT})`)

const usage = { input: 0, output: 0 }
let failures = 0
if (todo.length) {
  // Strips first (one browser page, sequential), then the API calls in parallel.
  const browser = await chromium.launch()
  try {
    const context = await browser.newContext({ viewport: { width: STRIP_WIDTH, height: 1000 }, deviceScaleFactor: 1 })
    const page = await context.newPage()
    for (const site of todo) site.strips = await renderStrips(page, join(site.dir, 'desktop.png'))
  } finally {
    await browser.close()
  }

  const queue = [...todo]
  const worker = async () => {
    for (let site = queue.shift(); site; site = queue.shift()) {
      const key = `${site.vertical}/${site.slug}`
      const started = Date.now()
      try {
        const response = await readSite(site.facts, site.strips)
        const { vertical, segment, slug, company, metro, url, finalUrl, search, ...rest } = site.facts
        const entry = {
          id: key,
          vertical,
          segment,
          slug,
          company,
          metro,
          url,
          finalUrl,
          search,
          ...tidy(response.parsed_output),
          facts: rest,
          ingest: {
            model: response.model,
            effort: EFFORT,
            at: new Date().toISOString(),
            strips: site.strips.map((s) => [s.from, s.to]),
            usage: { input: response.usage.input_tokens, output: response.usage.output_tokens },
          },
        }
        writeFileSync(site.entryPath, JSON.stringify(entry, null, 2) + '\n')
        usage.input += response.usage.input_tokens
        usage.output += response.usage.output_tokens
        const k = (n) => `${(n / 1000).toFixed(1)}k`
        console.log(
          `ok   ${key} ${site.strips.length} strips, ${k(response.usage.input_tokens)} in / ${k(response.usage.output_tokens)} out, ${((Date.now() - started) / 1000).toFixed(1)}s`,
        )
      } catch (err) {
        failures++
        console.error(`FAIL ${key} - ${String(err?.message ?? err).split('\n')[0].slice(0, 200)}`)
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker))
}

const missing = captured.filter((s) => !existsSync(join(s.dir, 'entry.json')))
const cost = usage.input * PRICE.input + usage.output * PRICE.output
console.log(
  `\n${captured.length - missing.length}/${captured.length} captured sites have an entry; this run ${usage.input} input + ${usage.output} output tokens (~$${cost.toFixed(2)})`,
)
if (missing.length || failures) {
  console.error(`missing entries: ${missing.map((s) => `${s.vertical}/${s.slug}`).join(', ') || 'none'}`)
  process.exit(1)
}
