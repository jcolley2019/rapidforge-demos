// @vitest-environment node
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { CompletionRequest, CompletionResponse } from '@rapidforge/ai-core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DesignBriefSchema } from '../brief/design-brief'
import { TRADE_PHOTOS } from '../brief/trade-photos'
import nosite from '../test/fixtures/lead-nosite.json'
import type { AiClient } from './ai'
import { IntakeError, runIntake } from './cli'
import { LEAD_PHOTOS_STOCK, NO_WEBSITE, leadBriefFrom } from './leads'

/** The fictional no-website lead's slug: its business name's words. */
const SLUG = 'summit-and-sage-plumbing-llc'
const LEAD_BRIEF = nosite.audit.design_brief

const REFINED = {
  services: ['Water Heater Repair', 'Drain Cleaning', 'Water Leak Detection'],
  tone_descriptors: ['professional', 'courteous', 'prompt', 'tidy'],
  segment: 'commercial',
  segment_reason: 'Speaks to building managers.',
  current_site_problem: null,
  hours: null,
}

function client(answer: () => string | Error): AiClient & { requests: CompletionRequest[] } {
  const requests: CompletionRequest[] = []
  return {
    requests,
    async complete(req): Promise<CompletionResponse> {
      requests.push(req)
      const out = answer()
      if (out instanceof Error) throw out
      return { text: out, provider: 'anthropic', model: 'claude-sonnet-5-5', finishReason: 'stop' }
    },
  }
}

let root: string
let fetchMock: ReturnType<typeof vi.fn>
let logs: string[]

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'rfd-nosite-'))
  fetchMock = vi.fn(async () => {
    throw new Error('no network in tests')
  })
  vi.stubGlobal('fetch', fetchMock)
  logs = []
  vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
    logs.push(args.join(' '))
  })
})

afterEach(() => {
  rmSync(root, { recursive: true, force: true })
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

/** runIntake for the fixture lead, read without a fetch, writing under the temp root. */
function run(ai: AiClient, extra: { url?: string; slug?: string; dry?: boolean } = {}) {
  return runIntake({ lead: nosite.business.id, root, fetchLead: async () => leadBriefFrom(nosite.business, nosite.audit), ai, ...extra })
}

const file = (...parts: string[]) => join(root, ...parts)
const appBrief = () => DesignBriefSchema.parse(JSON.parse(readFileSync(file('src', 'brief', 'fixtures', `lead-${SLUG}.json`), 'utf8')))
const report = () => readFileSync(file('leads', SLUG, 'intake-report.md'), 'utf8')

describe('brief-only intake (a lead with no website)', () => {
  it('makes no network call: no fetch, no crawl, no vision, one refine call', async () => {
    const ai = client(() => JSON.stringify(REFINED))
    const result = await run(ai)
    expect(fetchMock).not.toHaveBeenCalled()
    expect(ai.requests).toHaveLength(1)
    expect(result).toEqual({ businessId: nosite.business.id, businessName: 'Summit and Sage Plumbing LLC', slug: SLUG, url: null })
  })

  it('names the slug from the business name, and --slug still wins', async () => {
    expect((await run(client(() => JSON.stringify(REFINED)))).slug).toBe(SLUG)
    expect((await run(client(() => JSON.stringify(REFINED)), { slug: 'summit' })).slug).toBe('summit')
    expect(existsSync(file('leads', 'summit', 'brief.json'))).toBe(true)
  })

  it('writes the lead folder and fixture, and no site assets', async () => {
    await run(client(() => JSON.stringify(REFINED)))
    for (const name of ['brief.json', 'intake-report.md', 'lead-api-brief.json']) expect(existsSync(file('leads', SLUG, name))).toBe(true)
    expect(existsSync(file('src', 'brief', 'fixtures', `lead-${SLUG}.json`))).toBe(true)
    expect(existsSync(file('public', 'leads', SLUG))).toBe(false)
    expect(JSON.parse(readFileSync(file('leads', SLUG, 'lead-api-brief.json'), 'utf8'))).toEqual({ business: nosite.business, audit: nosite.audit })
  })

  it("keeps the lead's facts, fills photos from the trade's stock, and leaves every site field empty", async () => {
    await run(client(() => JSON.stringify(REFINED)))
    const brief = appBrief()
    expect(brief.business_name).toBe('Summit and Sage Plumbing LLC')
    expect(brief.phone).toBe(LEAD_BRIEF.phone)
    expect(brief.address).toBe(LEAD_BRIEF.address)
    expect(brief.hours).toEqual(LEAD_BRIEF.hours)
    expect(brief.review_quotes).toEqual(LEAD_BRIEF.review_quotes)
    expect(brief.primary_cta).toEqual(LEAD_BRIEF.primary_cta)
    expect(brief.lead_business_id).toBe(nosite.business.id)
    expect(brief.photo_urls).toEqual(TRADE_PHOTOS.plumbing.hero)
    expect(brief.brand_colors).toEqual([])
    expect(brief.current_site).toBeNull()
    expect(brief.website_url).toBeNull()
    expect(brief.logo_url).toBeNull()
    // The refine pass said commercial; with no website to judge from, the default stands.
    expect(brief.segment).toBe('residential')
  })

  it("uses the refine pass's wording of the lead's services and tone", async () => {
    const ai = client(() => JSON.stringify(REFINED))
    await run(ai)
    expect(appBrief().services).toEqual(REFINED.services)
    expect(appBrief().tone_descriptors).toEqual(REFINED.tone_descriptors)
    const prompt = String(ai.requests[0].messages.find((m) => m.role === 'user')?.content)
    expect(prompt).toContain('Website: (none')
    expect(prompt).toContain('- water heater repair')
    expect(prompt).toContain(`Review text:\n${LEAD_BRIEF.review_quotes[0].text}`)
  })

  it("keeps the lead's own services and tone when the refine call fails, and flags it", async () => {
    await run(client(() => new Error('overloaded')))
    expect(appBrief().services).toEqual(LEAD_BRIEF.services)
    expect(appBrief().tone_descriptors).toEqual(LEAD_BRIEF.tone_descriptors)
    expect(report()).toContain("refine: services kept the lead brief's words (overloaded)")
  })

  it('says so in the summary table header and the report', async () => {
    await run(client(() => JSON.stringify(REFINED)))
    const table = logs.find((line) => line.includes('field  '))
    expect(table?.startsWith(`\n${NO_WEBSITE}\nfield`)).toBe(true)
    expect(report()).toContain('- Site: none (no website — brief-only intake)')
    expect(report()).toContain(LEAD_PHOTOS_STOCK)
    expect(report()).toContain('No website: photo_urls are stock photos for the trade')
  })

  it('stops a dry run before the refine, with the same header', async () => {
    const ai = client(() => JSON.stringify(REFINED))
    await run(ai, { dry: true })
    expect(ai.requests).toHaveLength(0)
    expect(logs.some((line) => line.startsWith(`\n${NO_WEBSITE}\nfield`))).toBe(true)
    expect(existsSync(file('leads', SLUG, 'lead-api-brief.json'))).toBe(true)
    expect(existsSync(file('leads', SLUG, 'brief.json'))).toBe(false)
  })

  it('still crawls when --url is given', async () => {
    await expect(run(client(() => JSON.stringify(REFINED)), { url: 'https://summit-sage.example' })).rejects.toBeInstanceOf(IntakeError)
    expect(String(fetchMock.mock.calls[0][0])).toContain('summit-sage.example')
  })
})
