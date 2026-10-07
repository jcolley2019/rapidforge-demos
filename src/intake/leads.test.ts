// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { absolutePhotoUrls, fetchLeadBrief, fetchLeadWebsite, signIn } from './leads'
import { authHeaderFor, downloadImages } from './photos'

const API = 'http://localhost:8788'
const SUPABASE = 'https://leads-project.supabase.co'
const PHOTO = '/api/places/photo/places%2FChIJabc%2Fphotos%2FAtY123?maxWidthPx=1600'

/** A brief as the leads worker's design-brief agent writes it (packages/shared/src/design-brief.ts). */
function leadsBrief(overrides: Record<string, unknown> = {}) {
  return {
    business_name: 'Goodson Plumbing Services',
    vertical: 'plumber',
    tone_descriptors: ['dependable', 'straight-talking', 'fast-response'],
    services: ['Water heaters', 'Drain cleaning'],
    review_quotes: [{ text: 'They showed up within the hour and fixed our water heater for a fair price.', rating: 5, author: 'Dana R.' }],
    photo_urls: [PHOTO],
    hours: [{ day: 'Monday', open: '08:00', close: '17:00' }],
    phone: '(208) 629-4278',
    address: '5103 W Bethel St, Boise, ID 83706',
    primary_cta: { label: 'Call now', kind: 'phone', href: 'tel:2086294278' },
    current_site_problem: 'The phone number is buried below the fold on mobile.',
    generated_at: '2026-10-07T20:00:00.000Z',
    source: { audit_id: 'audit-1', haiku_model: 'claude-haiku-4-5-20251001', template_fallback: false },
    ...overrides,
  }
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}

let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
  vi.stubEnv('LEADS_API_URL', `${API}/`)
  vi.stubEnv('LEADS_SUPABASE_URL', SUPABASE)
  vi.stubEnv('LEADS_SUPABASE_ANON_KEY', 'anon-key')
  vi.stubEnv('LEADS_EMAIL', 'joey@example.com')
  vi.stubEnv('LEADS_PASSWORD', 'hunter2')
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('signIn', () => {
  it('posts the password grant with the anon key and returns the access token', async () => {
    fetchMock.mockResolvedValueOnce(json(200, { access_token: 'jwt-123', token_type: 'bearer' }))
    await expect(signIn()).resolves.toBe('jwt-123')
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(`${SUPABASE}/auth/v1/token?grant_type=password`)
    expect(init.method).toBe('POST')
    expect(init.headers).toEqual({ apikey: 'anon-key', 'Content-Type': 'application/json' })
    expect(JSON.parse(init.body)).toEqual({ email: 'joey@example.com', password: 'hunter2' })
  })

  it('names LEADS_EMAIL and LEADS_PASSWORD when Supabase answers 400', async () => {
    fetchMock.mockResolvedValueOnce(json(400, { error: 'invalid_grant', error_description: 'Invalid login credentials' }))
    const error = await signIn().then(
      () => new Error('signIn resolved'),
      (e: Error) => e,
    )
    expect(error.message).toMatch(/LEADS_EMAIL/)
    expect(error.message).toMatch(/LEADS_PASSWORD/)
    expect(error.message).toMatch(/Invalid login credentials/)
  })

  it('names the missing keys before calling anything', async () => {
    vi.stubEnv('LEADS_SUPABASE_ANON_KEY', '')
    vi.stubEnv('LEADS_PASSWORD', '')
    await expect(signIn()).rejects.toThrow('Set LEADS_SUPABASE_ANON_KEY, LEADS_PASSWORD in .env')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('fetchLeadBrief', () => {
  it('posts with the Bearer token, validates the brief and makes photo URLs absolute', async () => {
    const body = { design_brief: leadsBrief(), stored: true }
    fetchMock.mockResolvedValueOnce(json(200, body))
    const got = await fetchLeadBrief('biz-1', 'jwt-123')
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(`${API}/api/businesses/biz-1/design-brief`)
    expect(init).toMatchObject({ method: 'POST', headers: { Authorization: 'Bearer jwt-123' } })
    expect(got.raw).toEqual(body)
    expect(got.stored).toBe(true)
    expect(got.coerced).toEqual([])
    expect(got.brief.photo_urls).toEqual([`${API}${PHOTO}`])
    expect(got.brief.business_name).toBe('Goodson Plumbing Services')
    // fields keeps only what the leads app sent, so mergeBrief's site values still fill the rest.
    expect(got.fields.segment).toBeUndefined()
    expect(got.fields.website_url).toBeUndefined()
    expect(got.brief.segment).toBe('residential')
  })

  it('adds ?force=true with force', async () => {
    fetchMock.mockResolvedValueOnce(json(200, { design_brief: leadsBrief(), stored: false }))
    const got = await fetchLeadBrief('biz-1', 'jwt-123', { force: true })
    expect(fetchMock.mock.calls[0][0]).toBe(`${API}/api/businesses/biz-1/design-brief?force=true`)
    expect(got.stored).toBe(false)
  })

  it('coerces a vertical our schema would reject, and says so', async () => {
    fetchMock.mockResolvedValueOnce(json(200, { design_brief: leadsBrief({ vertical: 'Plumbing Contractor' }), stored: true }))
    const got = await fetchLeadBrief('biz-1', 'jwt-123')
    expect(got.brief.vertical).toBe('plumbing_contractor')
    expect(got.coerced).toEqual(['vertical "Plumbing Contractor" → "plumbing_contractor" (our schema wants snake_case)'])
  })

  it.each([
    [401, { error: 'Invalid or expired Supabase JWT' }, 'token rejected'],
    [404, { error: 'Business not found' }, 'business not found in your workspace'],
    [409, { error: 'No completed audit for a design brief' }, 'no completed audit — run the audit in the leads dashboard first'],
  ])('maps HTTP %i to a clear message', async (status, body, message) => {
    fetchMock.mockResolvedValueOnce(json(status, body))
    await expect(fetchLeadBrief('biz-1', 'jwt-123')).rejects.toThrow(message)
  })

  it('reports a brief that does not validate, field by field', async () => {
    fetchMock.mockResolvedValueOnce(json(200, { design_brief: leadsBrief({ tone_descriptors: ['one'] }), stored: true }))
    await expect(fetchLeadBrief('biz-1', 'jwt-123')).rejects.toThrow(/tone_descriptors/)
  })

  it('says where it could not connect when the worker is down', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'))
    await expect(fetchLeadBrief('biz-1', 'jwt-123')).rejects.toThrow(`could not reach the leads API at ${API}`)
  })
})

describe('fetchLeadWebsite', () => {
  it("reads the business's website_url off GET /api/leads", async () => {
    const leads = [
      { business: { id: 'biz-0', website_url: 'https://other.example/' } },
      { business: { id: 'biz-1', website_url: 'https://www.robgoodsonplumbing.com/' } },
    ]
    fetchMock.mockImplementation(async () => json(200, { leads }))
    await expect(fetchLeadWebsite('biz-1', 'jwt-123')).resolves.toEqual({ website_url: 'https://www.robgoodsonplumbing.com/' })
    expect(fetchMock.mock.calls[0][0]).toBe(`${API}/api/leads`)
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ headers: { Authorization: 'Bearer jwt-123' } })
  })

  it('returns null website_url when the record has none, and null when the business is absent', async () => {
    fetchMock.mockImplementation(async () => json(200, { leads: [{ business: { id: 'biz-1', website_url: null } }] }))
    await expect(fetchLeadWebsite('biz-1', 'jwt-123')).resolves.toEqual({ website_url: null })
    await expect(fetchLeadWebsite('biz-9', 'jwt-123')).resolves.toBeNull()
  })
})

describe('photo URLs and the Bearer header', () => {
  it('rewrites worker-relative photo paths to absolute LEADS_API_URL URLs and keeps absolute ones', () => {
    expect(absolutePhotoUrls([PHOTO, 'https://cdn.example/a.jpg'], API)).toEqual([`${API}${PHOTO}`, 'https://cdn.example/a.jpg'])
  })

  it('sends the Bearer header only to the LEADS_API_URL origin', async () => {
    fetchMock.mockImplementation(async () => new Response(new Uint8Array([0xff, 0xd8]), { headers: { 'content-type': 'image/jpeg' } }))
    const bearer = { origin: new URL(API).origin, token: 'jwt-123' }
    const urls = [`${API}${PHOTO}`, 'https://www.robgoodsonplumbing.com/hero.jpg', `http://localhost:9999${PHOTO}`, `https://localhost:8788${PHOTO}`]
    const { candidates } = await downloadImages(urls, undefined, bearer)
    expect(candidates).toHaveLength(4)
    const sent = new Map(fetchMock.mock.calls.map(([url, init]) => [url, (init.headers as Record<string, string>).authorization]))
    expect(sent.get(urls[0])).toBe('Bearer jwt-123')
    expect(sent.get(urls[1])).toBeUndefined()
    expect(sent.get(urls[2])).toBeUndefined()
    expect(sent.get(urls[3])).toBeUndefined()
  })

  it('sends no Authorization header at all without a bearer', () => {
    expect(authHeaderFor(`${API}${PHOTO}`)).toEqual({})
    expect(authHeaderFor('not a url', { origin: API, token: 't' })).toEqual({})
  })
})
