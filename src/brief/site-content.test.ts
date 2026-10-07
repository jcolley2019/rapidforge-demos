import { describe, expect, it } from 'vitest'
import { DesignBriefSchema } from './design-brief'
import {
  cityFromAddress,
  forLean,
  servingList,
  shortNameOf,
  toSiteContent,
  utilityLineOf,
  verticalLabelOf,
} from './site-content'
import { badgeFace, badgeScore, credentialLines, heroActions, servingHeading } from './site-helpers'
import { TRADE_PHOTOS } from './trade-photos'
import acme from './fixtures/acme-plumbing.json'
import commercial from './fixtures/acme-commercial.json'
import hvac from './fixtures/acme-hvac.json'
import electric from './fixtures/acme-electric.json'
import sparse from './fixtures/sparse-electric.json'

const acmeBrief = DesignBriefSchema.parse(acme)
const commercialBrief = DesignBriefSchema.parse(commercial)
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

  it('carries the brief vertical as given', () => {
    expect(toSiteContent(acmeBrief).vertical).toBe('plumbing')
    expect(toSiteContent(sparseBrief).vertical).toBe('electrician')
  })

  it('maps acme-hvac and acme-electric to their vertical, five or more services and their trade crew set', () => {
    const cases = [
      { fixture: hvac, vertical: 'hvac', label: 'Heating & Cooling', city: 'Meridian', crew: TRADE_PHOTOS.hvac.crew },
      { fixture: electric, vertical: 'electrical', label: 'Electrical', city: 'Boise', crew: TRADE_PHOTOS.electrical.crew },
    ]
    for (const { fixture, vertical, label, city, crew } of cases) {
      const site = toSiteContent(DesignBriefSchema.parse(fixture))
      expect(site.vertical).toBe(vertical)
      expect(site.verticalLabel).toBe(label)
      expect(site.city).toBe(city)
      expect(site.mode).toBe('residential')
      expect(site.services.length).toBeGreaterThanOrEqual(5)
      for (const s of site.services) expect(s.blurb, s.title).not.toBe('')
      expect(site.crewPhotos).toHaveLength(2)
      for (const url of site.crewPhotos) expect(crew).toContain(url)
      expect(site.serviceAreas).toHaveLength(8)
      expect(site.licenseNumber).not.toBeNull()
      expect(site.utilityLine).toMatch(/^24\/7 emergency service · Serving /)
    }
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

  it('falls back to the default trust chips, without inventing a year or license number', () => {
    const withoutProof = toSiteContent({ ...acmeBrief, badges: [], stats: [] })
    expect(withoutProof.trust).toEqual(['Licensed & insured', 'Same-day service', 'Upfront pricing', 'Serving Nampa'])
    for (const chip of withoutProof.trust) expect(chip).not.toMatch(/\d/)
    const sparseSite = toSiteContent(sparseBrief)
    expect(sparseSite.trust).toEqual(['Licensed & insured', 'Same-day service', 'Upfront pricing'])
  })

  it('builds trust chips from badges and stats when the brief has them', () => {
    expect(toSiteContent(acmeBrief).trust).toEqual([
      'BBB A+',
      'Idaho license PLB-C-12345',
      'Best of Treasure Valley 2025',
      '4.9 from 312 Google reviews',
      '22 years in business',
      '9,000+ jobs completed',
      'Licensed and insured',
    ])
    expect(toSiteContent(commercialBrief).trust).toEqual([
      'Idaho license PLB-C-12345',
      '22 years in business',
      '400+ commercial projects',
    ])
  })

  it('maps every new brief field through', () => {
    const site = toSiteContent(acmeBrief)
    expect(site.serviceAreas).toEqual(acmeBrief.service_areas)
    expect(site.badges).toEqual(acmeBrief.badges)
    expect(site.stats).toEqual(acmeBrief.stats)
    expect(site.offers).toEqual(acmeBrief.offers)
    expect(site.foundedYear).toBe(2004)
    expect(site.licenseNumber).toBe('PLB-C-12345')
    expect(site.crewPhotos).toEqual(acmeBrief.crew_photo_urls)
    expect(site.hoursNote).toBe('24/7 emergency service')
    expect(site.segment).toBe('residential')
    expect(site.mode).toBe('residential')
    expect(site.navCtaLabel).toBe('Book a Plumber')
  })

  it('gives a sparse brief empty proof, no crew, and no utility line', () => {
    const site = toSiteContent(sparseBrief)
    expect(site.serviceAreas).toEqual([])
    expect(site.badges).toEqual([])
    expect(site.stats).toEqual([])
    expect(site.offers).toEqual([])
    expect(site.crewPhotos).toEqual([])
    expect(site.foundedYear).toBeNull()
    expect(site.licenseNumber).toBeNull()
    expect(site.utilityLine).toBeNull()
    expect(credentialLines(site)).toEqual(['Licensed & insured'])
  })

  it('builds the utility line from hours_note and the first three towns', () => {
    expect(toSiteContent(acmeBrief).utilityLine).toBe('24/7 emergency service · Serving Nampa, Caldwell, Meridian & more')
    expect(toSiteContent(commercialBrief).utilityLine).toBe('Serving Nampa, Caldwell, Meridian & more')
    expect(utilityLineOf('Open Saturdays', [])).toBe('Open Saturdays')
    expect(servingList(['Kuna'])).toBe('Kuna')
    expect(servingList(['Kuna', 'Star'])).toBe('Kuna & Star')
    expect(servingList(['Kuna', 'Star', 'Eagle'])).toBe('Kuna, Star & Eagle')
  })

  it('heads the service areas from the data, not a region name in code', () => {
    const site = toSiteContent(acmeBrief)
    expect(servingHeading(site)).toBe('Serving Nampa and 7 nearby towns')
    expect(servingHeading({ ...site, city: null, serviceAreas: ['Kuna', 'Star'] })).toBe('Serving Kuna and 1 nearby town')
    expect(servingHeading({ ...site, serviceAreas: [] })).toBe('')
  })

  it('reads badges as marks: a rating leads with its score, BBB with its grade', () => {
    const [bbb, license, award, rating] = acmeBrief.badges
    expect(badgeFace(bbb)).toEqual({ big: 'A+', small: 'BBB' })
    expect(badgeFace(license)).toEqual({ big: 'Idaho license', small: 'PLB-C-12345' })
    expect(badgeFace(award)).toEqual({ big: 'Best of Treasure Valley 2025', small: null })
    expect(badgeFace(rating)).toEqual({ big: '4.9', small: '312 Google reviews' })
    expect(badgeScore(rating)).toBe(4.9)
    expect(badgeScore(bbb)).toBeNull()
  })

  it('ranks the hero actions: Call first on a residential page, the bid request first on a commercial one', () => {
    const call = { label: 'Call (208) 555-0142', href: 'tel:2085550142', call: true }
    const residential = heroActions(toSiteContent(acmeBrief))
    expect(residential.primary).toEqual(call)
    expect(residential.secondary).toEqual({ label: 'Book a Plumber', href: acmeBrief.primary_cta.href, call: false })

    const commercialActions = heroActions(toSiteContent(commercialBrief))
    expect(commercialActions.primary.label).toBe('Request a bid')
    expect(commercialActions.secondary).toEqual(call)

    // No phone: the brief's own action alone. An action that already dials: one button, not two.
    expect(heroActions(toSiteContent(sparseBrief))).toEqual({
      primary: { label: 'Request a Quote', href: '#quote', call: false },
      secondary: null,
    })
    const dials = heroActions(
      toSiteContent({ ...acmeBrief, primary_cta: { label: 'Call now', kind: 'phone', href: 'https://ignored.example' } }),
    )
    expect(dials).toEqual({ primary: { label: 'Call now', href: 'tel:2085550142', call: true }, secondary: null })
  })

  it('switches a commercial brief: bid request, audience in the subhead, who-we-work-with tiles', () => {
    const site = toSiteContent(commercialBrief)
    expect(site.mode).toBe('commercial')
    expect(site.navCtaLabel).toBe('Request a bid')
    expect(site.subhead).toMatch(/general contractors, property managers and builders/)
    expect(site.subhead).toContain('Nampa')
    expect(site.audiences.length).toBeGreaterThanOrEqual(3)
    expect(site.audiences.length).toBeLessThanOrEqual(4)
    expect(site.offers).toEqual([])
    const builders = toSiteContent({ ...commercialBrief, segment: 'new_construction' })
    expect(builders.mode).toBe('commercial')
    expect(builders.subhead).toMatch(/builders, developers and general contractors/)
  })

  it('leans: jobsite register on a residential brief, full switch on a mixed one', () => {
    const residential = toSiteContent(acmeBrief)
    expect(forLean(residential, 'residential')).toBe(residential)
    const jobsite = forLean(residential, 'commercial')
    expect(jobsite.mode).toBe('residential')
    expect(jobsite.navCtaLabel).toBe('Book a Plumber')
    expect(jobsite.headline).toBe('Plumbing done to spec, on schedule.')
    expect(jobsite.subhead).not.toMatch(/contractors|property managers|builders/)
    expect(jobsite.offers).toEqual(residential.offers)

    const mixed = toSiteContent({ ...acmeBrief, segment: 'mixed' })
    expect(mixed.mode).toBe('residential')
    expect(forLean(mixed, 'residential')).toBe(mixed)
    const leaned = forLean(mixed, 'commercial')
    expect(leaned.mode).toBe('commercial')
    expect(leaned.navCtaLabel).toBe('Request a bid')
    expect(leaned.cta).toEqual({ ...mixed.cta, label: 'Request a bid' })
    expect(leaned.subhead).toMatch(/general contractors, property managers and builders/)

    const already = toSiteContent(commercialBrief)
    expect(forLean(already, 'commercial')).toBe(already)
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
