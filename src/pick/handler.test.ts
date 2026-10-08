// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_FROM, NOT_CONFIGURED, RESEND_URL, handlePick } from './handler'

const ENV = { RESEND_API_KEY: 're_test', PICK_TO_EMAIL: 'joey@example.com' }
const DB_ENV = { LEADS_SUPABASE_URL: 'https://leads.supabase.co/', LEADS_SUPABASE_SERVICE_ROLE_KEY: 'service-role-secret' }
const BUSINESS_ID = 'dff84968-ffa0-4188-84e6-079e1556e3e0'
const PICKS_URL = 'https://leads.supabase.co/rest/v1/demo_picks'

const PICK = {
  slug: 'robgoodsonplumbing-com',
  business_name: 'Goodson Plumbing Services',
  preset_id: 'clean-trust',
  preset_name: 'Clean Trust',
  variant_slug: 'heritage',
  page_url: 'https://goodson.demos.rapidforge.ai/heritage',
  name: 'Rob',
  email: 'rob@example.com',
  phone: '',
  note: 'Love the blue.',
  website: '',
}

function post(body: unknown, method = 'POST') {
  return new Request('https://goodson.demos.rapidforge.ai/api/pick', {
    method,
    headers: { 'content-type': 'application/json' },
    body: method === 'GET' ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  })
}

const resendOk = () => vi.fn(async () => new Response(JSON.stringify({ id: 'em_1' }), { status: 200 }))

/** Answers the demo_picks insert with 201 (or `dbStatus`) and Resend with 200. */
const routed = (dbStatus = 201) =>
  vi.fn(async (url: string) =>
    url === RESEND_URL
      ? new Response(JSON.stringify({ id: 'em_1' }), { status: 200 })
      : dbStatus < 300
        ? new Response(null, { status: dbStatus })
        : new Response(JSON.stringify({ code: '23503', message: 'insert or update on table "demo_picks" violates foreign key constraint' }), { status: dbStatus }),
  )

const calls = (fetch: ReturnType<typeof vi.fn>) => fetch.mock.calls as unknown as Array<[string, RequestInit]>

afterEach(() => {
  vi.restoreAllMocks()
})

describe('POST /api/pick', () => {
  it('405s anything but POST and never calls Resend', async () => {
    const fetch = resendOk()
    const res = await handlePick(post(null, 'GET'), ENV, fetch)
    expect(res.status).toBe(405)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('400s a non-JSON body, a malformed pick, and a pick with no way back', async () => {
    const fetch = resendOk()
    expect((await handlePick(post('not json'), ENV, fetch)).status).toBe(400)
    expect((await handlePick(post({ ...PICK, page_url: 'nope' }), ENV, fetch)).status).toBe(400)
    expect((await handlePick(post({ ...PICK, email: '', phone: '' }), ENV, fetch)).status).toBe(400)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('400s a businessId that is not a uuid and a variant that is not a route, before any fetch', async () => {
    const fetch = routed()
    const env = { ...ENV, ...DB_ENV }
    const badId = await handlePick(post({ ...PICK, businessId: 'not-a-uuid' }), env, fetch)
    expect(badId.status).toBe(400)
    expect(JSON.stringify(await badId.json())).toContain('businessId')
    const badVariant = await handlePick(post({ ...PICK, businessId: BUSINESS_ID, variant_slug: 'brutalist' }), env, fetch)
    expect(badVariant.status).toBe(400)
    expect(JSON.stringify(await badVariant.json())).toContain('variant_slug')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('drops a honeypot hit silently with a 200', async () => {
    const fetch = routed()
    const res = await handlePick(post({ ...PICK, businessId: BUSINESS_ID, website: 'http://spam.example' }), { ...ENV, ...DB_ENV }, fetch)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ saved: true, emailed: false })
    expect(fetch).not.toHaveBeenCalled()
  })

  it('inserts one demo_picks row with the service-role headers, then answers saved without email when Resend is blank', async () => {
    const fetch = routed()
    const res = await handlePick(post({ ...PICK, businessId: BUSINESS_ID }), { ...DB_ENV, RESEND_API_KEY: '', PICK_TO_EMAIL: '' }, fetch)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ saved: true, emailed: false })
    expect(fetch).toHaveBeenCalledTimes(1)
    const [url, init] = calls(fetch)[0]
    expect(url).toBe(PICKS_URL)
    expect(init.method).toBe('POST')
    expect(init.headers).toEqual({
      apikey: 'service-role-secret',
      authorization: 'Bearer service-role-secret',
      'content-type': 'application/json',
      prefer: 'return=minimal',
    })
    expect(JSON.parse(init.body as string)).toEqual({
      business_id: BUSINESS_ID,
      variant: 'heritage',
      preset_id: 'clean-trust',
      contact_name: 'Rob',
      contact_email: 'rob@example.com',
      contact_phone: null,
      note: 'Love the blue.',
      source_url: 'https://goodson.demos.rapidforge.ai/heritage',
    })
  })

  it('saves first, then emails, when both channels are configured', async () => {
    const fetch = routed()
    const res = await handlePick(post({ ...PICK, businessId: BUSINESS_ID }), { ...ENV, ...DB_ENV }, fetch)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ saved: true, emailed: true })
    expect(calls(fetch).map(([url]) => url)).toEqual([PICKS_URL, RESEND_URL])
  })

  it('still answers saved when the row went in but the email failed', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const fetch = vi.fn(async (url: string) =>
      url === RESEND_URL ? new Response(JSON.stringify({ message: 'Invalid `to` address' }), { status: 422 }) : new Response(null, { status: 201 }),
    )
    const res = await handlePick(post({ ...PICK, businessId: BUSINESS_ID }), { ...ENV, ...DB_ENV }, fetch)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ saved: true, emailed: false })
  })

  it('502s when the insert fails, sends no email, and never logs the key', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {})
    const fetch = routed(409)
    const res = await handlePick(post({ ...PICK, businessId: BUSINESS_ID }), { ...ENV, ...DB_ENV }, fetch)
    expect(res.status).toBe(502)
    const body = await res.json()
    expect(body.ok).toBe(false)
    expect(body.error).toContain('HTTP 409')
    expect(calls(fetch).map(([url]) => url)).toEqual([PICKS_URL])
    expect(logged).toHaveBeenCalled()
    expect(JSON.stringify(logged.mock.calls)).not.toContain('service-role-secret')
    expect(JSON.stringify(body)).not.toContain('service-role-secret')
  })

  it('502s with "Pick storage is not configured" when neither channel is configured', async () => {
    const fetch = routed()
    const nothing = await handlePick(post({ ...PICK, businessId: BUSINESS_ID }), {}, fetch)
    expect(nothing.status).toBe(502)
    expect(await nothing.json()).toEqual({ ok: false, error: NOT_CONFIGURED })
    // The leads keys alone cannot store a pick that has no businessId.
    const noId = await handlePick(post(PICK), DB_ENV, fetch)
    expect(noId.status).toBe(502)
    expect(await noId.json()).toEqual({ ok: false, error: NOT_CONFIGURED })
    expect(fetch).not.toHaveBeenCalled()
  })

  it('emails a pick with no businessId as before, without touching the database', async () => {
    const fetch = routed()
    const res = await handlePick(post(PICK), { ...ENV, ...DB_ENV }, fetch)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ saved: false, emailed: true })
    expect(calls(fetch).map(([url]) => url)).toEqual([RESEND_URL])
  })

  it('sends the right Resend payload on the happy path', async () => {
    const fetch = resendOk()
    const res = await handlePick(post(PICK), { ...ENV, PICK_FROM_EMAIL: '' }, fetch)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ saved: false, emailed: true })
    expect(fetch).toHaveBeenCalledTimes(1)
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe(RESEND_URL)
    expect(init.method).toBe('POST')
    expect((init.headers as Record<string, string>).authorization).toBe('Bearer re_test')
    const body = JSON.parse(init.body as string)
    expect(body.from).toBe(DEFAULT_FROM)
    expect(body.to).toEqual(['joey@example.com'])
    expect(body.reply_to).toBe('rob@example.com')
    expect(body.subject).toBe('[Demo pick] Goodson Plumbing Services likes Clean Trust')
    for (const value of ['robgoodsonplumbing-com', 'Goodson Plumbing Services', 'clean-trust', 'Clean Trust', 'heritage', 'Rob', 'rob@example.com', 'Love the blue.', 'https://goodson.demos.rapidforge.ai/heritage']) {
      expect(body.text).toContain(value)
    }
    expect(body.text).toContain('Site:          https://goodson.demos.rapidforge.ai')
  })

  it('accepts a phone alone and uses the configured from address', async () => {
    const fetch = resendOk()
    const res = await handlePick(post({ ...PICK, email: '', phone: '(208) 555-0100' }), { ...ENV, PICK_FROM_EMAIL: 'picks@rapidforge.ai' }, fetch)
    expect(res.status).toBe(200)
    const body = JSON.parse((fetch.mock.calls[0] as unknown as [string, RequestInit])[1].body as string)
    expect(body.from).toBe('picks@rapidforge.ai')
    expect(body.reply_to).toBeUndefined()
  })

  it('502s with Resend’s message when an email-only pick fails to send', async () => {
    const failing = vi.fn(async () => new Response(JSON.stringify({ message: 'Invalid `to` address' }), { status: 422 }))
    const res = await handlePick(post(PICK), ENV, failing)
    expect(res.status).toBe(502)
    expect(await res.json()).toEqual({ ok: false, error: 'Invalid `to` address' })
  })
})
