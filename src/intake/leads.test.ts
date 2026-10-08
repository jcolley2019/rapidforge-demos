// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LEAD_PHOTOS_SKIPPED, NO_DESIGN_BRIEF, fetchLeadBrief } from './leads'
import { mergeBrief } from './merge'

const SUPABASE = 'https://leads-project.supabase.co'
const KEY = 'service-role-key'
const BUSINESS_ID = '6f1c2d3e-0000-4000-8000-000000000001'
const PHOTO = '/api/places/photo/places%2FChIJabc%2Fphotos%2FAtY123?maxWidthPx=1600'

/** A brief as the leads worker's design-brief agent stores it in audits.design_brief. */
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

const BUSINESS = { id: BUSINESS_ID, name: 'Goodson Plumbing Services', website_url: 'https://www.robgoodsonplumbing.com/' }

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}

let fetchMock: ReturnType<typeof vi.fn>

/** Answers the businesses read and the audits read with these rows. */
function rows(businesses: unknown[], audits: unknown[] = []) {
  fetchMock.mockImplementation(async (url: string) => json(200, new URL(url).pathname.endsWith('/businesses') ? businesses : audits))
}

function call(i: number) {
  const [url, init] = fetchMock.mock.calls[i] as [string, RequestInit]
  const parsed = new URL(url)
  return { path: parsed.pathname, query: Object.fromEntries(parsed.searchParams), headers: init.headers }
}

beforeEach(() => {
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
  vi.stubEnv('LEADS_SUPABASE_URL', `${SUPABASE}/`)
  vi.stubEnv('LEADS_SUPABASE_SERVICE_ROLE_KEY', KEY)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('fetchLeadBrief', () => {
  it('reads the business, then its newest completed audit that has a brief', async () => {
    const audit = { id: 'audit-1', completed_at: '2026-10-07T20:00:00Z', design_brief: leadsBrief() }
    rows([BUSINESS], [audit])
    const got = await fetchLeadBrief(BUSINESS_ID)

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(call(0)).toMatchObject({ path: '/rest/v1/businesses', query: { select: 'id,name,website_url', id: `eq.${BUSINESS_ID}` } })
    expect(call(1)).toMatchObject({
      path: '/rest/v1/audits',
      query: {
        select: 'id,completed_at,design_brief',
        business_id: `eq.${BUSINESS_ID}`,
        status: 'eq.completed',
        completed_at: 'not.is.null',
        design_brief: 'not.is.null',
        order: 'completed_at.desc',
        limit: '1',
      },
    })
    expect(got.business).toEqual(BUSINESS)
    expect(got.raw).toEqual({ business: BUSINESS, audit })
    expect(got.brief.business_name).toBe('Goodson Plumbing Services')
    expect(got.coerced).toEqual([])
  })

  it('sends the service-role key as apikey and as the Bearer token on both reads', async () => {
    rows([BUSINESS], [{ id: 'audit-1', design_brief: leadsBrief() }])
    await fetchLeadBrief(BUSINESS_ID)
    for (const i of [0, 1]) {
      expect(call(i).headers).toMatchObject({ apikey: KEY, Authorization: `Bearer ${KEY}` })
    }
  })

  it('says the business was not found, without reading audits', async () => {
    rows([])
    await expect(fetchLeadBrief(BUSINESS_ID)).rejects.toThrow(`business ${BUSINESS_ID} not found`)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('says where in the leads app to make the design brief when no completed audit has one', async () => {
    rows([BUSINESS], [])
    await expect(fetchLeadBrief(BUSINESS_ID)).rejects.toThrow(NO_DESIGN_BRIEF)
    expect(NO_DESIGN_BRIEF).toBe('No design brief yet — open the lead in RapidForge Leads, Design Brief tab, click Design brief, then rerun.')
  })

  it('empties photo_urls for the merge, counts what it dropped, and lets the site photos fill in', async () => {
    rows([BUSINESS], [{ id: 'audit-1', design_brief: leadsBrief() }])
    const got = await fetchLeadBrief(BUSINESS_ID)
    expect(got.fields.photo_urls).toEqual([])
    expect(got.skippedPhotos).toBe(1)
    expect(got.brief.photo_urls).toEqual([PHOTO])
    expect(LEAD_PHOTOS_SKIPPED).toBe('lead photos skipped (worker-only URLs); site photos used')

    const merged = mergeBrief(got.fields, { photo_urls: { value: ['photos/01.jpg'], status: 'inferred', how: 'tagged by vision' } })
    expect(merged.brief.photo_urls).toEqual(['photos/01.jpg'])
    expect(merged.provenance.photo_urls.status).toBe('inferred')
    expect(merged.provenance.business_name.status).toBe('lead')
  })

  it('keeps only the fields the leads app set, so site values still fill the rest', async () => {
    rows([BUSINESS], [{ id: 'audit-1', design_brief: leadsBrief() }])
    const got = await fetchLeadBrief(BUSINESS_ID)
    expect(got.fields.segment).toBeUndefined()
    expect(got.fields.website_url).toBeUndefined()
    expect(got.brief.segment).toBe('residential')
  })

  it('sets lead_business_id from the business row, so the built site sends it with a pick', async () => {
    rows([BUSINESS], [{ id: 'audit-1', design_brief: leadsBrief() }])
    const got = await fetchLeadBrief(BUSINESS_ID)
    expect(got.fields.lead_business_id).toBe(BUSINESS_ID)
    expect(mergeBrief(got.fields, {}).brief.lead_business_id).toBe(BUSINESS_ID)
  })

  it('coerces a vertical our schema would reject, and says so', async () => {
    rows([BUSINESS], [{ id: 'audit-1', design_brief: leadsBrief({ vertical: 'Plumbing Contractor' }) }])
    const got = await fetchLeadBrief(BUSINESS_ID)
    expect(got.brief.vertical).toBe('plumbing_contractor')
    expect(got.fields.vertical).toBe('plumbing_contractor')
    expect(got.coerced).toEqual(['vertical "Plumbing Contractor" → "plumbing_contractor" (our schema wants snake_case)'])
  })

  it('reports a brief that does not validate, field by field', async () => {
    rows([BUSINESS], [{ id: 'audit-1', design_brief: leadsBrief({ tone_descriptors: ['one'] }) }])
    await expect(fetchLeadBrief(BUSINESS_ID)).rejects.toThrow(/tone_descriptors/)
  })

  it('reads a blank website_url as null', async () => {
    rows([{ ...BUSINESS, website_url: '  ' }], [{ id: 'audit-1', design_brief: leadsBrief() }])
    expect((await fetchLeadBrief(BUSINESS_ID)).business.website_url).toBeNull()
  })

  it('passes on what PostgREST says when a read fails', async () => {
    fetchMock.mockResolvedValueOnce(json(400, { code: '22P02', message: 'invalid input syntax for type uuid: "nope"' }))
    await expect(fetchLeadBrief('nope')).rejects.toThrow('reading businesses failed (HTTP 400: invalid input syntax for type uuid: "nope")')
  })

  it('names only LEADS_SUPABASE_URL and LEADS_SUPABASE_SERVICE_ROLE_KEY when the env is incomplete', async () => {
    vi.stubEnv('LEADS_SUPABASE_SERVICE_ROLE_KEY', '')
    const error = await fetchLeadBrief(BUSINESS_ID).then(
      () => new Error('fetchLeadBrief resolved'),
      (e: Error) => e,
    )
    expect(error.message).toBe(
      '--lead reads the leads Supabase directly: set LEADS_SUPABASE_URL and LEADS_SUPABASE_SERVICE_ROLE_KEY in .env (missing: LEADS_SUPABASE_SERVICE_ROLE_KEY)',
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
