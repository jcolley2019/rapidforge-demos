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
  if (!res.ok) {
    let detail = ''
    try {
      const body = (await res.json()) as { message?: unknown }
      if (typeof body.message === 'string') detail = `: ${body.message}`
    } catch {
      // no JSON body
    }
    throw new Error(`leads Supabase: reading ${table} failed (HTTP ${res.status}${detail})`)
  }
  const rows = (await res.json()) as unknown
  if (!Array.isArray(rows)) throw new Error(`leads Supabase: reading ${table} returned no rows array`)
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
  /** Only the fields the leads app set, photo_urls emptied, for mergeBrief (absent stays absent). */
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
 * photos fill in.
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
  const audit = audits[0] as { design_brief?: unknown } | undefined
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
    fields: parseLeadBrief({ ...candidate, photo_urls: [] }),
    skippedPhotos: parsed.data.photo_urls.length,
    coerced,
  }
}
