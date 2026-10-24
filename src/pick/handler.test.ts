// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_FROM, NOT_CONFIGURED, RESEND_URL, confirmationPayload, handlePick } from './handler'
import { PickSchema } from './schema'

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
  page_url: 'https://goodson.demos.rapidforgeai.com/heritage',
  name: 'Rob',
  email: 'rob@example.com',
  phone: '',
  note: 'Love the blue.',
  website: '',
}

function post(body: unknown, method = 'POST') {
  return new Request('https://goodson.demos.rapidforgeai.com/api/pick', {
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

  it('accepts variant scroll (the Scroll Story page) and stores it as the row’s variant', async () => {
    const fetch = routed()
    const res = await handlePick(post({ ...PICK, businessId: BUSINESS_ID, variant_slug: 'scroll', preset_id: 'scroll-story', preset_name: 'Scroll Story' }), DB_ENV, fetch)
    expect(res.status).toBe(200)
    const [, init] = calls(fetch)[0]
    expect(JSON.parse(init.body as string)).toMatchObject({ variant: 'scroll', preset_id: 'scroll-story' })
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
      source_url: 'https://goodson.demos.rapidforgeai.com/heritage',
    })
  })

  it('saves first, then emails, when both channels are configured', async () => {
    const fetch = routed()
    const res = await handlePick(post({ ...PICK, businessId: BUSINESS_ID }), { ...ENV, ...DB_ENV }, fetch)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ saved: true, emailed: true })
    // Joey's notice, then the picker's confirmation.
    expect(calls(fetch).map(([url]) => url)).toEqual([PICKS_URL, RESEND_URL, RESEND_URL])
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
    expect(calls(fetch).map(([url]) => url)).toEqual([RESEND_URL, RESEND_URL])
  })

  it('sends the right Resend payload on the happy path', async () => {
    const fetch = resendOk()
    const res = await handlePick(post(PICK), { ...ENV, PICK_FROM_EMAIL: '' }, fetch)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ saved: false, emailed: true })
    // Joey's notice is the first of two sends; the second is the picker's confirmation.
    expect(fetch).toHaveBeenCalledTimes(2)
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe(RESEND_URL)
    expect(init.method).toBe('POST')
    expect((init.headers as Record<string, string>).authorization).toBe('Bearer re_test')
    const body = JSON.parse(init.body as string)
    expect(body.from).toBe(DEFAULT_FROM)
    expect(body.to).toEqual(['joey@example.com'])
    expect(body.reply_to).toBe('rob@example.com')
    expect(body.subject).toBe('[Demo pick] Goodson Plumbing Services likes Clean Trust')
    for (const value of ['robgoodsonplumbing-com', 'Goodson Plumbing Services', 'clean-trust', 'Clean Trust', 'heritage', 'Rob', 'rob@example.com', 'Love the blue.', 'https://goodson.demos.rapidforgeai.com/heritage']) {
      expect(body.text).toContain(value)
    }
    expect(body.text).toContain('Site:          https://goodson.demos.rapidforgeai.com')
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
    // The pick went nowhere, so the picker is not told it is in.
    expect(failing).toHaveBeenCalledTimes(1)
  })
})

describe('the picker’s confirmation', () => {
  it('is a plain-text note from the pick sender to the picker, with replies going to Joey', () => {
    const pick = PickSchema.parse(PICK)
    const payload = confirmationPayload(pick, { ...ENV, PICK_FROM_EMAIL: '' })
    expect(payload.from).toBe(DEFAULT_FROM)
    expect(payload.to).toEqual(['rob@example.com'])
    expect(payload.reply_to).toBe('joey@example.com')
    expect(payload.subject).toBe('Your pick for Goodson Plumbing Services is in')
    expect(payload).not.toHaveProperty('html')
    expect(payload.text.split('\n')[0]).toBe('Hi Rob,')
    for (const value of ['Clean Trust look for Goodson Plumbing Services', 'Joey at RapidForge will be in touch', 'https://goodson.demos.rapidforgeai.com/heritage', 'reply to this email']) {
      expect(payload.text).toContain(value)
    }
    expect(confirmationPayload(pick, { ...ENV, PICK_FROM_EMAIL: ' picks@rapidforge.ai ' }).from).toBe('picks@rapidforge.ai')
    expect(confirmationPayload(PickSchema.parse({ ...PICK, name: '' }), ENV).text.split('\n')[0]).toBe('Hi,')
  })

  it('goes after Joey’s notice, to the address the picker left', async () => {
    const fetch = resendOk()
    await handlePick(post(PICK), ENV, fetch)
    const [notice, confirmation] = calls(fetch).map(([, init]) => JSON.parse(init.body as string))
    expect(notice.to).toEqual(['joey@example.com'])
    expect(confirmation).toEqual(confirmationPayload(PickSchema.parse(PICK), ENV))
  })

  it('is not sent when the email is blank or invalid', async () => {
    for (const email of ['', 'rob@example', 'rob example.com']) {
      const fetch = resendOk()
      const res = await handlePick(post({ ...PICK, email, phone: '(208) 555-0100' }), ENV, fetch)
      expect(res.status).toBe(200)
      expect(calls(fetch)).toHaveLength(1)
      expect(JSON.parse(calls(fetch)[0][1].body as string).to).toEqual(['joey@example.com'])
    }
  })

  it('failing with a 500 still answers ok, after Joey’s notice went out, and never logs the key', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {})
    const fetch = vi.fn(async (url: string, init?: RequestInit) => {
      if (url !== RESEND_URL) return new Response(null, { status: 201 })
      const to = JSON.parse(init!.body as string).to as string[]
      return to.includes('joey@example.com')
        ? new Response(JSON.stringify({ id: 'em_1' }), { status: 200 })
        : new Response(JSON.stringify({ message: 'Internal server error' }), { status: 500 })
    })
    const emailOnly = await handlePick(post(PICK), ENV, fetch)
    expect(emailOnly.status).toBe(200)
    expect(await emailOnly.json()).toEqual({ saved: false, emailed: true })
    const saved = await handlePick(post({ ...PICK, businessId: BUSINESS_ID }), { ...ENV, ...DB_ENV }, fetch)
    expect(saved.status).toBe(200)
    expect(await saved.json()).toEqual({ saved: true, emailed: true })
    const tos = calls(fetch)
      .filter(([url]) => url === RESEND_URL)
      .map(([, init]) => JSON.parse(init.body as string).to)
    expect(tos).toEqual([['joey@example.com'], ['rob@example.com'], ['joey@example.com'], ['rob@example.com']])
    expect(logged).toHaveBeenCalledTimes(2)
    expect(JSON.stringify(logged.mock.calls)).toContain('confirmation failed')
    expect(JSON.stringify(logged.mock.calls)).not.toContain('re_test')
  })
})
