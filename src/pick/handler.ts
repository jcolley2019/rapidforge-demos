import { PickSchema, reachable, type Pick } from './schema.js'

/**
 * POST /api/pick: validates a pick, saves it as a demo_picks row in the
 * leads Supabase (when the pick carries a businessId and the service-role
 * env is set), then emails it to Joey through Resend's REST API (no SDK)
 * when Resend is configured. Either channel alone is enough. A saved pick
 * from a *.demos.rapidforgeai.com page whose picker left a valid email
 * also gets a confirmation, built from the leads DB's business name and
 * checked fields only (see confirmPick). More than PICK_LIMIT picks a
 * minute from one IP get a 429. The Vercel function in api/pick.ts is a
 * one-line adapter over `handlePick`, which takes its env and fetch as
 * arguments so the tests run without a network.
 */

export interface PickEnv {
  RESEND_API_KEY?: string
  PICK_TO_EMAIL?: string
  PICK_FROM_EMAIL?: string
  LEADS_SUPABASE_URL?: string
  LEADS_SUPABASE_SERVICE_ROLE_KEY?: string
}

export const DEFAULT_FROM = 'onboarding@resend.dev'
export const RESEND_URL = 'https://api.resend.com/emails'
export const PICKS_TABLE = 'demo_picks'
export const NOT_CONFIGURED = 'Pick storage is not configured'
export const BUSINESSES_TABLE = 'businesses'
export const PICK_LIMIT = 5
export const PICK_WINDOW_MS = 60_000
export const TOO_MANY = 'Too many picks from here. Try again in a minute.'

/**
 * The look names a confirmation may carry: the presets' and the Scroll
 * Story's. A list here, not read from presets.json, so the Vercel function
 * imports no JSON; a test holds it to the presets.
 */
export const LOOK_NAMES: readonly string[] = ['Clean Trust', 'Bold Local', 'Premium Dark', 'Friendly Family', 'Modern Minimal', 'Scroll Story']

const ALIAS_HOST = /^[a-z0-9-]+\.demos\.rapidforgeai\.com$/

type Fetch = (input: string, init?: RequestInit) => Promise<Response>

function json(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } })
}

/**
 * Best-effort and per instance (a cold start or a second instance counts
 * afresh): `allow` refuses an IP that already made `limit` picks in the
 * last `windowMs`.
 */
export function createPickLimiter(limit = PICK_LIMIT, windowMs = PICK_WINDOW_MS) {
  const hits = new Map<string, number[]>()
  return {
    allow(ip: string, now = Date.now()): boolean {
      const recent = (hits.get(ip) ?? []).filter((t) => now - t < windowMs)
      const allowed = recent.length < limit
      if (allowed) recent.push(now)
      hits.set(ip, recent)
      if (hits.size > 10_000) {
        for (const [key, times] of hits) if (times.every((t) => now - t >= windowMs)) hits.delete(key)
      }
      return allowed
    },
    clear() {
      hits.clear()
    },
  }
}

export const pickLimiter = createPickLimiter()

/** The client's IP: x-forwarded-for's first hop (Vercel sets the header), else one shared "unknown". */
function clientIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
}

/** The alias a pick came from: the page URL's origin, e.g. https://goodson.demos.rapidforgeai.com. */
export function aliasOf(pageUrl: string): string {
  try {
    return new URL(pageUrl).origin
  } catch {
    return pageUrl
  }
}

export function subjectFor(pick: Pick): string {
  return `[Demo pick] ${pick.business_name} likes ${pick.preset_name}`
}

export function bodyFor(pick: Pick): string {
  const lines = [
    `${pick.business_name} picked ${pick.preset_name} (${pick.preset_id}, /${pick.variant_slug}).`,
    '',
    `Site:          ${aliasOf(pick.page_url)}`,
    `Look:          ${aliasOf(pick.page_url)}/${pick.variant_slug}`,
    `Page:          ${pick.page_url}`,
    `Lead slug:     ${pick.slug}`,
    `Business:      ${pick.business_name}`,
    `Preset:        ${pick.preset_name} (${pick.preset_id})`,
    `Variant:       ${pick.variant_slug}`,
    `Name:          ${pick.name || '—'}`,
    `Email:         ${pick.email || '—'}`,
    `Phone:         ${pick.phone || '—'}`,
    `Note:          ${pick.note || '—'}`,
  ]
  return lines.join('\n')
}

/** The Resend request body for a pick. */
export function resendPayload(pick: Pick, env: PickEnv) {
  return {
    from: env.PICK_FROM_EMAIL?.trim() || DEFAULT_FROM,
    to: [env.PICK_TO_EMAIL!.trim()],
    subject: subjectFor(pick),
    text: bodyFor(pick),
    ...(EMAIL_OK.test(pick.email) ? { reply_to: pick.email } : {}),
  }
}

const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * The link a confirmation may carry: the chosen look's page, i.e. the page
 * URL's origin plus `/<variant_slug>` (PickSchema holds the slug to the
 * variant routes or "scroll"). Only https on a *.demos.rapidforgeai.com
 * alias with no credentials or port; the page's own path, query and hash
 * never pass through. Else null.
 */
export function confirmableUrl(pageUrl: string, variantSlug: string): string | null {
  let url: URL
  try {
    url = new URL(pageUrl)
  } catch {
    return null
  }
  if (url.protocol !== 'https:' || !ALIAS_HOST.test(url.host) || url.username || url.password) return null
  return `${url.origin}/${variantSlug}`
}

/** The picker's name as a confirmation may use it: letters, spaces, ' and - only, at most 60 characters. */
export function cleanName(name: string): string {
  return name
    .normalize('NFC')
    .replace(/\s+/g, ' ')
    .replace(/[^\p{L} '-]/gu, '')
    .replace(/ {2,}/g, ' ')
    .trim()
    .slice(0, 60)
    .trim()
}

/** The look a confirmation names: one of LOOK_NAMES, else null (the body then says "a look"). */
export function lookNameOf(presetName: string): string | null {
  return LOOK_NAMES.includes(presetName) ? presetName : null
}

/** Everything a confirmation says, each already checked: no other request text reaches it. */
export interface Confirmation {
  /** cleanName of the picker's name; blank greets without one. */
  name: string
  /** lookNameOf the preset name. */
  look: string | null
  /** The leads DB's name for the business, never the request's. */
  businessName: string
  /** confirmableUrl of the page URL. */
  pageUrl: string
}

export function confirmationSubjectFor(businessName: string): string {
  return `Your pick for ${businessName} is in`
}

export function confirmationBodyFor(c: Confirmation): string {
  const lines = [
    c.name ? `Hi ${c.name},` : 'Hi,',
    '',
    `Thanks for choosing ${c.look ? `the ${c.look} look` : 'a look'} for ${c.businessName}. Joey at RapidForge will be in touch.`,
    '',
    'You can revisit it here:',
    c.pageUrl,
    '',
    'If you have a question in the meantime, you can reply to this email.',
  ]
  return lines.join('\n')
}

/**
 * The Resend request body for the picker's confirmation; replies go to Joey.
 * From the pick it takes only the email (as the recipient), the name
 * (cleaned) and the preset name (when it is a known look).
 */
export function confirmationPayload(pick: Pick, env: PickEnv, businessName: string, pageUrl: string) {
  const c: Confirmation = { name: cleanName(pick.name), look: lookNameOf(pick.preset_name), businessName, pageUrl }
  return {
    from: env.PICK_FROM_EMAIL?.trim() || DEFAULT_FROM,
    to: [pick.email],
    reply_to: env.PICK_TO_EMAIL!.trim(),
    subject: confirmationSubjectFor(businessName),
    text: confirmationBodyFor(c),
  }
}

/** The demo_picks row for a pick; blank contact fields are stored as null. */
export function pickRow(pick: Pick, businessId: string) {
  const orNull = (value: string) => value || null
  return {
    business_id: businessId,
    variant: pick.variant_slug,
    preset_id: pick.preset_id,
    contact_name: orNull(pick.name),
    contact_email: orNull(pick.email),
    contact_phone: orNull(pick.phone),
    note: orNull(pick.note),
    source_url: pick.page_url,
  }
}

/** The leads Supabase's REST base and service-role key, or null when either is unset. */
function leadsDb(env: PickEnv): { url: string; key: string } | null {
  const url = env.LEADS_SUPABASE_URL?.trim().replace(/\/+$/, '')
  const key = env.LEADS_SUPABASE_SERVICE_ROLE_KEY?.trim()
  return url && key ? { url, key } : null
}

/** POST one demo_picks row; null on success, else the error for the client. Logs never carry the key. */
async function savePick(db: { url: string; key: string }, row: ReturnType<typeof pickRow>, fetchImpl: Fetch): Promise<string | null> {
  let res: Response
  try {
    res = await fetchImpl(`${db.url}/rest/v1/${PICKS_TABLE}`, {
      method: 'POST',
      headers: {
        apikey: db.key,
        authorization: `Bearer ${db.key}`,
        'content-type': 'application/json',
        prefer: 'return=minimal',
      },
      body: JSON.stringify(row),
    })
  } catch (err) {
    console.error(`pick: ${PICKS_TABLE} insert unreachable (${err instanceof Error ? err.message : String(err)})`)
    return 'Pick storage is unreachable'
  }
  if (res.ok) return null
  let detail = ''
  try {
    const body = (await res.json()) as { message?: unknown }
    if (typeof body?.message === 'string') detail = `: ${body.message}`
  } catch {
    /* non-JSON error body */
  }
  console.error(`pick: ${PICKS_TABLE} insert failed (HTTP ${res.status}${detail})`)
  return `The pick was not saved (HTTP ${res.status})`
}

/** The business's name as the leads DB has it, or why it could not be read. Logs never carry the key. */
async function businessNameOf(db: { url: string; key: string }, businessId: string, fetchImpl: Fetch): Promise<{ name: string } | { reason: string }> {
  let res: Response
  try {
    res = await fetchImpl(`${db.url}/rest/v1/${BUSINESSES_TABLE}?id=eq.${encodeURIComponent(businessId)}&select=name`, {
      headers: { apikey: db.key, authorization: `Bearer ${db.key}`, accept: 'application/json' },
    })
  } catch (err) {
    return { reason: `business lookup unreachable: ${err instanceof Error ? err.message : String(err)}` }
  }
  if (!res.ok) return { reason: `business lookup failed (HTTP ${res.status})` }
  let rows: unknown
  try {
    rows = await res.json()
  } catch {
    return { reason: 'business lookup answered with no JSON' }
  }
  const name = Array.isArray(rows) ? (rows[0] as { name?: unknown } | undefined)?.name : undefined
  return typeof name === 'string' && name.trim() ? { name: name.trim() } : { reason: 'business not found' }
}

/**
 * The picker's confirmation, after Joey's notice. It goes only to a valid
 * email, only for a saved pick (fixture and URL-intake builds have no
 * businessId, so never), only from a *.demos.rapidforgeai.com page, and
 * names the business as the leads DB does. A skip or a failed send is
 * logged and changes nothing else.
 */
async function confirmPick(pick: Pick, env: PickEnv, db: { url: string; key: string } | null, saved: boolean, fetchImpl: Fetch): Promise<void> {
  if (!EMAIL_OK.test(pick.email)) return
  const skip = (reason: string) => console.log(`pick: confirmation skipped (${reason})`)
  if (!saved || !db || !pick.businessId) return skip('the pick was not saved to demo_picks')
  const pageUrl = confirmableUrl(pick.page_url, pick.variant_slug)
  if (!pageUrl) return skip('page_url is not https on a *.demos.rapidforgeai.com alias')
  const business = await businessNameOf(db, pick.businessId, fetchImpl)
  if ('reason' in business) return skip(business.reason)
  const failure = await emailPick(confirmationPayload(pick, env, business.name, pageUrl), env, fetchImpl)
  if (failure) console.error(`pick: the picker's confirmation failed (${failure})`)
  else console.log('pick: confirmation sent')
}

/** Send one pick email (Joey's notice or the picker's confirmation); null on success, else Resend's error. */
async function emailPick(payload: ReturnType<typeof resendPayload | typeof confirmationPayload>, env: PickEnv, fetchImpl: Fetch): Promise<string | null> {
  let res: Response
  try {
    res = await fetchImpl(RESEND_URL, {
      method: 'POST',
      headers: { authorization: `Bearer ${env.RESEND_API_KEY!.trim()}`, 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch (err) {
    return `Resend unreachable: ${err instanceof Error ? err.message : String(err)}`
  }
  if (res.ok) return null
  let message = `Resend responded ${res.status}`
  try {
    const body = (await res.json()) as { message?: string }
    if (body?.message) message = body.message
  } catch {
    /* non-JSON error body */
  }
  return message
}

export async function handlePick(req: Request, env: PickEnv, fetchImpl: Fetch): Promise<Response> {
  if (req.method !== 'POST') {
    return json(405, { ok: false, error: 'Method not allowed' })
  }
  // Before the body is read, so a flood never reaches the database or Resend.
  if (!pickLimiter.allow(clientIp(req))) {
    return json(429, { ok: false, error: TOO_MANY }, { 'retry-after': String(PICK_WINDOW_MS / 1000) })
  }
  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return json(400, { ok: false, error: 'Body must be JSON' })
  }
  const parsed = PickSchema.safeParse(raw)
  if (!parsed.success) {
    return json(400, { ok: false, error: 'Invalid pick', issues: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`) })
  }
  const pick = parsed.data
  // Honeypot: a bot filled the field no person can see. Say yes, send nothing.
  if (pick.website.trim() !== '') {
    return json(200, { saved: true, emailed: false })
  }
  if (!reachable(pick.email, pick.phone)) {
    return json(400, { ok: false, error: 'An email or a phone number is required' })
  }

  const db = leadsDb(env)
  const saving = db !== null && pick.businessId !== undefined
  const mailing = Boolean(env.RESEND_API_KEY?.trim() && env.PICK_TO_EMAIL?.trim())
  if (!saving && !mailing) {
    return json(502, { ok: false, error: NOT_CONFIGURED })
  }

  if (saving) {
    const failure = await savePick(db, pickRow(pick, pick.businessId!), fetchImpl)
    if (failure) return json(502, { ok: false, error: failure })
  }
  let emailed = false
  if (mailing) {
    const failure = await emailPick(resendPayload(pick, env), env, fetchImpl)
    // With the row saved the pick is safe; an email-only pick that fails went nowhere.
    if (failure && !saving) return json(502, { ok: false, error: failure })
    if (failure) console.error(`pick: saved, but the email failed (${failure})`)
    else console.log('pick: notice sent')
    emailed = failure === null
    await confirmPick(pick, env, db, saving, fetchImpl)
  }
  return json(200, { saved: saving, emailed })
}
