import { DesignBriefSchema, type DesignBrief } from '../brief/design-brief'
import { parseLeadBrief } from './merge'

/**
 * `npm run intake -- --lead <businessId>`: the DesignBrief the leads app
 * already made for a business, pulled from its worker. Every worker /api
 * route wants a Supabase user JWT as a Bearer token, so intake first signs
 * in with the leads dashboard login from .env (Supabase's password grant
 * is one fetch, so no new dependency).
 */

export const LEADS_ENV_KEYS = ['LEADS_API_URL', 'LEADS_SUPABASE_URL', 'LEADS_SUPABASE_ANON_KEY', 'LEADS_EMAIL', 'LEADS_PASSWORD'] as const
type LeadsEnvKey = (typeof LEADS_ENV_KEYS)[number]

function required<K extends LeadsEnvKey>(...keys: K[]): Record<K, string> {
  const values = {} as Record<K, string>
  const missing: K[] = []
  for (const key of keys) {
    values[key] = (process.env[key] ?? '').trim()
    if (!values[key]) missing.push(key)
  }
  if (missing.length > 0) throw new Error(`Set ${missing.join(', ')} in .env (see .env.example)`)
  return values
}

/** The worker's base URL from LEADS_API_URL, without a trailing slash. */
export function leadsApiUrl(): string {
  return required('LEADS_API_URL').LEADS_API_URL.replace(/\/+$/, '')
}

async function reach(what: string, url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init)
  } catch (error) {
    throw new Error(`could not reach ${what} at ${new URL(url).origin} (${error instanceof Error ? error.message : String(error)})`)
  }
}

/** The error text a JSON error body carries (worker: error; Supabase: error_description, msg), or ''. */
async function errorDetail(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: unknown; error_description?: unknown; msg?: unknown }
    const text = [body.error_description, body.msg, body.error].find((v) => typeof v === 'string' && v.trim())
    return typeof text === 'string' ? `: ${text}` : ''
  } catch {
    return ''
  }
}

/** A Supabase access token for the leads dashboard login (LEADS_EMAIL / LEADS_PASSWORD). */
export async function signIn(): Promise<string> {
  const env = required('LEADS_SUPABASE_URL', 'LEADS_SUPABASE_ANON_KEY', 'LEADS_EMAIL', 'LEADS_PASSWORD')
  const res = await reach('Supabase', `${env.LEADS_SUPABASE_URL.replace(/\/+$/, '')}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: env.LEADS_SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: env.LEADS_EMAIL, password: env.LEADS_PASSWORD }),
  })
  if (res.status === 400 || res.status === 401) {
    throw new Error(`leads sign-in refused (HTTP ${res.status}${await errorDetail(res)}); check LEADS_EMAIL and LEADS_PASSWORD in .env`)
  }
  if (!res.ok) throw new Error(`leads sign-in failed (HTTP ${res.status}${await errorDetail(res)})`)
  const body = (await res.json()) as { access_token?: unknown }
  if (typeof body.access_token !== 'string' || !body.access_token) throw new Error('leads sign-in returned no access_token')
  return body.access_token
}

/** The worker's answer as an Error, with the three statuses intake expects spelled out. */
async function apiError(res: Response, businessId: string): Promise<Error> {
  const detail = await errorDetail(res)
  switch (res.status) {
    case 401:
      return new Error(`leads API: token rejected (HTTP 401${detail})`)
    case 404:
      return new Error(`leads API: business not found in your workspace (${businessId})`)
    case 409:
      return new Error(`leads API: no completed audit — run the audit in the leads dashboard first (${businessId})`)
    default:
      return new Error(`leads API: HTTP ${res.status}${detail}`)
  }
}

function bearer(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` }
}

/** Worker-relative photo paths ("/api/places/photo/…") as absolute URLs on LEADS_API_URL; absolute URLs are kept. */
export function absolutePhotoUrls(urls: string[], apiUrl: string): string[] {
  return urls.map((u) => new URL(u, `${apiUrl}/`).href)
}

const SNAKE_CASE = /^[a-z0-9]+(?:_[a-z0-9]+)*$/

function snakeCase(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

export interface LeadBrief {
  /** The worker's response body exactly as received. */
  raw: unknown
  /** The brief after DesignBriefSchema.parse, photo_urls absolute: complete, with schema defaults. */
  brief: DesignBrief
  /** The same brief with only the fields the leads app sent, for mergeBrief (absent stays absent). */
  fields: Partial<DesignBrief>
  /** true when the worker returned its stored brief, false when it ran the agent. */
  stored: boolean
  /** Fields intake changed so the brief would validate, one line each. */
  coerced: string[]
}

/**
 * POST /api/businesses/:id/design-brief[?force=true] → the brief, validated
 * by our DesignBriefSchema. The leads schema is a strict subset of ours;
 * the one rule ours adds is a snake_case vertical, which is coerced here
 * (e.g. "Plumbing Contractor" → "plumbing_contractor") and reported.
 */
export async function fetchLeadBrief(businessId: string, token: string, { force = false } = {}): Promise<LeadBrief> {
  const api = leadsApiUrl()
  const res = await reach('the leads API', `${api}/api/businesses/${encodeURIComponent(businessId)}/design-brief${force ? '?force=true' : ''}`, {
    method: 'POST',
    headers: bearer(token),
  })
  if (!res.ok) throw await apiError(res, businessId)
  const raw = (await res.json()) as { design_brief?: unknown; stored?: unknown }
  if (!raw.design_brief || typeof raw.design_brief !== 'object') throw new Error('leads API: the response has no design_brief')

  const candidate = { ...(raw.design_brief as Record<string, unknown>) }
  const coerced: string[] = []
  if (typeof candidate.vertical === 'string' && !SNAKE_CASE.test(candidate.vertical)) {
    const vertical = snakeCase(candidate.vertical) || 'local_service'
    coerced.push(`vertical "${candidate.vertical}" → "${vertical}" (our schema wants snake_case)`)
    candidate.vertical = vertical
  }
  if (Array.isArray(candidate.photo_urls)) {
    candidate.photo_urls = absolutePhotoUrls(candidate.photo_urls.filter((u): u is string => typeof u === 'string'), api)
  }

  const parsed = DesignBriefSchema.safeParse(candidate)
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ')
    throw new Error(`leads API: the design_brief does not validate against DesignBriefSchema — ${issues}`)
  }
  return { raw, brief: parsed.data, fields: parseLeadBrief(candidate), stored: raw.stored === true, coerced }
}

interface LeadsListResponse {
  leads?: Array<{ business?: { id?: unknown; website_url?: unknown } }>
}

/**
 * The business's website_url from GET /api/leads, the worker's read-only
 * route that lists each workspace lead with its business record. null when
 * the business is not among them; website_url is null when it has none.
 */
export async function fetchLeadWebsite(businessId: string, token: string): Promise<{ website_url: string | null } | null> {
  const res = await reach('the leads API', `${leadsApiUrl()}/api/leads`, { headers: bearer(token) })
  if (!res.ok) throw await apiError(res, businessId)
  const body = (await res.json()) as LeadsListResponse
  const business = (body.leads ?? []).map((l) => l.business).find((b) => b?.id === businessId)
  if (!business) return null
  return { website_url: typeof business.website_url === 'string' && business.website_url.trim() ? business.website_url.trim() : null }
}
