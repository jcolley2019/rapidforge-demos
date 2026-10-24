// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'
import {
  DEFAULT_FROM,
  NOT_CONFIGURED,
  RESEND_URL,
  TOO_MANY,
  cleanName,
  confirmableUrl,
  confirmationPayload,
  createPickLimiter,
  handlePick,
  pickLimiter,
} from './handler'
import { PickSchema } from './schema'

const ENV = { RESEND_API_KEY: 're_test', PICK_TO_EMAIL: 'joey@example.com' }
const DB_ENV = { LEADS_SUPABASE_URL: 'https://leads.supabase.co/', LEADS_SUPABASE_SERVICE_ROLE_KEY: 'service-role-secret' }
const BUSINESS_ID = 'dff84968-ffa0-4188-84e6-079e1556e3e0'
const PICKS_URL = 'https://leads.supabase.co/rest/v1/demo_picks'
const BUSINESS_URL = `https://leads.supabase.co/rest/v1/businesses?id=eq.${BUSINESS_ID}&select=name`
/** The leads DB's name, unlike the request's business_name, so a test can tell which one a confirmation used. */
const DB_NAME = 'Goodson Plumbing Services LLC'

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

function post(body: unknown, method = 'POST', ip?: string) {
  return new Request('https://goodson.demos.rapidforgeai.com/api/pick', {
    method,
    headers: { 'content-type': 'application/json', ...(ip ? { 'x-forwarded-for': ip } : {}) },
    body: method === 'GET' ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  })
}

const resendOk = () => vi.fn(async () => new Response(JSON.stringify({ id: 'em_1' }), { status: 200 }))

const named = () => new Response(JSON.stringify([{ name: DB_NAME }]), { status: 200 })

/** Answers the demo_picks insert with 201 (or `dbStatus`), the businesses lookup with `lookup`, and Resend with 200. */
const routed = (dbStatus = 201, lookup: () => Response = named) =>
  vi.fn(async (url: string) =>
    url === RESEND_URL
      ? new Response(JSON.stringify({ id: 'em_1' }), { status: 200 })
      : url === BUSINESS_URL
        ? lookup()
        : dbStatus < 300
          ? new Response(null, { status: dbStatus })
          : new Response(JSON.stringify({ code: '23503', message: 'insert or update on table "demo_picks" violates foreign key constraint' }), { status: dbStatus }),
  )

const calls = (fetch: ReturnType<typeof vi.fn>) => fetch.mock.calls as unknown as Array<[string, RequestInit]>

let info: MockInstance<typeof console.log>

beforeEach(() => {
  // Every test posts from the same (absent) IP; the limiter's own tests fill it on purpose.
  pickLimiter.clear()
  info = vi.spyOn(console, 'log').mockImplementation(() => {})
})

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
    // Joey's notice, then the business name for the picker's confirmation, then that.
    expect(calls(fetch).map(([url]) => url)).toEqual([PICKS_URL, RESEND_URL, BUSINESS_URL, RESEND_URL])
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
    for (const value of ['robgoodsonplumbing-com', 'Goodson Plumbing Services', 'clean-trust', 'Clean Trust', 'heritage', 'Rob', 'rob@example.com', 'Love the blue.', 'https://goodson.demos.rapidforgeai.com/heritage']) {
      expect(body.text).toContain(value)
    }
    expect(body.text).toContain('Site:          https://goodson.demos.rapidforgeai.com')
    expect(body.text).toContain('Look:          https://goodson.demos.rapidforgeai.com/heritage')
    // The notice's look link follows the variant, whatever page the pick was made from.
    const fromPicker = await handlePick(post({ ...PICK, page_url: 'https://goodson.demos.rapidforgeai.com/?brief=x', variant_slug: 'scroll' }), { ...ENV, PICK_FROM_EMAIL: '' }, fetch)
    expect(fromPicker.status).toBe(200)
    expect(JSON.parse((fetch.mock.calls[1] as unknown as [string, RequestInit])[1].body as string).text).toContain('Look:          https://goodson.demos.rapidforgeai.com/scroll')
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
  const BOTH = { ...ENV, ...DB_ENV }
  const SAVED = { ...PICK, businessId: BUSINESS_ID }
  const PAGE = 'https://goodson.demos.rapidforgeai.com/heritage'
  const skipped = () => JSON.stringify(info.mock.calls)

  it('is a plain-text note from the pick sender to the picker, with replies going to Joey', () => {
    const pick = PickSchema.parse(SAVED)
    const payload = confirmationPayload(pick, { ...ENV, PICK_FROM_EMAIL: '' }, DB_NAME, PAGE)
    expect(payload.from).toBe(DEFAULT_FROM)
    expect(payload.to).toEqual(['rob@example.com'])
    expect(payload.reply_to).toBe('joey@example.com')
    expect(payload.subject).toBe(`Your pick for ${DB_NAME} is in`)
    expect(payload).not.toHaveProperty('html')
    expect(payload.text.split('\n')[0]).toBe('Hi Rob,')
    for (const value of [`the Clean Trust look for ${DB_NAME}.`, 'Joey at RapidForge will be in touch', PAGE, 'reply to this email']) {
      expect(payload.text).toContain(value)
    }
    expect(confirmationPayload(pick, { ...ENV, PICK_FROM_EMAIL: ' picks@rapidforge.ai ' }, DB_NAME, PAGE).from).toBe('picks@rapidforge.ai')
    expect(confirmationPayload(PickSchema.parse({ ...PICK, name: '' }), ENV, DB_NAME, PAGE).text.split('\n')[0]).toBe('Hi,')
  })

  it('carries none of the request’s own text: not its business name, note, slug, phone or an unknown look name', () => {
    const pick = PickSchema.parse({ ...SAVED, business_name: 'Totally Real Bank', preset_name: 'Click here to claim', phone: '(208) 555-0100' })
    const { subject, text } = confirmationPayload(pick, ENV, DB_NAME, PAGE)
    for (const leaked of ['Totally Real Bank', 'Click here', 'Love the blue.', 'robgoodsonplumbing-com', '555-0100', 'clean-trust']) {
      expect(subject + text).not.toContain(leaked)
    }
    expect(text).toContain(`Thanks for choosing a look for ${DB_NAME}.`)
  })

  it('reduces the picker’s name to letters, spaces, apostrophes and hyphens, 60 at most', () => {
    expect(cleanName('Rob')).toBe('Rob')
    expect(cleanName("  Mary-Jane  O'Brien ")).toBe("Mary-Jane O'Brien")
    expect(cleanName('José Zoë')).toBe('José Zoë')
    expect(cleanName('Rob\nVisit https://evil.example/win now!')).toBe('Rob Visit httpsevilexamplewin now')
    expect(cleanName('<b>Rob</b> 2')).toBe('bRobb')
    expect(cleanName('a'.repeat(80))).toHaveLength(60)
    expect(cleanName('123 456')).toBe('')
    const payload = confirmationPayload(PickSchema.parse({ ...SAVED, name: 'Rob <a href="https://evil.example">' }), ENV, DB_NAME, PAGE)
    expect(payload.text.split('\n')[0]).toBe('Hi Rob a hrefhttpsevilexample,')
  })

  it('links the chosen look on the alias, whatever page the pick came from, and only on a *.demos.rapidforgeai.com https alias', () => {
    expect(confirmableUrl(PAGE, 'heritage')).toBe(PAGE)
    // From the picker (or any path, with query and hash), the link is still the look's own page.
    expect(confirmableUrl('https://goodson.demos.rapidforgeai.com/', 'cleanpro')).toBe('https://goodson.demos.rapidforgeai.com/cleanpro')
    expect(confirmableUrl('https://goodson.demos.rapidforgeai.com/?brief=x#top', 'scroll')).toBe('https://goodson.demos.rapidforgeai.com/scroll')
    expect(confirmableUrl('https://goodson.demos.rapidforgeai.com/heritage?x=1', 'texas')).toBe('https://goodson.demos.rapidforgeai.com/texas')
    for (const foreign of [
      'https://evil.example.com/heritage',
      'http://goodson.demos.rapidforgeai.com/heritage',
      'https://goodson.demos.rapidforgeai.com.evil.example/heritage',
      'https://a.b.demos.rapidforgeai.com/',
      'https://demos.rapidforgeai.com/',
      'https://goodson.demos.rapidforgeai.com:8443/',
      'https://user:pw@goodson.demos.rapidforgeai.com/',
      'not a url',
    ]) {
      expect(confirmableUrl(foreign, 'heritage')).toBeNull()
    }
  })

  it('sends the look’s page in a live pick: a variant from the picker, and the Scroll Story', async () => {
    for (const [variant, path] of [
      ['cleanpro', '/cleanpro'],
      ['scroll', '/scroll'],
    ] as const) {
      const fetch = routed()
      const res = await handlePick(post({ ...SAVED, variant_slug: variant, preset_name: variant === 'scroll' ? 'Scroll Story' : 'Premium Dark', page_url: 'https://goodson.demos.rapidforgeai.com/?brief=x' }), BOTH, fetch)
      expect(res.status).toBe(200)
      const confirmation = JSON.parse(calls(fetch)[3][1].body as string)
      expect(confirmation.text).toContain(`You can revisit it here:\nhttps://goodson.demos.rapidforgeai.com${path}\n`)
      expect(confirmation.text).not.toContain('brief=x')
    }
  })

  it('goes after Joey’s notice, to the address the picker left, naming the business as the leads DB does', async () => {
    const fetch = routed()
    const res = await handlePick(post(SAVED), BOTH, fetch)
    expect(await res.json()).toEqual({ saved: true, emailed: true })
    expect(calls(fetch).map(([url]) => url)).toEqual([PICKS_URL, RESEND_URL, BUSINESS_URL, RESEND_URL])
    const [, lookup] = calls(fetch)[2]
    expect(lookup.headers).toMatchObject({ apikey: 'service-role-secret', authorization: 'Bearer service-role-secret' })
    const notice = JSON.parse(calls(fetch)[1][1].body as string)
    const confirmation = JSON.parse(calls(fetch)[3][1].body as string)
    expect(notice.to).toEqual(['joey@example.com'])
    expect(confirmation).toEqual(confirmationPayload(PickSchema.parse(SAVED), BOTH, DB_NAME, PAGE))
    expect(skipped()).toContain('confirmation sent')
  })

  it('is not sent when the email is blank or invalid', async () => {
    for (const email of ['', 'rob@example', 'rob example.com']) {
      const fetch = routed()
      const res = await handlePick(post({ ...SAVED, email, phone: '(208) 555-0100' }), BOTH, fetch)
      expect(res.status).toBe(200)
      expect(calls(fetch).map(([url]) => url)).toEqual([PICKS_URL, RESEND_URL])
    }
  })

  it('is not sent for a fixture or URL-intake pick, which has no businessId and so no saved row', async () => {
    const fetch = routed()
    const res = await handlePick(post(PICK), BOTH, fetch)
    expect(await res.json()).toEqual({ saved: false, emailed: true })
    expect(calls(fetch).map(([url]) => url)).toEqual([RESEND_URL])
    expect(skipped()).toContain('confirmation skipped (the pick was not saved')
  })

  it('is not sent for a page on a foreign host, though the pick is saved and Joey told', async () => {
    const fetch = routed()
    const res = await handlePick(post({ ...SAVED, page_url: 'https://evil.example.com/heritage' }), BOTH, fetch)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ saved: true, emailed: true })
    expect(calls(fetch).map(([url]) => url)).toEqual([PICKS_URL, RESEND_URL])
    expect(skipped()).toContain('confirmation skipped (page_url is not https on a *.demos.rapidforgeai.com alias)')
  })

  it('is not sent when the business lookup 404s or finds no business, and the pick still answers ok', async () => {
    for (const [lookup, reason] of [
      [() => new Response(JSON.stringify({ message: 'relation "businesses" does not exist' }), { status: 404 }), 'business lookup failed (HTTP 404)'],
      [() => new Response('[]', { status: 200 }), 'business not found'],
    ] as const) {
      info.mockClear()
      const fetch = routed(201, lookup)
      const res = await handlePick(post(SAVED), BOTH, fetch)
      expect(res.status).toBe(200)
      expect(await res.json()).toEqual({ saved: true, emailed: true })
      expect(calls(fetch).map(([url]) => url)).toEqual([PICKS_URL, RESEND_URL, BUSINESS_URL])
      expect(skipped()).toContain(`confirmation skipped (${reason})`)
    }
  })

  it('failing with a 500 still answers ok, after Joey’s notice went out, and never logs a key', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {})
    const fetch = vi.fn(async (url: string, init?: RequestInit) => {
      if (url === BUSINESS_URL) return named()
      if (url !== RESEND_URL) return new Response(null, { status: 201 })
      const to = JSON.parse(init!.body as string).to as string[]
      return to.includes('joey@example.com')
        ? new Response(JSON.stringify({ id: 'em_1' }), { status: 200 })
        : new Response(JSON.stringify({ message: 'Internal server error' }), { status: 500 })
    })
    const res = await handlePick(post(SAVED), BOTH, fetch)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ saved: true, emailed: true })
    const tos = calls(fetch)
      .filter(([url]) => url === RESEND_URL)
      .map(([, init]) => JSON.parse(init.body as string).to)
    expect(tos).toEqual([['joey@example.com'], ['rob@example.com']])
    expect(logged).toHaveBeenCalledTimes(1)
    const logs = JSON.stringify([logged.mock.calls, info.mock.calls])
    expect(logs).toContain('confirmation failed')
    expect(logs).not.toContain('re_test')
    expect(logs).not.toContain('service-role-secret')
  })
})

describe('the per-IP pick limit', () => {
  it('429s the sixth pick in a minute from one IP before any database or email call', async () => {
    const fetch = routed()
    const env = { ...ENV, ...DB_ENV }
    for (let i = 0; i < 5; i++) {
      expect((await handlePick(post(PICK, 'POST', '203.0.113.7, 10.0.0.1'), env, fetch)).status).toBe(200)
    }
    const before = calls(fetch).length
    const sixth = await handlePick(post(PICK, 'POST', '203.0.113.7'), env, fetch)
    expect(sixth.status).toBe(429)
    expect(sixth.headers.get('retry-after')).toBe('60')
    expect(await sixth.json()).toEqual({ ok: false, error: TOO_MANY })
    expect(calls(fetch)).toHaveLength(before)
    // Another IP has its own count.
    expect((await handlePick(post(PICK, 'POST', '198.51.100.2'), env, fetch)).status).toBe(200)
  })

  it('lets an IP back in once its oldest pick is a minute old', () => {
    const limiter = createPickLimiter(5, 60_000)
    for (let t = 0; t < 5; t++) expect(limiter.allow('203.0.113.7', t * 1000)).toBe(true)
    expect(limiter.allow('203.0.113.7', 30_000)).toBe(false)
    expect(limiter.allow('203.0.113.7', 59_999)).toBe(false)
    expect(limiter.allow('203.0.113.7', 60_000)).toBe(true)
    expect(limiter.allow('203.0.113.7', 60_001)).toBe(false)
  })
})
