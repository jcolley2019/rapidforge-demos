import { describe, expect, it } from 'vitest'
import { DesignBriefSchema } from './design-brief'
import acmePlumbing from './fixtures/acme-plumbing.json'
import acmeCommercial from './fixtures/acme-commercial.json'
import acmeHvac from './fixtures/acme-hvac.json'
import acmeElectric from './fixtures/acme-electric.json'
import sparseElectric from './fixtures/sparse-electric.json'
import { TRADE_PHOTOS } from './trade-photos'

/** The fields RFD.PRESETS.5 added; everything else predates it. */
const NEW_FIELDS = [
  'service_areas',
  'badges',
  'stats',
  'offers',
  'founded_year',
  'license_number',
  'crew_photo_urls',
  'segment',
  'hours_note',
]

/** acme-plumbing as it stood before RFD.PRESETS.5. */
const acmeBefore = Object.fromEntries(Object.entries(acmePlumbing).filter(([key]) => !NEW_FIELDS.includes(key)))

describe('DesignBriefSchema', () => {
  it('parses the acme-plumbing fixture', () => {
    const brief = DesignBriefSchema.parse(acmePlumbing)
    expect(brief.business_name).toBe('Acme Plumbing')
    expect(brief.services).toHaveLength(6)
    expect(brief.review_quotes).toHaveLength(3)
    expect(brief.hours).toHaveLength(7)
    expect(brief.primary_cta.kind).toBe('booking')
    expect(brief.photo_urls).toEqual([])
  })

  it('rejects fewer than 3 tone_descriptors', () => {
    const result = DesignBriefSchema.safeParse({
      ...acmePlumbing,
      tone_descriptors: ['dependable', 'local'],
    })
    expect(result.success).toBe(false)
  })

  it('rejects an unknown primary_cta.kind', () => {
    const result = DesignBriefSchema.safeParse({
      ...acmePlumbing,
      primary_cta: { ...acmePlumbing.primary_cta, kind: 'email' },
    })
    expect(result.success).toBe(false)
  })

  it('parses the earlier fixtures unchanged and defaults every new field', () => {
    for (const before of [acmeBefore, sparseElectric]) {
      const brief = DesignBriefSchema.parse(before)
      for (const [key, value] of Object.entries(before)) {
        expect(brief[key as keyof typeof brief], key).toEqual(value)
      }
      expect(brief.service_areas).toEqual([])
      expect(brief.badges).toEqual([])
      expect(brief.stats).toEqual([])
      expect(brief.offers).toEqual([])
      expect(brief.founded_year).toBeNull()
      expect(brief.license_number).toBeNull()
      expect(brief.crew_photo_urls).toEqual([])
      expect(brief.segment).toBe('residential')
      expect(brief.hours_note).toBeNull()
    }
  })

  it('leaves every new field absent from the sparse fixture', () => {
    for (const key of NEW_FIELDS) expect(Object.keys(sparseElectric), key).not.toContain(key)
  })

  it('carries the new fields on the acme fixture, crew photos from the plumbing set', () => {
    const brief = DesignBriefSchema.parse(acmePlumbing)
    expect(brief.service_areas).toHaveLength(8)
    expect(brief.badges.map((b) => b.kind)).toEqual(['bbb', 'license', 'award', 'rating'])
    expect(brief.stats).toHaveLength(3)
    expect(brief.offers.map((o) => o.kind)).toEqual(['coupon', 'financing'])
    expect(brief.founded_year).toBe(2004)
    expect(brief.license_number).toBe('PLB-C-12345')
    expect(brief.hours_note).toBe('24/7 emergency service')
    expect(brief.segment).toBe('residential')
    expect(brief.crew_photo_urls).toHaveLength(2)
    for (const url of brief.crew_photo_urls) expect(TRADE_PHOTOS.plumbing.crew).toContain(url)
  })

  it('parses acme-hvac and acme-electric as richly as acme-plumbing, crew photos from their own trade sets', () => {
    const cases = [
      { fixture: acmeHvac, name: 'Acme Heating & Air', vertical: 'hvac', crew: TRADE_PHOTOS.hvac.crew },
      { fixture: acmeElectric, name: 'Acme Electric', vertical: 'electrical', crew: TRADE_PHOTOS.electrical.crew },
    ]
    for (const { fixture, name, vertical, crew } of cases) {
      const brief = DesignBriefSchema.parse(fixture)
      expect(brief.business_name).toBe(name)
      expect(brief.vertical).toBe(vertical)
      expect(brief.segment).toBe('residential')
      expect(brief.services.length).toBeGreaterThanOrEqual(5)
      expect(brief.service_areas).toHaveLength(8)
      expect(brief.badges.map((b) => b.kind)).toContain('license')
      expect(brief.badges.map((b) => b.kind)).toContain('rating')
      expect(brief.stats).toHaveLength(3)
      expect(brief.offers.length).toBeGreaterThanOrEqual(2)
      expect(brief.founded_year).not.toBeNull()
      expect(brief.hours_note).toBe('24/7 emergency service')
      expect(brief.review_quotes).toHaveLength(3)
      expect(brief.crew_photo_urls).toHaveLength(2)
      for (const url of brief.crew_photo_urls) expect(crew, vertical).toContain(url)
    }
  })

  it('parses the commercial twin: two stats, one badge, no offers, a bid request', () => {
    const brief = DesignBriefSchema.parse(acmeCommercial)
    expect(brief.business_name).toBe(acmePlumbing.business_name)
    expect(brief.segment).toBe('commercial')
    expect(brief.stats).toHaveLength(2)
    expect(brief.badges).toHaveLength(1)
    expect(brief.offers).toEqual([])
    expect(brief.primary_cta).toMatchObject({ label: 'Request a bid', kind: 'form' })
  })

  it('caps service_areas at 24: a brief with 25 fails', () => {
    const towns = (n: number) => Array.from({ length: n }, (_, i) => `Town ${i + 1}`)
    expect(DesignBriefSchema.safeParse({ ...acmePlumbing, service_areas: towns(24) }).success).toBe(true)
    expect(DesignBriefSchema.safeParse({ ...acmePlumbing, service_areas: towns(25) }).success).toBe(false)
  })

  it('takes an optional lead_business_id, which must be a uuid', () => {
    expect(DesignBriefSchema.parse(acmePlumbing).lead_business_id).toBeUndefined()
    const id = 'dff84968-ffa0-4188-84e6-079e1556e3e0'
    expect(DesignBriefSchema.parse({ ...acmePlumbing, lead_business_id: id }).lead_business_id).toBe(id)
    expect(DesignBriefSchema.safeParse({ ...acmePlumbing, lead_business_id: 'goodson' }).success).toBe(false)
  })

  it('rejects an unknown badge kind, segment or offer kind, and too many stats', () => {
    const bad = [
      { badges: [{ label: 'Nextdoor Fave', kind: 'sticker' }] },
      { segment: 'industrial' },
      { offers: [{ title: '$25 off', detail: 'Today only.', kind: 'raffle' }] },
      { stats: Array.from({ length: 5 }, (_, i) => ({ label: `stat ${i}`, value: String(i) })) },
      { crew_photo_urls: ['a', 'b', 'c', 'd', 'e'] },
    ]
    for (const patch of bad) {
      expect(DesignBriefSchema.safeParse({ ...acmePlumbing, ...patch }).success, JSON.stringify(patch)).toBe(false)
    }
  })
})
