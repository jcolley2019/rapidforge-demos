import { DesignBriefSchema, type DesignBrief } from '../brief/design-brief'
import { parseLeadBrief } from './merge'

/**
 * `npm run intake -- --lead <businessId>`: the DesignBrief the leads app
 * already made for a business, read straight from the leads Supabase over
 * its REST API with the project's service-role key (the dashboard signs in
 * with Google or a magic link, so there is no password to use). The worker
 * does not need to be running.
 */

export const LEADS_ENV_KEYS = ['LEADS_SUPABASE_URL', 'LEADS_SUPABASE_SERVICE_ROLE_KEY'] as const

/** Flag text for the intake report when the lead brief's photos are dropped. */
export const LEAD_PHOTOS_SKIPPED = 'lead photos skipped (worker-only URLs); site photos used'

/** The same, for a business with no website: stock photos fill in. */
export const LEAD_PHOTOS_STOCK = 'lead photos skipped (worker-only URLs); stock photos used'

/** RFD.INTAKE.16: the business has no website_url and no --url was given, so intake works from the lead brief alone. */
export const NO_WEBSITE = 'no website — brief-only intake'

/** The failure when the business has no completed audit with a design brief: where in the leads app to make one. */
export const NO_DESIGN_BRIEF = 'No design brief yet — open the lead in RapidForge Leads, Design Brief tab, click Design brief, then rerun.'

interface LeadsEnv {
  url: string
  key: string
}

function leadsEnv(): LeadsEnv {
  const url = (process.env.LEADS_SUPABASE_URL ?? '').trim().replace(/\/+$/, '')
  const key = (process.env.LEADS_SUPABASE_SERVICE_ROLE_KEY ?? '').trim()
  const missing = LEADS_ENV_KEYS.filter((k) => !(k === 'LEADS_SUPABASE_URL' ? url : key))
  if (missing.length > 0) {
    throw new Error(`--lead reads the leads Supabase directly: set LEADS_SUPABASE_URL and LEADS_SUPABASE_SERVICE_ROLE_KEY in .env (missing: ${missing.join(', ')})`)
  }
  return { url, key }
}

/** One PostgREST read: GET /rest/v1/<table>?<query> with the service-role key, rows back. */
async function select(env: LeadsEnv, table: string, query: URLSearchParams): Promise<unknown[]> {
  const url = `${env.url}/rest/v1/${table}?${query}`
  let res: Response
  try {
    res = await fetch(url, { headers: { apikey: env.key, Authorization: `Bearer ${env.key}`, Accept: 'application/json' } })
  } catch (error) {
    throw new Error(`could not reach the leads Supabase at ${new URL(url).origin} (${error instanceof Error ? error.message : String(error)})`)
  }
  if (!res.ok) throw new Error(`leads Supabase: reading ${table} failed (HTTP ${res.status}${await errorDetail(res)})`)
  const rows = (await res.json()) as unknown
  if (!Array.isArray(rows)) throw new Error(`leads Supabase: reading ${table} returned no rows array`)
  return rows
}

/** ": <message>" from a PostgREST error body, or "" when it has none. */
async function errorDetail(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { message?: unknown }
    if (typeof body.message === 'string') return `: ${body.message}`
  } catch {
    // no JSON body
  }
  return ''
}

/** One PostgREST write: PATCH /rest/v1/<table>?<query> with the service-role key, the changed rows back. */
async function patch(env: LeadsEnv, table: string, query: URLSearchParams, body: object): Promise<unknown[]> {
  const url = `${env.url}/rest/v1/${table}?${query}`
  let res: Response
  try {
    res = await fetch(url, {
      method: 'PATCH',
      headers: {
        apikey: env.key,
        Authorization: `Bearer ${env.key}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(body),
    })
  } catch (error) {
    throw new Error(`could not reach the leads Supabase at ${new URL(url).origin} (${error instanceof Error ? error.message : String(error)})`)
  }
  if (!res.ok) throw new Error(`leads Supabase: updating ${table} failed (HTTP ${res.status}${await errorDetail(res)})`)
  const rows = (await res.json()) as unknown
  if (!Array.isArray(rows)) throw new Error(`leads Supabase: updating ${table} returned no rows array`)
  return rows
}

const SNAKE_CASE = /^[a-z0-9]+(?:_[a-z0-9]+)*$/

function snakeCase(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

export interface LeadBusiness {
  id: string
  name: string
  website_url: string | null
}

export interface LeadBrief {
  /** The two rows as read, { business, audit }, for leads/<slug>/lead-api-brief.json. */
  raw: { business: unknown; audit: unknown }
  business: LeadBusiness
  /** The brief after DesignBriefSchema.parse: complete, with schema defaults, photos as stored. */
  brief: DesignBrief
  /** Only the fields the leads app set, photo_urls emptied, plus lead_business_id, for mergeBrief (absent stays absent). */
  fields: Partial<DesignBrief>
  /** How many worker photo URLs were dropped from fields. */
  skippedPhotos: number
  /** Fields intake changed so the brief would validate, one line each. */
  coerced: string[]
}

/**
 * The business (id, name, website_url) and the design_brief of its newest
 * completed audit that has one, validated by our DesignBriefSchema. The
 * leads schema is a strict subset of ours; the one rule ours adds is a
 * snake_case vertical, coerced here and reported. photo_urls are worker
 * routes that need the worker's auth, so fields gets [] and the site's own
 * photos fill in (stock photos when the business has no website).
 */
export async function fetchLeadBrief(businessId: string): Promise<LeadBrief> {
  const env = leadsEnv()
  const businesses = await select(env, 'businesses', new URLSearchParams({ select: 'id,name,website_url', id: `eq.${businessId}` }))
  const business = businesses[0] as { id?: unknown; name?: unknown; website_url?: unknown } | undefined
  if (!business || typeof business.id !== 'string') throw new Error(`leads Supabase: business ${businessId} not found`)

  const audits = await select(
    env,
    'audits',
    new URLSearchParams({
      select: 'id,completed_at,design_brief',
      business_id: `eq.${businessId}`,
      status: 'eq.completed',
      completed_at: 'not.is.null',
      design_brief: 'not.is.null',
      order: 'completed_at.desc',
      limit: '1',
    }),
  )
  return leadBriefFrom({ ...business, id: business.id }, audits[0])
}

/**
 * The LeadBrief for a business row and its newest audit row as the leads
 * Supabase returns them (see fetchLeadBrief). Pure, so a test can build one
 * from a fixture without a fetch.
 */
export function leadBriefFrom(business: { id: string; name?: unknown; website_url?: unknown }, auditRow: unknown): LeadBrief {
  const audit = auditRow as { design_brief?: unknown } | undefined
  if (!audit || !audit.design_brief || typeof audit.design_brief !== 'object') throw new Error(NO_DESIGN_BRIEF)

  const candidate = { ...(audit.design_brief as Record<string, unknown>) }
  const coerced: string[] = []
  if (typeof candidate.vertical === 'string' && !SNAKE_CASE.test(candidate.vertical)) {
    const vertical = snakeCase(candidate.vertical) || 'local_service'
    coerced.push(`vertical "${candidate.vertical}" → "${vertical}" (our schema wants snake_case)`)
    candidate.vertical = vertical
  }
  const parsed = DesignBriefSchema.safeParse(candidate)
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ')
    throw new Error(`leads Supabase: the design_brief does not validate against DesignBriefSchema — ${issues}`)
  }

  return {
    raw: { business, audit },
    business: {
      id: business.id,
      name: typeof business.name === 'string' ? business.name : '',
      website_url: typeof business.website_url === 'string' && business.website_url.trim() ? business.website_url.trim() : null,
    },
    brief: parsed.data,
    // The business row's id rides along so the built site's picks are saved against it.
    fields: { ...parseLeadBrief({ ...candidate, photo_urls: [] }), lead_business_id: business.id },
    skippedPhotos: parsed.data.photo_urls.length,
    coerced,
  }
}

/**
 * RFD.DEMO.17: businesses.demo_*, the columns the leads app's Demo tab
 * reads. The leads worker writes them around its own `npm run demo`;
 * the demo CLI now writes them too, so a run from the terminal shows up.
 * The statuses are the leads app's: building, ready, failed.
 */
export type DemoStatus = 'building' | 'ready' | 'failed'

export interface BusinessDemo {
  id: string
  name: string
  /** The subdomain the last recorded demo used; null when none was. */
  demo_sub: string | null
}

export interface BusinessDemoPatch {
  demo_status?: DemoStatus
  demo_sub?: string
  demo_url?: string
  demo_preview_url?: string
  demo_built_at?: string
  demo_error?: string | null
}

/** The business's id, name and demo_sub, for the demo CLI's default subdomain. */
export async function fetchBusinessDemo(businessId: string): Promise<BusinessDemo> {
  const businesses = await select(leadsEnv(), 'businesses', new URLSearchParams({ select: 'id,name,demo_sub', id: `eq.${businessId}` }))
  const business = businesses[0] as { id?: unknown; name?: unknown; demo_sub?: unknown } | undefined
  if (!business || typeof business.id !== 'string') throw new Error(`leads Supabase: business ${businessId} not found`)
  return {
    id: business.id,
    name: typeof business.name === 'string' ? business.name : '',
    demo_sub: typeof business.demo_sub === 'string' && business.demo_sub.trim() ? business.demo_sub.trim() : null,
  }
}

/** Sets these demo_* columns on the business row; throws when the write fails or matches no row. */
export async function updateBusinessDemo(businessId: string, demo: BusinessDemoPatch): Promise<void> {
  const rows = await patch(leadsEnv(), 'businesses', new URLSearchParams({ id: `eq.${businessId}`, select: 'id' }), demo)
  if (rows.length === 0) throw new Error(`leads Supabase: business ${businessId} not found`)
}
