// Vault distill (RFD.VAULT.4): per-vertical vault files from ingested entries.
//
// For plumbing, hvac and electrical: loads vaults/raw/<vertical>/*/entry.json,
// counts the vertical's conventions, clusters the entries into 4-6 aesthetic
// families (exhaustive k-medoids on a palette / type / hero distance, at
// least 2 sites per family, k chosen by silhouette), and writes one copy-brief
// block per family in the shape of webedit's briefFor(). House DNA is the
// vertical's counted conventions; the family's name, aesthetic line,
// vocabulary, never-list, one risk and hero prompt are written by Claude
// (claude-sonnet-5-5, text only) from the member entries and cached in
// vaults/raw/family-cache.json. Outputs:
//
//   vaults/<vertical>.json               {meta, conventions, families[], entries[]}
//   vaults/<vertical>-contact-sheet.jpg  desktop first-viewport thumbnails, labelled, < 1.5 MB
//   vaults/raw/report-data.md            tables and per-site notes for REPORT.md
//
// ANTHROPIC_API_KEY as in vault-ingest.mjs (environment, else .env). Exit
// code 1 when a vertical has fewer than 10 entries or 4 families, or a
// contact sheet cannot be brought under 1.5 MB.
//
//   node scripts/vault-distill.mjs

import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { chromium } from 'playwright'
import { z } from 'zod/v4'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const RAW = join(root, 'vaults', 'raw')
const VAULTS = join(root, 'vaults')
const CACHE = join(RAW, 'family-cache.json')
const VERTICALS = ['plumbing', 'hvac', 'electrical']
const SEGMENTS = ['residential', 'commercial', 'new_construction']
const SHEET_MAX_BYTES = 1.5 * 1000 * 1000
const MODEL = 'claude-sonnet-5-5'
const sites = JSON.parse(readFileSync(join(root, 'scripts', 'vault-sites.json'), 'utf8'))
const captureLog = existsSync(join(RAW, 'capture-log.json')) ? JSON.parse(readFileSync(join(RAW, 'capture-log.json'), 'utf8')).results : []

if (!process.env.ANTHROPIC_API_KEY && existsSync(join(root, '.env'))) process.loadEnvFile(join(root, '.env'))
const key = process.env.ANTHROPIC_API_KEY ?? ''
if (!key || /paste|your-key/i.test(key)) {
  console.error('ANTHROPIC_API_KEY is not set (environment or .env). Stopping: family briefs need it.')
  process.exit(1)
}
const client = new Anthropic({ apiKey: key, maxRetries: 4 })

// ---------- colour and type helpers ----------

const isHex = (h) => /^#[0-9a-f]{6}$/i.test(h ?? '')
function hsl(hex) {
  const n = parseInt(hex.slice(1), 16)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((x) => x / 255)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  const d = max - min
  if (!d) return { h: 0, s: 0, l }
  const s = d / (1 - Math.abs(2 * l - 1))
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return { h: (h * 60 + 360) % 360, s, l }
}
const neutral = (hex) => {
  const { s, l } = hsl(hex)
  return s < 0.18 || l < 0.1 || l > 0.94
}
function colorName(hex) {
  if (!isHex(hex)) return 'unknown'
  const { h, s, l } = hsl(hex)
  if (s < 0.18 || l < 0.1 || l > 0.94) return l < 0.15 ? 'black' : l < 0.4 ? 'charcoal' : l < 0.85 ? 'gray' : 'white'
  if (h < 15 || h >= 345) return l < 0.3 ? 'maroon' : 'red'
  if (h < 40) return l < 0.35 ? 'brown' : 'orange'
  if (h < 65) return 'yellow'
  if (h < 160) return l < 0.3 ? 'forest green' : 'green'
  if (h < 195) return 'teal'
  if (h < 250) return l < 0.35 ? 'navy' : 'blue'
  if (h < 290) return 'purple'
  return 'pink'
}
const HUE_FAMILY = { maroon: 'red', brown: 'orange', 'forest green': 'green', navy: 'blue', black: 'neutral', charcoal: 'neutral', gray: 'neutral', white: 'neutral' }
const hueFamily = (hex) => HUE_FAMILY[colorName(hex)] ?? colorName(hex)
function hueDist(a, b) {
  if (!isHex(a) || !isHex(b)) return 0.6
  const na = neutral(a)
  const nb = neutral(b)
  if (na && nb) return 0
  if (na !== nb) return 0.6
  const d = Math.abs(hsl(a).h - hsl(b).h)
  return Math.min(d, 360 - d) / 180
}

function typeClass(font) {
  const f = (font ?? '').toLowerCase()
  if (/condensed|narrow|compressed|oswald|bebas|anton|league gothic|fjalla|teko|big shoulders|antonio|khand|rajdhani|pathway gothic/.test(f)) return 'condensed sans'
  if (/slab|arvo|rockwell|zilla|bitter|aleo|josefin slab/.test(f)) return 'slab serif'
  if (/script|pacifico|lobster|dancing|satisfy|great vibes|kaushan|caveat|marker|yellowtail/.test(f)) return 'script'
  if (!/sans/.test(f) && /serif|playfair|merriweather|lora|georgia|times|garamond|cormorant|baskerville|crimson|prata|cinzel|abril|fraunces|libre caslon/.test(f)) return 'serif'
  if (/montserrat|poppins|raleway|futura|outfit|gotham|nunito|quicksand|josefin|urbanist|lexend|questrial|kumbh|manrope|jost|red hat|figtree|jakarta|sora|dm sans|work sans|exo|metropolis|proxima|avenir|century gothic|museo|kanit|varela|syne|lato/.test(f)) return 'geometric sans'
  return 'grotesk sans'
}
function heroClass(text) {
  const t = (text ?? '').toLowerCase()
  if (/\bvideo\b/.test(t)) return 'video hero'
  if (/slider|carousel|slideshow|rotating/.test(t)) return 'slider hero'
  if (/split|two[- ]column|left (column|half|side)|right (column|half|side)|side[- ]by[- ]side|beside/.test(t)) return 'split hero'
  if (/solid|flat (colou?r)|no (photo|image)|plain (colou?r|background)|gradient (band|block|panel|hero)/.test(t)) return 'solid-colour hero'
  if (/photo|image|picture/.test(t)) return 'full-bleed photo hero'
  return 'other hero'
}

// ---------- clustering ----------

function features(e) {
  const bg = e.facts.colors.background
  return {
    dark: Math.min(1, bg.filter((c) => isHex(c.hex) && hsl(c.hex).l < 0.35).reduce((a, c) => a + c.share, 0)),
    image: e.facts.colors.imageShare ?? 0,
    accent: e.palette.accent,
    accent2: e.palette.accent2,
    type: typeClass(e.typePairing.display),
    hero: heroClass(e.heroTreatment),
  }
}
const distance = (a, b) =>
  Math.abs(a.dark - b.dark) +
  hueDist(a.accent, b.accent) +
  0.5 * hueDist(a.accent2, b.accent2) +
  0.6 * (a.type !== b.type ? 1 : 0) +
  0.8 * (a.hero !== b.hero ? 1 : 0) +
  0.4 * Math.abs(a.image - b.image)

function* combinations(n, k, start = 0, prefix = []) {
  if (prefix.length === k) {
    yield prefix
    return
  }
  for (let i = start; i <= n - (k - prefix.length); i++) yield* combinations(n, k, i + 1, [...prefix, i])
}
// Exhaustive k-medoids: every medoid set, each site to its nearest medoid,
// lowest total distance with no family smaller than minSize. Each cluster
// is returned medoid first.
function kMedoids(dist, k, minSize = 2) {
  let best = null
  for (const medoids of combinations(dist.length, k)) {
    const clusters = medoids.map((m) => [m])
    let cost = 0
    for (let i = 0; i < dist.length; i++) {
      if (medoids.includes(i)) continue
      let bi = 0
      for (let m = 1; m < k; m++) if (dist[i][medoids[m]] < dist[i][medoids[bi]]) bi = m
      clusters[bi].push(i)
      cost += dist[i][medoids[bi]]
    }
    if (clusters.some((c) => c.length < minSize)) continue
    if (!best || cost < best.cost) best = { cost, clusters }
  }
  return best
}
function silhouette(clusters, dist) {
  const label = []
  clusters.forEach((c, ci) => c.forEach((i) => (label[i] = ci)))
  let total = 0
  for (let i = 0; i < label.length; i++) {
    const own = clusters[label[i]]
    if (own.length === 1) continue
    const a = own.filter((j) => j !== i).reduce((s, j) => s + dist[i][j], 0) / (own.length - 1)
    const b = Math.min(...clusters.filter((_, ci) => ci !== label[i]).map((c) => c.reduce((s, j) => s + dist[i][j], 0) / c.length))
    total += (b - a) / Math.max(a, b)
  }
  return total / label.length
}

// ---------- counting helpers ----------

const tally = (values) => {
  const m = new Map()
  for (const v of values) if (v) m.set(v, (m.get(v) ?? 0) + 1)
  return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([value, count]) => ({ value, count }))
}
const median = (xs) => {
  const s = xs.filter((x) => typeof x === 'number').sort((a, b) => a - b)
  if (!s.length) return null
  return s.length % 2 ? s[(s.length - 1) / 2] : Math.round((s[s.length / 2 - 1] + s[s.length / 2]) / 2)
}
const normLabel = (l) =>
  l
    .toLowerCase()
    .replace(/(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g, '<phone>')
    .replace(/^(call( us)?( now| today)?:?\s*)?<phone>$/, 'call <phone>')
    .replace(/[!.:,]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
// Action labels only: highlighted nav items ("Home", "About Us"), menu
// toggles and form submits are not calls to action.
const isAction = (l) =>
  /<phone>|\b(call|schedule|book|request|get|estimate|quote|free|text us|chat|contact us|reserve|claim)\b/.test(l) &&
  !/^(home|about( us)?|services?|blog|careers?|menu|main menu|menu toggle|submit|search|leave a review|read more( reviews)?|learn more)$/.test(l)

function conventionsFor(entries) {
  const n = entries.length
  const conv = (rule, fn) => {
    const hits = entries.filter(fn).map((e) => e.slug)
    return { count: hits.length, of: n, rule, sites: hits }
  }
  // Each site's first action CTA by page position, and every action label it uses.
  const actions = entries.map((e) => [...e.facts.ctaLabels].sort((a, b) => a.firstY - b.firstY).map((c) => normLabel(c.label)).filter(isAction))
  const typical = tally(actions.map((a) => a[0]))[0]
  return {
    sites: n,
    stickyPhone: conv('a phone number or call link stays pinned while scrolling, desktop or mobile (DOM)', (e) => e.facts.stickyPhone.desktop || e.facts.stickyPhone.mobile),
    stickyHeader: conv('header bar stays pinned at the top while scrolling on desktop (DOM)', (e) => e.facts.stickyHeader),
    phoneFirstMobileScreen: conv('phone number fully visible in the first 390x844 viewport (DOM)', (e) => e.facts.phoneVisibleFirstViewport390),
    callLinkFirstMobileScreen: conv('a tap-to-call link (number or icon) visible in the first 390x844 viewport (DOM)', (e) => e.facts.callLinkVisibleFirstViewport390),
    trustBar: conv('dedicated strip of trust badges or claims near the top (vision)', (e) => e.flags.trustBar),
    couponOrFinancing: conv('visible coupon, special-offer or financing block (vision)', (e) => e.flags.couponOrFinancingBlock),
    serviceAreaList: conv('visible list or map of towns served (vision)', (e) => e.flags.serviceAreaList),
    reviewsWidget: conv('reviews section with ratings or testimonials (vision)', (e) => e.flags.reviewsWidget),
    bookingForm: conv('on-page form or embedded scheduler (vision, or a 2+ field form in the DOM)', (e) => e.flags.bookingForm || e.facts.signals.leadForms > 0),
    phoneFirst: conv('the page pushes the phone call hardest (vision)', (e) => e.flags.conversion === 'phone-first'),
    formOrBookingFirst: conv('the page pushes a form or online booking hardest (vision)', (e) => e.flags.conversion === 'form-or-booking-first'),
    balancedConversion: conv('phone and form/booking pushed about equally (vision)', (e) => e.flags.conversion === 'balanced'),
    licenseNumberShown: conv('a license/registration number appears in the page text (DOM)', (e) => !!e.facts.signals.licenseNumber),
    emergency247: conv('24/7 or emergency wording (DOM)', (e) => e.facts.signals.emergency),
    medianCtaLabel: typical
      ? { label: typical.value, sites: typical.count, rule: "most common first action CTA by page position (nav items excluded; any phone-number label = 'call <phone>')" }
      : null,
    ctaLabels: tally(actions.flatMap((a) => [...new Set(a)])).slice(0, 10).map(({ value, count }) => ({ label: value, sites: count })),
    paletteHues: {
      accent: tally(entries.map((e) => hueFamily(e.palette.accent))).map(({ value, count }) => ({ hue: value, sites: count })),
      accent2: tally(entries.map((e) => hueFamily(e.palette.accent2))).map(({ value, count }) => ({ hue: value, sites: count })),
      ground: tally(entries.map((e) => (features(e).dark >= 0.35 ? 'dark-heavy' : 'light'))).map(({ value, count }) => ({ ground: value, sites: count })),
    },
    displayFonts: tally(entries.map((e) => e.typePairing.display)).slice(0, 8).map(({ value, count }) => ({ font: value, sites: count })),
    typeClasses: tally(entries.map((e) => typeClass(e.typePairing.display))).map(({ value, count }) => ({ type: value, sites: count })),
    heroClasses: tally(entries.map((e) => heroClass(e.heroTreatment))).map(({ value, count }) => ({ hero: value, sites: count })),
    lcpMsMedian: { desktop: median(entries.map((e) => e.facts.lcpMs.desktop)), mobile: median(entries.map((e) => e.facts.lcpMs.mobile)) },
    imagesAboveFoldMedian: median(entries.map((e) => e.facts.imageCountAboveFold)),
    platforms: tally(entries.flatMap((e) => e.facts.signals.platform)).map(({ value, count }) => ({ platform: value, sites: count })),
    schedulers: tally(entries.flatMap((e) => e.facts.signals.schedulerVendors)).map(({ value, count }) => ({ vendor: value, sites: count })),
  }
}

function houseDna(c) {
  const rows = [
    ['Phone number on the first mobile screen', c.phoneFirstMobileScreen],
    ['Header that stays pinned while scrolling', c.stickyHeader],
    ['Phone or call button pinned while scrolling', c.stickyPhone],
    ['Trust strip of licenses, ratings and years near the top', c.trustBar],
    ['Star-rated reviews on the homepage', c.reviewsWidget],
    ['Named list of towns served', c.serviceAreaList],
    ['Quote or booking form on the page', c.bookingForm],
    ['Coupon or financing block', c.couponOrFinancing],
    ['Call is the primary conversion', c.phoneFirst],
  ]
  return rows
    .filter(([, v]) => v.count / v.of >= 0.5)
    .sort((a, b) => b[1].count - a[1].count)
    .map(([text, v]) => `${text} (${v.count}/${v.of})`)
}

// ---------- family copy (Claude) ----------

const FamilyCopy = z.object({
  name: z.string().describe('2-4 word Title Case family name, like a taste-vault collection'),
  aesthetic: z.string().describe('One line under 25 words: the shared look'),
  vocabulary: z.array(z.string()).describe('10-12 short noun phrases naming reusable visual traits'),
  never: z.array(z.string()).describe('5-7 short anti-patterns to avoid in this style'),
  risk: z.string().describe('One bold but realistic design move to try'),
  heroImageRecipe: z.string().describe('16:9 hero photo prompt with a [SUBJECT: ...] placeholder'),
  lead: z.string().describe('id of the member that best exemplifies the family'),
})

const FAMILY_SYSTEM = `You are a senior web designer distilling a taste vault of real local trade-contractor websites into reusable aesthetic families for an agency's site presets. You get one family: real homepages that a clustering step grouped by palette, type and hero treatment, each with a design read. Write the family's copy-brief fields for a designer who will build a new contractor homepage in this style. Stay grounded in what these sites actually show; do not invent features none of them have.

Fields:
- name: 2-4 words, Title Case, plain but evocative, like a taste-vault collection name (e.g. "Workwear Red & Black", "Desert Sun Bright", "Steel Blue Commercial").
- aesthetic: one line under 25 words naming the shared look.
- vocabulary: 10-12 short noun phrases (2-5 words) naming reusable visual traits, preferring traits that recur across members.
- never: 5-7 short items (under 9 words each) naming anti-patterns to avoid in this style, drawn from the members' weaknesses and phrased as things to avoid (e.g. "Thin white headline over a busy photo"). Skip weaknesses about blank, empty or unrendered areas (gaps, voids, dead zones, empty widgets, carousels, tiles or forms that show nothing): embedded and lazy content can fail to paint in the screenshots, so treat those as capture artifacts, not design choices.
- risk: one sentence naming a bold but realistic move to try, drawn from the members' distinctive moves.
- heroImageRecipe: an image-generation prompt for a 16:9 hero background photo in this family's style, with the subject as a [SUBJECT: ...] placeholder; give camera, light, palette and where the negative space for the headline sits. No text or logos.
- lead: the id of the member that best exemplifies the family (the strongest, cleanest example), copied exactly.`

function familyInput(vertical, members, traits) {
  return JSON.stringify(
    {
      vertical,
      traits,
      members: members.map((e) => ({
        id: e.id,
        company: e.company,
        segment: e.segment,
        metro: e.metro,
        aesthetic: e.aesthetic,
        palette: e.palette,
        typePairing: e.typePairing,
        heroTreatment: e.heroTreatment,
        ctaPattern: e.ctaPattern,
        trustSignals: e.trustSignals.slice(0, 6),
        distinctiveMoves: e.distinctiveMoves,
        weaknesses: e.weaknesses,
        vocabulary: e.vocabulary,
      })),
    },
    null,
    1,
  )
}

async function familyCopy(vertical, members, traits, cache) {
  const input = familyInput(vertical, members, traits)
  const cacheKey = createHash('sha256').update(`${MODEL}\n${FAMILY_SYSTEM}\n${input}`).digest('hex').slice(0, 16)
  if (cache[cacheKey]) return cache[cacheKey]
  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    system: FAMILY_SYSTEM,
    output_config: { effort: 'medium', format: zodOutputFormat(FamilyCopy) },
    messages: [{ role: 'user', content: `Family members:\n${input}\n\nWrite this family's copy-brief fields.` }],
  })
  if (response.stop_reason === 'refusal') throw new Error(`family copy refused (${response.stop_details?.category ?? 'no category'})`)
  if (!response.parsed_output) throw new Error(`family copy: no parsed output (stop_reason ${response.stop_reason})`)
  const copy = { ...response.parsed_output, model: response.model, usage: { input: response.usage.input_tokens, output: response.usage.output_tokens } }
  cache[cacheKey] = copy
  return copy
}

function familyBrief(fam, dna, never) {
  return `Aesthetic: ${fam.name.toLowerCase()} (${fam.aesthetic})
Vocabulary: ${fam.vocabulary.join(', ')}
Reference feel: ${fam.reference.join(', ')}
House DNA: ${dna.join('; ')}
Never: ${[...fam.never, ...never].join(', ')}
One risk: ${fam.risk}

WORKFLOW - asset first, page second:
Step 1. Generate the hero asset NOW, before any code. Fill [SUBJECT], then Higgsfield gpt_image_2, 16:9, resolution 2k, quality high:
  "${fam.heroImageRecipe}"
  It must read as a full-bleed hero background (camera inside the scene, edges bleed, negative space held for the headline) - not an isolated 3D asset or product render.
Step 2. Build the page AROUND the real asset - measure its negative space and place typography where the image leaves room.
Everything else: your call. Surprise me.`
}

async function buildFamilies(vertical, entries, dna, never, cache) {
  const feats = entries.map(features)
  const dist = feats.map((a) => feats.map((b) => distance(a, b)))
  const tried = []
  for (const k of [4, 5, 6]) {
    const result = k <= entries.length / 2 ? kMedoids(dist, k) : null
    tried.push(result ? { k, clusters: result.clusters, silhouette: silhouette(result.clusters, dist) } : { k, clusters: null, silhouette: null })
  }
  const best = tried.filter((t) => t.clusters).sort((a, b) => b.silhouette - a.silhouette || a.k - b.k)[0]
  if (!best) throw new Error(`${vertical}: no 4-6 family split with at least 2 sites per family`)
  const families = []
  for (const cluster of best.clusters) {
    const members = cluster.map((i) => entries[i])
    const fs = cluster.map((i) => feats[i])
    const dark = fs.reduce((s, f) => s + f.dark, 0) / fs.length
    const traits = {
      ground: dark >= 0.35 ? 'dark-heavy ground' : dark >= 0.15 ? 'light ground with dark bands' : 'light ground',
      accent: tally(members.map((e) => colorName(e.palette.accent)))[0].value,
      hero: tally(fs.map((f) => f.hero))[0].value,
      type: tally(fs.map((f) => f.type))[0].value,
      darkShare: Number(dark.toFixed(2)),
    }
    const copy = await familyCopy(vertical, members, traits, cache)
    const lead = members.find((e) => e.id === copy.lead) ?? members[0]
    const li = entries.indexOf(lead)
    const ordered = [lead, ...members.filter((e) => e !== lead).sort((a, b) => dist[li][entries.indexOf(a)] - dist[li][entries.indexOf(b)])]
    families.push({
      name: copy.name,
      aesthetic: copy.aesthetic,
      lead: lead.id,
      members: ordered.map((e) => e.id),
      medoid: members[0].id,
      traits,
      segments: Object.fromEntries(SEGMENTS.map((s) => [s, members.filter((e) => e.segment === s).length])),
      vocabulary: copy.vocabulary.slice(0, 12),
      never: copy.never.slice(0, 7),
      risk: copy.risk,
      heroImageRecipe: copy.heroImageRecipe,
      reference: ordered.slice(0, 3).map((e) => `${e.company}, ${e.metro} (${new URL(e.finalUrl).hostname.replace(/^www\./, '')})`),
      copyModel: copy.model,
    })
  }
  families.sort((a, b) => b.members.length - a.members.length)
  const out = families.map((f, i) => {
    const fam = { id: `F${i + 1}`, ...f }
    fam.brief = familyBrief(fam, dna, never)
    return fam
  })
  return {
    families: out,
    k: best.k,
    silhouette: Number(best.silhouette.toFixed(3)),
    tried: tried.map((t) => ({ k: t.k, silhouette: t.silhouette === null ? null : Number(t.silhouette.toFixed(3)) })),
  }
}

// ---------- contact sheet ----------

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

async function contactSheet(page, vertical, entries, families, out) {
  const familyOf = Object.fromEntries(families.flatMap((f) => f.members.map((id) => [id, f.id])))
  const cards = entries
    .map(
      (e, i) =>
        `<figure><img src="/img/${e.slug}.jpg"><figcaption><b>${i + 1}. ${esc(e.company)}</b><span>${esc(e.segment.replace('_', ' '))} · ${esc(e.metro)} · ${familyOf[e.id]}</span></figcaption></figure>`,
    )
    .join('')
  const legend = families.map((f) => `<span><b>${f.id}</b> ${esc(f.name)}</span>`).join('')
  const title = `${vertical[0].toUpperCase()}${vertical.slice(1)}: ${entries.length} real contractor homepages`
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    body { margin: 0; padding: 20px; background: #f3f3f1; font: 14px/1.35 system-ui, -apple-system, 'Segoe UI', sans-serif; color: #1d1d1b; width: 1520px; box-sizing: border-box; }
    h1 { margin: 0 0 6px; font-size: 20px; font-weight: 650; }
    h1 small { font-weight: 400; color: #5a5a55; font-size: 14px; margin-left: 8px; }
    .legend { margin: 0 0 14px; display: flex; flex-wrap: wrap; gap: 4px 18px; font-size: 13px; color: #3c3c38; }
    .grid { display: grid; grid-template-columns: repeat(4, 356px); gap: 16px; }
    figure { margin: 0; background: #fff; border: 1px solid #d8d8d2; }
    img { display: block; width: 356px; height: 223px; object-fit: cover; object-position: top; border-bottom: 1px solid #e3e3de; }
    figcaption { padding: 7px 9px 9px; }
    figcaption b { display: block; font-size: 13.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    figcaption span { display: block; font-size: 12px; color: #5a5a55; }
  </style></head><body><h1>${esc(title)}<small>desktop 1440×900 first viewport · RFD.VAULT.4</small></h1><p class="legend">${legend}</p><div class="grid">${cards}</div></body></html>`
  await page.unrouteAll()
  await page.route('http://vault.local/**', (route) => {
    const m = new URL(route.request().url()).pathname.match(/^\/img\/(.+)\.jpg$/)
    if (m) return route.fulfill({ contentType: 'image/jpeg', body: readFileSync(join(RAW, vertical, m[1], 'desktop-fold.jpg')) })
    return route.fulfill({ contentType: 'text/html', body: html })
  })
  await page.goto('http://vault.local/')
  await page.waitForFunction(() => [...document.images].every((i) => i.complete))
  for (const quality of [82, 72, 62, 50]) {
    await page.screenshot({ path: out, fullPage: true, type: 'jpeg', quality })
    const bytes = statSync(out).size
    if (bytes < SHEET_MAX_BYTES) return bytes
  }
  throw new Error(`${out} is still over 1.5 MB at quality 50`)
}

// ---------- report data ----------

function reportData(vertical, vault) {
  const c = vault.conventions
  const row = (label, v) => `| ${label} | ${v.count}/${v.of} | ${v.rule} |`
  const name = (id) => vault.entries.find((e) => e.id === id).company
  return [
    `## ${vertical}`,
    '',
    '| Convention | Sites | How counted |',
    '|---|---|---|',
    row('Sticky phone (pinned call/phone)', c.stickyPhone),
    row('Sticky header', c.stickyHeader),
    row('Phone on first mobile screen', c.phoneFirstMobileScreen),
    row('Call link on first mobile screen', c.callLinkFirstMobileScreen),
    row('Trust bar', c.trustBar),
    row('Coupon / financing block', c.couponOrFinancing),
    row('Service-area list', c.serviceAreaList),
    row('Reviews widget', c.reviewsWidget),
    row('Booking / quote form', c.bookingForm),
    row('Phone-first', c.phoneFirst),
    row('Form- or booking-first', c.formOrBookingFirst),
    row('Balanced (phone and form)', c.balancedConversion),
    row('License number shown', c.licenseNumberShown),
    row('24/7 / emergency wording', c.emergency247),
    `| Median CTA label | "${c.medianCtaLabel?.label ?? 'n/a'}" (${c.medianCtaLabel?.sites ?? 0}) | ${c.medianCtaLabel?.rule ?? ''} |`,
    `| Palette hues (accent) | ${c.paletteHues.accent.map((h) => `${h.hue} ${h.sites}`).join(', ')} | vision palette.accent, hue family |`,
    `| Ground | ${c.paletteHues.ground.map((h) => `${h.ground} ${h.sites}`).join(', ')} | sampled backgrounds darker than L 0.35 |`,
    `| Median LCP | ${c.lcpMsMedian.desktop} ms desktop / ${c.lcpMsMedian.mobile} ms mobile | lab, unthrottled |`,
    '',
    `Top CTA labels: ${c.ctaLabels.map((l) => `"${l.label}" ${l.sites}`).join(', ')}`,
    `Display fonts: ${c.displayFonts.map((f) => `${f.font} ${f.sites}`).join(', ')}`,
    `Heroes: ${c.heroClasses.map((h) => `${h.hero} ${h.sites}`).join(', ')}; platforms: ${c.platforms.map((p) => `${p.platform} ${p.sites}`).join(', ')}; schedulers: ${c.schedulers.map((s) => `${s.vendor} ${s.sites}`).join(', ') || 'none'}`,
    '',
    `Families (k=${vault.meta.clustering.k}, silhouette ${vault.meta.clustering.silhouette}):`,
    ...vault.families.map((f) => `- ${f.id} ${f.name} (${f.members.length}): ${f.aesthetic} [lead ${name(f.lead)}; ${f.members.map(name).join(', ')}]`),
    '',
    'Sites:',
    ...vault.entries.map(
      (e) =>
        `- ${e.company} (${e.segment}, ${e.metro}, ${e.family}) LCP ${e.facts.lcpMs.desktop}/${e.facts.lcpMs.mobile} ms, phone390 ${e.facts.phoneVisibleFirstViewport390 ? 'y' : 'n'}, sticky ${e.facts.stickyHeader ? 'y' : 'n'}, fit R${e.segmentFit.residential} C${e.segmentFit.commercial} N${e.segmentFit.new_construction}\n  aesthetic: ${e.aesthetic}\n  moves: ${e.distinctiveMoves.join(' | ')}\n  weak: ${e.weaknesses.join(' | ')}`,
    ),
    '',
  ].join('\n')
}

// ---------- main ----------

let failures = 0
const report = []
const cache = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, 'utf8')) : {}
const browser = await chromium.launch()
try {
  const context = await browser.newContext({ viewport: { width: 1520, height: 900 }, deviceScaleFactor: 1 })
  const page = await context.newPage()
  for (const vertical of VERTICALS) {
    const dir = join(RAW, vertical)
    const order = sites.sites.filter((s) => s.vertical === vertical && s.role === 'primary').map((s) => s.slug)
    const entries = (existsSync(dir) ? readdirSync(dir) : [])
      .filter((slug) => existsSync(join(dir, slug, 'entry.json')))
      .map((slug) => JSON.parse(readFileSync(join(dir, slug, 'entry.json'), 'utf8')))
      .sort((a, b) => SEGMENTS.indexOf(a.segment) - SEGMENTS.indexOf(b.segment) || order.indexOf(a.slug) - order.indexOf(b.slug))
    if (entries.length < 10) {
      console.error(`FAIL ${vertical}: ${entries.length} entries, need at least 10`)
      failures++
      continue
    }
    const conventions = conventionsFor(entries)
    const dna = houseDna(conventions)
    const missedPhone = entries.length - conventions.phoneFirstMobileScreen.count
    const never = missedPhone ? [`Phone number below the first mobile screen (${missedPhone}/${entries.length} real sites)`] : []
    const { families, k, silhouette: score, tried } = await buildFamilies(vertical, entries, dna, never, cache)
    writeFileSync(CACHE, JSON.stringify(cache, null, 2) + '\n')
    const familyOf = Object.fromEntries(families.flatMap((f) => f.members.map((id) => [id, f.id])))
    const picks = sites.sites
      .filter((s) => s.vertical === vertical && s.role === 'primary')
      .map((s) => {
        const log = captureLog.find((r) => r.vertical === vertical && r.slug === s.slug)
        const entry = entries.some((e) => e.slug === s.slug)
        return { slug: s.slug, company: s.company, segment: s.segment, metro: s.metro, query: s.query, rank: s.rank, status: entry ? 'entry' : log?.status ?? 'not captured', reason: entry ? undefined : log?.reason }
      })
    const vault = {
      meta: {
        vertical,
        brick: 'RFD.VAULT.4',
        generatedAt: new Date().toISOString(),
        entries: entries.length,
        picks,
        search: { metros: sites.meta.metros, queries: sites.meta.queries[vertical], rankMethod: sites.meta.rankMethod, blockedDomains: sites.meta.blockedDomains[vertical] },
        capture: 'Playwright Chromium, desktop 1440x900 and mobile 390x844 full-page PNGs; facts from the live DOM (scripts/vault-capture.mjs)',
        vision: `${[...new Set(entries.map((e) => e.ingest.model))].join(', ')}, effort ${entries[0].ingest.effort}, desktop screenshot strips (scripts/vault-ingest.mjs)`,
        clustering: { method: 'exhaustive k-medoids on palette/type/hero distance, at least 2 sites per family, k by silhouette', k, silhouette: score, tried },
        familyCopy: `${MODEL}, text only, from member entries; House DNA from counted conventions`,
        contactSheet: `${vertical}-contact-sheet.jpg`,
      },
      conventions,
      families,
      entries: entries.map((e) => ({ ...e, family: familyOf[e.id] })),
    }
    writeFileSync(join(VAULTS, `${vertical}.json`), JSON.stringify(vault, null, 2) + '\n')
    try {
      const bytes = await contactSheet(page, vertical, vault.entries, families, join(VAULTS, `${vertical}-contact-sheet.jpg`))
      console.log(`ok   ${vertical}: ${entries.length} entries, ${families.length} families (silhouette ${score}), contact sheet ${Math.round(bytes / 1000)} KB`)
    } catch (err) {
      console.error(`FAIL ${vertical}: ${err.message}`)
      failures++
    }
    if (families.length < 4) {
      console.error(`FAIL ${vertical}: ${families.length} families, need at least 4`)
      failures++
    }
    report.push(reportData(vertical, vault))
  }
} finally {
  await browser.close()
}
writeFileSync(join(RAW, 'report-data.md'), report.join('\n'))
console.log(`report data in ${join(RAW, 'report-data.md')}`)
if (failures) process.exit(1)
