import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { loadEnv } from '@rapidforge/ai-core'
import sharp from 'sharp'
import { ZodError } from 'zod'
import { copyFamilyFor } from '../brief/copy'
import { DesignBriefSchema, type DesignBrief } from '../brief/design-brief'
import { sizedPhotoName } from '../brief/photo-sizes'
import { TRADE_PHOTOS } from '../brief/trade-photos'
import { VISION_MODEL, createAiClient, describeError, type AiClient } from './ai'
import { extractSite, type SiteExtract } from './extract'
import { FETCH_TIMEOUT_MS, USER_AGENT, fetchSite } from './fetch'
import { LEAD_PHOTOS_SKIPPED, LEAD_PHOTOS_STOCK, NO_WEBSITE, fetchLeadBrief, type LeadBrief } from './leads'
import { isEmpty, mergeBrief, parseLeadBrief, rebaseAssets, type SiteFields } from './merge'
import { assertLeadPath, defaultSlug, leadPaths, slugify, type LeadPaths } from './paths'
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
 *
 * RFD.LEADS.10b: `--lead <businessId>` takes the lead brief from the leads
 * Supabase instead of a file (see leads.ts). Its photo_urls are worker-only
 * routes, so they are dropped and the site's own photos fill in.
 *
 * RFD.LEADS.10c: the --lead path is exported as runIntake(), which
 * `npm run demo` calls in-process; importing this file does not run main().
 *
 * RFD.INTAKE.16: a --lead business with no website_url, run without --url,
 * gets a brief-only intake (see briefOnlyIntake): no crawl, the trade's
 * stock photos, and a slug from the business name.
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')

const USAGE = `Usage: npm run intake -- --url https://prospect.com [--brief path/to/design-brief.json] [--slug name]
       npm run intake -- --lead <businessId> [--url https://prospect.com] [--slug name] [--dry]

  --lead   read the DesignBrief from the leads Supabase (LEADS_SUPABASE_URL and
           LEADS_SUPABASE_SERVICE_ROLE_KEY in .env); not with --brief. Without
           --url it crawls the business's website_url in the leads app, or, when
           there is none, runs a brief-only intake (no crawl; stock photos).
  --dry    read, write leads/<slug>/lead-api-brief.json, print the brief; no crawl`

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
  files: {
    brief: DesignBrief
    appBrief: DesignBrief
    report: string
    kept: KeptPhoto[]
    logo: Logo | null
    /** null for a brief-only intake: no site to screenshot. */
    shots: CurrentSiteShots | null
    apiResponse: unknown
  },
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
    ...files.kept.flatMap((photo, i): Array<[string, Buffer]> => [
      [photoFile(i), photo.jpeg],
      ...photo.smaller.map(({ cap, jpeg }): [string, Buffer] => [sizedPhotoName(photoFile(i), cap), jpeg]),
    ]),
    ...(files.shots
      ? [
          ['current-desktop.jpg', files.shots.desktop] as [string, Buffer],
          ['current-mobile.jpg', files.shots.mobile] as [string, Buffer],
        ]
      : []),
    ...(files.logo ? [[files.logo.file, files.logo.bytes] as [string, Buffer]] : []),
  ]
  for (const [file, data] of assets) {
    await put(join(paths.leadDir, file), data)
    await put(join(paths.publicDir, file), data)
  }
  await put(join(paths.leadDir, 'brief.json'), `${JSON.stringify(files.brief, null, 2)}\n`)
  await put(join(paths.leadDir, 'intake-report.md'), files.report)
  if (files.apiResponse !== undefined) await writeApiResponse(paths, files.apiResponse)
  await put(paths.fixture, `${JSON.stringify(files.appBrief, null, 2)}\n`)
}

/** leads/<slug>/lead-api-brief.json: the leads API's response exactly as received. */
async function writeApiResponse(paths: LeadPaths, raw: unknown): Promise<void> {
  const abs = assertLeadPath(paths, join(paths.leadDir, 'lead-api-brief.json'))
  await mkdir(dirname(abs), { recursive: true })
  await writeFile(abs, `${JSON.stringify(raw, null, 2)}\n`)
}

async function main(argv: string[]): Promise<number> {
  const { values } = parseArgs({
    args: argv,
    options: {
      url: { type: 'string' },
      brief: { type: 'string' },
      slug: { type: 'string' },
      lead: { type: 'string' },
      dry: { type: 'boolean' },
      help: { type: 'boolean', short: 'h' },
    },
  })
  if (values.help) {
    console.log(USAGE)
    return 0
  }
  if (values.lead !== undefined && values.brief !== undefined) {
    throw new IntakeError('brief', '--lead and --brief cannot be used together: --lead fetches the brief that --brief would read.', 2)
  }
  if (values.dry && values.lead === undefined) throw new IntakeError('brief', '--dry only applies with --lead.', 2)
  if (values.lead !== undefined) {
    await runIntake({ lead: values.lead, url: values.url, slug: values.slug, dry: values.dry })
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
  await intake({ url, lead, paths })
  return 0
}

export type IntakeStage = 'brief' | 'intake'

/**
 * Why an intake stopped: at "brief" (reading the lead and finding its
 * site) or at "intake" (crawl through write). Code 2 is a usage error,
 * which the CLI prints with USAGE.
 */
export class IntakeError extends Error {
  readonly stage: IntakeStage
  readonly code: 1 | 2

  constructor(stage: IntakeStage, message: string, code: 1 | 2 = 1) {
    super(message)
    this.name = 'IntakeError'
    this.stage = stage
    this.code = code
  }
}

export interface IntakeLeadOptions {
  lead: string
  url?: string
  slug?: string
  dry?: boolean
  /** Where leads/, public/leads/ and the fixture go; the repo root when absent. Tests pass a temp dir. */
  root?: string
  /** Reads the lead; fetchLeadBrief when absent. */
  fetchLead?: (businessId: string) => Promise<LeadBrief>
  /** The model client; createAiClient() when absent. */
  ai?: AiClient
}

export interface IntakeLeadResult {
  businessId: string
  businessName: string
  /** The lead's folder and fixture name; `npm run deploy -- --slug` takes it. */
  slug: string
  /** The site intake crawled, or null for a brief-only intake. */
  url: string | null
}

/**
 * --lead: read the business and its brief, find the website (url, else
 * the business record), always keep the raw rows, then the usual intake
 * with that brief as the lead brief, or stop there with dry. With no
 * website at all, the brief-only intake instead. Throws IntakeError with
 * the stage it stopped at.
 */
export async function runIntake(opts: IntakeLeadOptions): Promise<IntakeLeadResult> {
  const businessId = opts.lead.trim()
  if (!businessId) throw new IntakeError('brief', '--lead needs a business id.', 2)
  loadEnv()
  step(`lead ${businessId}`)
  let url: string | null = null
  let fetched: LeadBrief
  try {
    fetched = await (opts.fetchLead ?? fetchLeadBrief)(businessId)
    note(`${fetched.business.name}: design brief read from the leads Supabase`)
    let website = opts.url ?? null
    if (!website && fetched.business.website_url) {
      website = fetched.business.website_url
      note(`website ${website} (from the leads app)`)
    }
    if (website) url = siteUrl(website)
    else note(`${NO_WEBSITE}: no website_url in the leads app and no --url`)
  } catch (error) {
    throw error instanceof IntakeError ? error : new IntakeError('brief', describeError(error))
  }
  const photosSkipped = url ? LEAD_PHOTOS_SKIPPED : LEAD_PHOTOS_STOCK
  for (const line of fetched.coerced) note(`coerced ${line}`)
  if (fetched.skippedPhotos > 0) note(`${photosSkipped} (${fetched.skippedPhotos} skipped)`)

  // Host-based, as a --url-only intake names it, so a lead re-intaken from the API keeps its folder;
  // with no host, the business name's words.
  const slug = opts.slug ?? (url ? defaultSlug(null, url) : slugify(fetched.business.name || (fetched.fields.business_name ?? '')))
  if (!slug) throw new IntakeError('brief', `Business ${businessId} has no name to make a slug from; pass --slug.`, 2)
  const paths = leadPaths(opts.root ?? ROOT, slug)
  const result: IntakeLeadResult = { businessId, businessName: fetched.business.name, slug: paths.slug, url }
  try {
    await writeApiResponse(paths, fetched.raw)
    note(`leads/${paths.slug}/lead-api-brief.json`)

    if (opts.dry) {
      const preview = mergeBrief(fetched.fields, {})
      console.log(`\n${summaryTable(preview.brief, preview.provenance, url ? undefined : NO_WEBSITE)}`)
      console.log(
        url
          ? `\nDry run: stopped before crawling ${url}. Rerun without --dry to intake it.`
          : '\nDry run: stopped before the brief-only intake. Rerun without --dry to run it.',
      )
      return result
    }

    const flags = [...fetched.coerced.map((line) => `lead: coerced ${line}`), ...(fetched.skippedPhotos > 0 ? [photosSkipped] : [])]
    if (url) await intake({ url, lead: fetched.fields, paths, apiResponse: fetched.raw, flags, ai: opts.ai })
    else await briefOnlyIntake({ lead: fetched.fields, paths, apiResponse: fetched.raw, flags, ai: opts.ai })
  } catch (error) {
    throw error instanceof IntakeError ? error : new IntakeError('intake', `intake failed: ${describeError(error)}`)
  }
  return result
}

/** The lead brief merged over the site fields, and its app copy with assets under public/; throws IntakeError when it does not validate. */
function mergeValid(lead: Partial<DesignBrief> | null, fields: SiteFields, paths: LeadPaths) {
  try {
    const merged = mergeBrief(lead, fields)
    return { merged, appBrief: DesignBriefSchema.parse(rebaseAssets(merged.brief, paths.publicBase)) }
  } catch (error) {
    const detail = error instanceof ZodError ? JSON.stringify(error.issues, null, 2) : describeError(error)
    throw new IntakeError('intake', `The brief does not validate; nothing was written.\n${detail}`)
  }
}

/** The console summary after a write: the table (under `title` when given), the flags, how to run it. */
function printSummary(paths: LeadPaths, merged: ReturnType<typeof mergeBrief>, flags: string[], title?: string): void {
  console.log(`\n${summaryTable(merged.brief, merged.provenance, title)}`)
  if (flags.length > 0) console.log(`\nFlags (also in leads/${paths.slug}/intake-report.md):\n${flags.map((f) => `  - ${f}`).join('\n')}`)
  console.log(`\nRun it:\n  VITE_BRIEF=${paths.briefName} npm run dev\n  http://localhost:5173/?brief=${paths.briefName}`)
}

/**
 * RFD.INTAKE.16: a lead with no website. No fetch, extract, photos, vision
 * or screenshot. The lead brief wins as usual; the trade's stock photos
 * fill photo_urls; brand_colors, website_url and current_site stay empty,
 * and segment takes the schema default (residential) unless the lead set
 * one. The refine pass still runs, over the lead's own services and its
 * review text, and its services and tone take the place of the lead's raw
 * lists, which they only reword; a field the refine could not do keeps the
 * lead's words.
 */
async function briefOnlyIntake(args: {
  lead: Partial<DesignBrief>
  paths: LeadPaths
  apiResponse?: unknown
  flags?: string[]
  ai?: AiClient
}): Promise<void> {
  const { paths } = args
  const ai = args.ai ?? createAiClient()
  const flags: string[] = [...(args.flags ?? []), `${NO_WEBSITE}: no fetch, extract, photos, vision or screenshot`]
  const vertical = args.lead.vertical ?? 'general_contractor'
  const family = copyFamilyFor(vertical)
  const runAt = new Date().toISOString()

  step('refine')
  const refined = await refineWithAi(
    ai,
    {
      businessName: args.lead.business_name ?? null,
      vertical,
      websiteUrl: null,
      serviceCandidates: args.lead.services ?? [],
      hoursText: null,
      text: (args.lead.review_quotes ?? []).map((q) => q.text).join('\n\n'),
      signals: null,
      needsProblem: false,
    },
    note,
  )

  step('merge')
  const lead: Partial<DesignBrief> = { ...args.lead }
  const fields: SiteFields = {
    photo_urls: { value: [...TRADE_PHOTOS[family].hero], status: 'generated', how: `stock photos for the ${family} trade (no website)` },
    generated_at: { value: runAt, status: 'generated', how: 'intake run time' },
    source: {
      value: { audit_id: `intake-${paths.slug}-${runAt.replace(/\D/g, '').slice(0, 12)}`, template_fallback: refined.model === null },
      status: 'generated',
      how: 'intake run',
    },
  }
  for (const field of ['services', 'tone_descriptors'] as const) {
    const fell = refined.fallbacks.find((f) => f.field === field)
    if (refined.model && !fell) {
      delete lead[field]
      fields[field] = { value: refined[field], status: 'inferred', how: `the lead brief's, reworded by ${refined.model}` }
    } else if (!isEmpty(lead[field])) {
      flags.push(`refine: ${field} kept the lead brief's words (${fell?.reason ?? 'no model answered'})`)
    }
  }
  const { merged, appBrief } = mergeValid(lead, fields, paths)

  const report = intakeReport({
    slug: paths.slug,
    url: null,
    brief: merged.brief,
    provenance: merged.provenance,
    photos: [],
    segmentReason: merged.provenance.segment.status === 'lead' ? 'from the lead brief' : 'no website to judge it from; the default',
    models: { vision: null, text: refined.model },
    flags,
  })

  step('write')
  await writeLead(paths, { brief: merged.brief, appBrief, report, kept: [], logo: null, shots: null, apiResponse: args.apiResponse })
  note(`leads/${paths.slug}/ · src/brief/fixtures/${paths.briefName}.json (no site assets for public/leads/${paths.slug}/)`)
  printSummary(paths, merged, flags, NO_WEBSITE)
}

async function intake(args: {
  url: string
  lead: Partial<DesignBrief> | null
  paths: LeadPaths
  apiResponse?: unknown
  flags?: string[]
  ai?: AiClient
}): Promise<void> {
  const { url, lead, paths } = args
  const ai = args.ai ?? createAiClient()
  const flags: string[] = [...(args.flags ?? [])]

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
  const byUrl = vision.tagged.filter((t) => t.vendor).length
  if (byUrl > 0) note(`${byUrl} stock by URL, not sent to vision`)
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
  const { merged, appBrief } = mergeValid(lead, fields, paths)

  const use = (t: Tagged<KeptPhoto>): PhotoRow['use'] =>
    plan.fallback.includes(t) ? 'stock fallback' : plan.crew.includes(t) ? 'crew' : plan.photos.includes(t) ? 'photo' : 'unused'
  const report = intakeReport({
    slug: paths.slug,
    url: site.homeUrl,
    brief: merged.brief,
    provenance: merged.provenance,
    photos: vision.tagged.map((t, i) => ({ file: photoFile(i), source: t.item.url, tag: t.tag, use: use(t), error: t.error, vendor: t.vendor })),
    segmentReason: merged.provenance.segment.status === 'lead' ? 'from the lead brief' : refined.segment_reason,
    models: { vision: vision.model, text: refined.model },
    flags,
  })

  step('write')
  await writeLead(paths, { brief: merged.brief, appBrief, report, kept, logo, shots, apiResponse: args.apiResponse })
  note(`leads/${paths.slug}/ · public/leads/${paths.slug}/ · src/brief/fixtures/${paths.briefName}.json`)
  printSummary(paths, merged, flags)
}

/** True when this file is the process entry (`npm run intake`), not imported (`npm run demo`). */
function isEntry(): boolean {
  const entry = process.argv[1]
  if (!entry) return false
  const same = (p: string) => (process.platform === 'win32' ? p.toLowerCase() : p)
  return same(resolve(entry)) === same(fileURLToPath(import.meta.url))
}

if (isEntry()) {
  main(process.argv.slice(2)).then(
    (code) => {
      process.exitCode = code
    },
    (error: unknown) => {
      if (error instanceof IntakeError) {
        console.error(`\n${error.message}${error.code === 2 ? `\n\n${USAGE}` : ''}`)
        process.exitCode = error.code
        return
      }
      console.error(`\nintake failed: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`)
      process.exitCode = 1
    },
  )
}
