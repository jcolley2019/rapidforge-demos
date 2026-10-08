import { PickSchema, reachable, type Pick } from './schema.js'

/**
 * POST /api/pick: validates a pick, saves it as a demo_picks row in the
 * leads Supabase (when the pick carries a businessId and the service-role
 * env is set), then emails it to Joey through Resend's REST API (no SDK)
 * when Resend is configured. Either channel alone is enough. The Vercel
 * function in api/pick.ts is a one-line adapter over `handlePick`, which
 * takes its env and fetch as arguments so the tests run without a network.
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

type Fetch = (input: string, init?: RequestInit) => Promise<Response>

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}

/** The alias a pick came from: the page URL's origin, e.g. https://goodson.demos.rapidforge.ai. */
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

/** Send the pick email; null on success, else Resend's error. */
async function emailPick(pick: Pick, env: PickEnv, fetchImpl: Fetch): Promise<string | null> {
  let res: Response
  try {
    res = await fetchImpl(RESEND_URL, {
      method: 'POST',
      headers: { authorization: `Bearer ${env.RESEND_API_KEY!.trim()}`, 'content-type': 'application/json' },
      body: JSON.stringify(resendPayload(pick, env)),
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
    const failure = await emailPick(pick, env, fetchImpl)
    // With the row saved the pick is safe; an email-only pick that fails went nowhere.
    if (failure && !saving) return json(502, { ok: false, error: failure })
    if (failure) console.error(`pick: saved, but the email failed (${failure})`)
    emailed = failure === null
  }
  return json(200, { saved: saving, emailed })
}
