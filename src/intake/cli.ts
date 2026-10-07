import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import sharp from 'sharp'
import { ZodError } from 'zod'
import { DesignBriefSchema, type DesignBrief } from '../brief/design-brief'
import { VISION_MODEL, createAiClient, describeError } from './ai'
import { extractSite, type SiteExtract } from './extract'
import { FETCH_TIMEOUT_MS, USER_AGENT, fetchSite } from './fetch'
import { isEmpty, mergeBrief, parseLeadBrief, rebaseAssets, type SiteFields } from './merge'
import { assertLeadPath, defaultSlug, leadPaths, type LeadPaths } from './paths'
import { collectPhotoUrls, downloadImages, selectPhotos, type KeptPhoto } from './photos'
import { refineWithAi, type RefineResult } from './refine'
import { intakeReport, summaryTable, type PhotoRow } from './report'
import { captureCurrentSite, type CurrentSiteShots } from './screenshot'
import { mapTaggedPhotos, tagPhotos, type PhotoPlan, type Tagged } from './vision'

/**
 * Step 8: `npm run intake -- --url https://prospect.com [--brief lead.json] [--slug name]`.
 * Runs fetch → extract → photos → vision → refine → screenshot → merge,
 * validates the brief, and only then writes leads/<slug>/, public/leads/<slug>/
 * and src/brief/fixtures/lead-<slug>.json. Exits non-zero when the brief
 * does not validate.
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')

const USAGE = `Usage: npm run intake -- --url https://prospect.com [--brief path/to/design-brief.json] [--slug name]`

function step(name: string) {
  console.log(`\n▸ ${name}`)
}

function note(message: string) {
  console.log(`  ${message}`)
}

function siteUrl(raw: string): string {
  const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`)
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error(`not a web URL: ${raw}`)
  return url.href
}

interface Logo {
  file: string
  bytes: Buffer
}

const LOGO_TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'image/x-icon': 'ico',
  'image/vnd.microsoft.icon': 'ico',
}

/** The logo file: SVG and ICO as served, other rasters capped at 200px tall as PNG. */
async function fetchLogo(url: string): Promise<Logo> {
  const res = await fetch(url, { headers: { 'user-agent': USER_AGENT }, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const bytes = Buffer.from(await res.arrayBuffer())
  const type = (res.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase()
  const ext = LOGO_TYPES[type] ?? /\.(svg|ico|png|jpe?g|webp)(?:$|\?)/i.exec(new URL(url).pathname)?.[1]?.toLowerCase()
  if (ext === 'svg' || ext === 'ico') return { file: `logo.${ext}`, bytes }
  const png = await sharp(bytes).resize({ height: 200, withoutEnlargement: true }).png().toBuffer()
  return { file: 'logo.png', bytes: png }
}

function photoFile(index: number): string {
  return `photos/${String(index + 1).padStart(2, '0')}.jpg`
}

/** Everything the site gave, as brief fields with where each came from. */
function siteFields(args: {
  url: string
  slug: string
  ex: SiteExtract
  kept: KeptPhoto[]
  plan: PhotoPlan<Tagged<KeptPhoto>>
  visionModel: string | null
  refined: RefineResult
  logo: Logo | null
  shots: CurrentSiteShots
}): SiteFields {
  const { ex, kept, plan, refined } = args
  const fileOf = (t: Tagged<KeptPhoto>) => photoFile(kept.indexOf(t.item))
  const aiFell = (field: string) => refined.fallbacks.some((f) => f.field === field)
  const refinedBy = (field: string) => (aiFell(field) || !refined.model ? 'deterministic fallback' : `refined by ${refined.model}`)
  const phone = ex.phone?.value ?? null
  const tel = phone ? `tel:${phone.replace(/\D/g, '')}` : null
  const rating = ex.rating?.value

  const fields: SiteFields = {
    business_name: ex.businessName
      ? { value: ex.businessName.value, status: 'found', how: ex.businessName.how }
      : { value: new URL(args.url).hostname.replace(/^www\./, ''), status: 'inferred', how: 'hostname' },
    vertical: ex.vertical
      ? { value: ex.vertical.value, status: 'inferred', how: ex.vertical.how }
      : { value: 'general_contractor', status: 'inferred', how: 'no trade words found' },
    tone_descriptors: { value: refined.tone_descriptors, status: 'inferred', how: refinedBy('tone_descriptors') },
    services: {
      value: refined.services,
      status: aiFell('services') || !refined.model ? 'found' : 'inferred',
      how: aiFell('services') || !refined.model ? 'nav/heading keywords (fallback)' : refinedBy('services'),
    },
    review_quotes: { value: ex.reviews?.value ?? [], status: 'found', how: ex.reviews?.how ?? 'JSON-LD Review' },
    photo_urls: { value: plan.photos.map(fileOf), status: 'inferred', how: `tagged by ${args.visionModel ?? VISION_MODEL}` },
    hours: ex.hours
      ? { value: ex.hours.value, status: 'found', how: ex.hours.how }
      : { value: refined.hours, status: 'inferred', how: refinedBy('hours') },
    phone: { value: phone, status: 'found', how: ex.phone?.how ?? 'tel: link / page text' },
    address: { value: ex.address?.value ?? null, status: 'found', how: ex.address?.how ?? 'JSON-LD / page text' },
    primary_cta: ex.cta
      ? { value: ex.cta.value, status: 'found', how: ex.cta.how }
      : tel
        ? { value: { label: 'Call now', kind: 'phone', href: tel }, status: 'inferred', how: 'no booking link; click-to-call' }
        : { value: { label: 'Contact us', kind: 'form', href: args.url }, status: 'inferred', how: 'no booking link or phone' },
    current_site_problem: { value: refined.current_site_problem ?? '', status: 'inferred', how: refinedBy('current_site_problem') },
    generated_at: { value: args.shots.capturedAt, status: 'generated', how: 'intake run time' },
    source: {
      value: {
        audit_id: `intake-${args.slug}-${args.shots.capturedAt.replace(/\D/g, '').slice(0, 12)}`,
        ...(args.visionModel ? { haiku_model: args.visionModel } : {}),
        template_fallback: refined.model === null,
      },
      status: 'generated',
      how: 'intake run',
    },
    service_areas: { value: ex.serviceAreas?.value ?? [], status: 'found', how: ex.serviceAreas?.how ?? '' },
    badges: {
      value: rating
        ? [{ label: rating.count ? `${rating.count.toLocaleString('en-US')} reviews` : 'Customer rating', kind: 'rating', value: rating.value }]
        : [],
      status: 'found',
      how: ex.rating?.how ?? 'JSON-LD AggregateRating',
    },
    founded_year: { value: ex.foundedYear?.value ?? null, status: 'found', how: ex.foundedYear?.how ?? '' },
    license_number: { value: ex.license?.value ?? null, status: 'found', how: ex.license?.how ?? '' },
    crew_photo_urls: { value: plan.crew.map(fileOf), status: 'inferred', how: `tagged by ${args.visionModel ?? VISION_MODEL}` },
    segment: { value: refined.segment, status: 'inferred', how: refinedBy('segment') },
    hours_note: { value: ex.hoursNote?.value ?? null, status: 'found', how: ex.hoursNote?.how ?? '' },
    website_url: { value: args.url, status: 'found', how: 'fetched homepage' },
    logo_url: { value: args.logo?.file ?? null, status: 'found', how: ex.logoUrl?.how ?? 'no logo found' },
    brand_colors: { value: ex.brandColors?.value ?? [], status: 'found', how: ex.brandColors?.how ?? '' },
    current_site: {
      value: { desktop_url: 'current-desktop.jpg', mobile_url: 'current-mobile.jpg', captured_at: args.shots.capturedAt },
      status: 'generated',
      how: 'Playwright, first viewport, 1440x900 and 390x844',
    },
  }
  return fields
}

async function writeLead(
  paths: LeadPaths,
  files: { brief: DesignBrief; appBrief: DesignBrief; report: string; kept: KeptPhoto[]; logo: Logo | null; shots: CurrentSiteShots },
): Promise<void> {
  const put = async (target: string, data: string | Buffer) => {
    const abs = assertLeadPath(paths, target)
    await mkdir(dirname(abs), { recursive: true })
    await writeFile(abs, data)
  }
  // A re-run replaces the lead wholesale, so no stale photo survives it.
  await rm(paths.leadDir, { recursive: true, force: true })
  await rm(paths.publicDir, { recursive: true, force: true })

  const assets: Array<[file: string, data: Buffer]> = [
    ...files.kept.map((photo, i): [string, Buffer] => [photoFile(i), photo.jpeg]),
    ['current-desktop.jpg', files.shots.desktop],
    ['current-mobile.jpg', files.shots.mobile],
    ...(files.logo ? [[files.logo.file, files.logo.bytes] as [string, Buffer]] : []),
  ]
  for (const [file, data] of assets) {
    await put(join(paths.leadDir, file), data)
    await put(join(paths.publicDir, file), data)
  }
  await put(join(paths.leadDir, 'brief.json'), `${JSON.stringify(files.brief, null, 2)}\n`)
  await put(join(paths.leadDir, 'intake-report.md'), files.report)
  await put(paths.fixture, `${JSON.stringify(files.appBrief, null, 2)}\n`)
}

async function main(argv: string[]): Promise<number> {
  const { values } = parseArgs({
    args: argv,
    options: { url: { type: 'string' }, brief: { type: 'string' }, slug: { type: 'string' }, help: { type: 'boolean', short: 'h' } },
  })
  if (values.help) {
    console.log(USAGE)
    return 0
  }
  if (!values.url) {
    console.error(USAGE)
    return 2
  }

  const url = siteUrl(values.url)
  let lead: Partial<DesignBrief> | null = null
  if (values.brief) {
    try {
      lead = parseLeadBrief(JSON.parse(await readFile(values.brief, 'utf8')))
    } catch (error) {
      console.error(`--brief ${values.brief} is not a usable DesignBrief: ${error instanceof ZodError ? error.message : describeError(error)}`)
      return 1
    }
  }
  const paths = leadPaths(ROOT, values.slug ?? defaultSlug(lead?.business_name, url))
  const ai = createAiClient()
  const flags: string[] = []

  step(`fetch ${url}`)
  const site = await fetchSite(url)
  note(`${site.pages.length} page(s), ${site.stylesheets.length} stylesheet(s)`)
  for (const failure of site.failures) flags.push(`fetch: ${failure}`)

  step('extract')
  const ex = extractSite(site)
  note(`${ex.serviceCandidates.length} service candidates, ${ex.brandColors?.value.length ?? 0} brand colors`)

  step('photos')
  const photoUrls = collectPhotoUrls(site.pages, site.homeUrl).filter((u) => u !== ex.logoUrl?.value)
  const downloads = await downloadImages(photoUrls)
  const kept = await selectPhotos(downloads.candidates)
  note(`${photoUrls.length} found, ${downloads.candidates.length} downloaded, ${kept.length} kept (≥ 600px)`)
  if (downloads.failures.length > 0) flags.push(`photos: ${downloads.failures.length} download(s) failed`)

  let logo: Logo | null = null
  if (ex.logoUrl) {
    try {
      logo = await fetchLogo(ex.logoUrl.value)
      note(`logo ${logo.file} from ${ex.logoUrl.value}`)
    } catch (error) {
      flags.push(`logo: ${ex.logoUrl.value} could not be saved (${describeError(error)})`)
    }
  }

  step(`vision (${kept.length} photos)`)
  const vision = await tagPhotos(ai, kept)
  const plan = mapTaggedPhotos(vision.tagged)
  for (const t of vision.tagged) if (t.error) flags.push(`vision: ${t.item.url} untagged (${t.error})`)
  if (plan.fallback.length > 0) {
    flags.push(
      `photos: fewer than 3 real photos on the site; ${plan.fallback.length} stock/other photo(s) used to top up (${plan.fallback.map((t) => photoFile(kept.indexOf(t.item))).join(', ')})`,
    )
  }

  step('refine')
  const refined = await refineWithAi(
    ai,
    {
      businessName: lead?.business_name ?? ex.businessName?.value ?? null,
      vertical: lead?.vertical ?? ex.vertical?.value ?? 'general_contractor',
      websiteUrl: site.homeUrl,
      serviceCandidates: ex.serviceCandidates,
      hoursText: ex.hoursText,
      text: ex.text,
      signals: ex.signals,
      needsProblem: isEmpty(lead?.current_site_problem),
    },
    note,
  )
  for (const f of refined.fallbacks) flags.push(`refine: ${f.field} fell back to the deterministic value (${f.reason})`)

  step('screenshot')
  const shots = await captureCurrentSite(site.homeUrl)

  step('merge')
  const fields = siteFields({ url: site.homeUrl, slug: paths.slug, ex, kept, plan, visionModel: vision.model, refined, logo, shots })
  let merged: ReturnType<typeof mergeBrief>
  let appBrief: DesignBrief
  try {
    merged = mergeBrief(lead, fields)
    appBrief = DesignBriefSchema.parse(rebaseAssets(merged.brief, paths.publicBase))
  } catch (error) {
    console.error('\nThe brief does not validate; nothing was written.')
    console.error(error instanceof ZodError ? JSON.stringify(error.issues, null, 2) : describeError(error))
    return 1
  }

  const use = (t: Tagged<KeptPhoto>): PhotoRow['use'] =>
    plan.fallback.includes(t) ? 'stock fallback' : plan.crew.includes(t) ? 'crew' : plan.photos.includes(t) ? 'photo' : 'unused'
  const report = intakeReport({
    slug: paths.slug,
    url: site.homeUrl,
    brief: merged.brief,
    provenance: merged.provenance,
    photos: vision.tagged.map((t, i) => ({ file: photoFile(i), source: t.item.url, tag: t.tag, use: use(t), error: t.error })),
    segmentReason: merged.provenance.segment.status === 'lead' ? 'from the lead brief' : refined.segment_reason,
    models: { vision: vision.model, text: refined.model },
    flags,
  })

  step('write')
  await writeLead(paths, { brief: merged.brief, appBrief, report, kept, logo, shots })
  note(`leads/${paths.slug}/ · public/leads/${paths.slug}/ · src/brief/fixtures/${paths.briefName}.json`)

  console.log(`\n${summaryTable(merged.brief, merged.provenance)}`)
  if (flags.length > 0) console.log(`\nFlags (also in leads/${paths.slug}/intake-report.md):\n${flags.map((f) => `  - ${f}`).join('\n')}`)
  console.log(`\nRun it:\n  VITE_BRIEF=${paths.briefName} npm run dev\n  http://localhost:5173/?brief=${paths.briefName}`)
  return 0
}

main(process.argv.slice(2)).then(
  (code) => {
    process.exitCode = code
  },
  (error: unknown) => {
    console.error(`\nintake failed: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`)
    process.exitCode = 1
  },
)
