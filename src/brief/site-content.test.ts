import { describe, expect, it } from 'vitest'
import { DesignBriefSchema } from './design-brief'
import { cityFromAddress, shortNameOf, toSiteContent, verticalLabelOf } from './site-content'
import { TRADE_PHOTOS } from './trade-photos'
import acme from './fixtures/acme-plumbing.json'
import sparse from './fixtures/sparse-electric.json'

const acmeBrief = DesignBriefSchema.parse(acme)
const sparseBrief = DesignBriefSchema.parse(sparse)

describe('toSiteContent', () => {
  it('maps the acme-plumbing fixture without throwing', () => {
    const site = toSiteContent(acmeBrief)
    expect(site.name).toBe('Acme Plumbing')
    expect(site.shortName).toBe('Acme Plumbing')
    expect(site.verticalLabel).toBe('Plumbing')
    expect(site.city).toBe('Nampa')
    expect(site.services).toHaveLength(6)
    expect(site.reviews).toHaveLength(3)
    expect(site.hours).toHaveLength(7)
    expect(site.cta).toEqual({
      label: 'Book a Plumber',
      kind: 'booking',
      href: 'https://example.com/acme-plumbing/book',
    })
    expect(site.headline.length).toBeGreaterThan(0)
    expect(site.subhead.length).toBeGreaterThan(0)
  })

  it('maps the sparse-electric fixture without throwing', () => {
    expect(() => toSiteContent(sparseBrief)).not.toThrow()
    const site = toSiteContent(sparseBrief)
    expect(site.verticalLabel).toBe('Electrical')
    expect(site.services).toEqual([{ title: 'Panel upgrades', blurb: expect.any(String) }])
    expect(site.cta.href).toBe('#quote')
  })

  it('strips formatting from the phone into a tel: href', () => {
    const site = toSiteContent(acmeBrief)
    expect(site.phone).toBe('(208) 555-0142')
    expect(site.phoneHref).toBe('tel:2085550142')
  })

  it('gives a sparse brief empty reviews, null hours, and null contact fields', () => {
    const site = toSiteContent(sparseBrief)
    expect(site.reviews).toEqual([])
    expect(site.hours).toBeNull()
    expect(site.phone).toBeNull()
    expect(site.phoneHref).toBeNull()
    expect(site.address).toBeNull()
    expect(site.city).toBeNull()
  })

  it('carries photo_urls through as photos, falling back to the trade heroes', () => {
    expect(toSiteContent(acmeBrief).photos).toEqual(TRADE_PHOTOS.plumbing.hero)
    expect(toSiteContent(sparseBrief).photos).toEqual(TRADE_PHOTOS.electrical.hero)
    const withPhotos = toSiteContent({ ...acmeBrief, photo_urls: ['https://img.example/a.jpg', ' '] })
    expect(withPhotos.photos).toEqual(['https://img.example/a.jpg'])
    expect(withPhotos.detailPhotos).toEqual(TRADE_PHOTOS.plumbing.detail)
  })

  it('builds trust chips without inventing a year or license number', () => {
    const acmeSite = toSiteContent(acmeBrief)
    expect(acmeSite.trust).toEqual(['Licensed & insured', 'Same-day service', 'Upfront pricing', 'Serving Nampa'])
    for (const chip of acmeSite.trust) expect(chip).not.toMatch(/\d/)
    const sparseSite = toSiteContent(sparseBrief)
    expect(sparseSite.trust).toEqual(['Licensed & insured', 'Same-day service', 'Upfront pricing'])
  })

  it('offers click-to-call as the secondary CTA only when there is a phone', () => {
    expect(toSiteContent(acmeBrief).ctaSecondary).toEqual({ label: 'Call (208) 555-0142', href: 'tel:2085550142' })
    expect(toSiteContent(sparseBrief).ctaSecondary).toBeNull()
    expect(toSiteContent(acmeBrief).ctaHeadline).toBe('Need a plumber today?')
    expect(toSiteContent(sparseBrief).ctaHeadline).toBe('Need an electrician today?')
  })

  it('is deterministic: the same brief twice gives the same headline and subhead', () => {
    const a = toSiteContent(acmeBrief)
    const b = toSiteContent(acmeBrief)
    expect(a.headline).toBe(b.headline)
    expect(a.subhead).toBe(b.subhead)
  })

  it('keeps review quotes verbatim and never invents an author', () => {
    const site = toSiteContent(acmeBrief)
    expect(site.reviews[0].text).toBe(acmeBrief.review_quotes[0].text)
    expect(site.reviews[2].author).toBeNull()
  })

  it('routes a phone-kind CTA to the tel: href', () => {
    const site = toSiteContent({
      ...acmeBrief,
      primary_cta: { label: 'Call now', kind: 'phone', href: 'https://ignored.example' },
    })
    expect(site.cta.href).toBe('tel:2085550142')
  })
})

describe('helpers', () => {
  it('shortNameOf takes the first two words', () => {
    expect(shortNameOf('Acme Plumbing')).toBe('Acme Plumbing')
    expect(shortNameOf('Treasure Valley Heating & Air')).toBe('Treasure Valley')
    expect(shortNameOf('Zap')).toBe('Zap')
  })

  it('verticalLabelOf maps known verticals and title-cases the rest', () => {
    expect(verticalLabelOf('hvac_contractor')).toBe('Heating & Cooling')
    expect(verticalLabelOf('mobile_dog_grooming')).toBe('Mobile Dog Grooming')
  })

  it('cityFromAddress handles common shapes', () => {
    expect(cityFromAddress('1480 Caldwell Blvd, Nampa, ID 83651')).toBe('Nampa')
    expect(cityFromAddress('12 Elm St, Caldwell ID 83605')).toBe('Caldwell')
    expect(cityFromAddress('Just a street')).toBeNull()
    expect(cityFromAddress(null)).toBeNull()
  })
})
