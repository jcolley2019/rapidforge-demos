import { PickSchema, reachable, type Pick } from './schema.js'

/**
 * POST /api/pick: validates a pick and emails it to Joey through Resend's
 * REST API (no SDK). The Vercel function in api/pick.ts is a one-line
 * adapter over `handlePick`, which takes its env and fetch as arguments so
 * the tests run without a network.
 */

export interface PickEnv {
  RESEND_API_KEY?: string
  PICK_TO_EMAIL?: string
  PICK_FROM_EMAIL?: string
}

export const DEFAULT_FROM = 'onboarding@resend.dev'
export const RESEND_URL = 'https://api.resend.com/emails'

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
    return json(200, { ok: true })
  }
  if (!reachable(pick.email, pick.phone)) {
    return json(400, { ok: false, error: 'An email or a phone number is required' })
  }
  if (!env.RESEND_API_KEY?.trim() || !env.PICK_TO_EMAIL?.trim()) {
    return json(502, { ok: false, error: 'Email is not configured (RESEND_API_KEY / PICK_TO_EMAIL)' })
  }

  let res: Response
  try {
    res = await fetchImpl(RESEND_URL, {
      method: 'POST',
      headers: { authorization: `Bearer ${env.RESEND_API_KEY.trim()}`, 'content-type': 'application/json' },
      body: JSON.stringify(resendPayload(pick, env)),
    })
  } catch (err) {
    return json(502, { ok: false, error: `Resend unreachable: ${err instanceof Error ? err.message : String(err)}` })
  }
  if (!res.ok) {
    let message = `Resend responded ${res.status}`
    try {
      const body = (await res.json()) as { message?: string }
      if (body?.message) message = body.message
    } catch {
      /* non-JSON error body */
    }
    return json(502, { ok: false, error: message })
  }
  return json(200, { ok: true })
}
