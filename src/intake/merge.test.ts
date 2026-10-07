// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { DesignBriefSchema } from '../brief/design-brief'
import acme from '../brief/fixtures/acme-plumbing.json'
import { mergeBrief, parseLeadBrief, rebaseAssets, type SiteFields } from './merge'

const site: SiteFields = {
  business_name: { value: 'Acme Plumbing Co.', status: 'found', how: 'og:site_name' },
  vertical: { value: 'plumbing', status: 'inferred', how: 'keyword count' },
  tone_descriptors: { value: ['honest', 'quick', 'local'], status: 'inferred', how: 'refine' },
  services: { value: ['Drain Cleaning'], status: 'inferred', how: 'refine' },
  review_quotes: { value: [], status: 'found', how: 'JSON-LD Review' },
  photo_urls: { value: ['photos/01.jpg', 'photos/02.jpg'], status: 'inferred', how: 'tagged' },
  hours: { value: null, status: 'found', how: 'JSON-LD openingHours' },
  phone: { value: '(208) 555-0199', status: 'found', how: 'tel: link' },
  address: { value: null, status: 'found', how: 'JSON-LD address' },
  primary_cta: { value: { label: 'Call now', kind: 'phone', href: 'tel:2085550199' }, status: 'inferred', how: 'click-to-call' },
  current_site_problem: { value: 'Current site has no tap-to-call phone link and lists no hours.', status: 'inferred', how: 'refine' },
  generated_at: { value: '2026-10-06T20:00:00.000Z', status: 'generated', how: 'run' },
  source: { value: { audit_id: 'intake-acme', template_fallback: false }, status: 'generated', how: 'run' },
  license_number: { value: 'PL-12345', status: 'found', how: 'page text' },
  logo_url: { value: 'logo.png', status: 'found', how: 'img marked "logo"' },
  brand_colors: { value: ['#1d4ed8'], status: 'found', how: 'stylesheet' },
  current_site: {
    value: { desktop_url: 'current-desktop.jpg', mobile_url: 'current-mobile.jpg', captured_at: '2026-10-06T20:00:00.000Z' },
    status: 'generated',
    how: 'playwright',
  },
}

describe('mergeBrief', () => {
  it('takes a non-empty lead value over the site value', () => {
    const lead = parseLeadBrief({ business_name: 'Acme Plumbing', services: ['Water heaters', 'Sewer repair'], phone: '(208) 555-0142' })
    const { brief, provenance } = mergeBrief(lead, site)
    expect(brief.business_name).toBe('Acme Plumbing')
    expect(brief.services).toEqual(['Water heaters', 'Sewer repair'])
    expect(brief.phone).toBe('(208) 555-0142')
    expect(provenance.business_name).toEqual({ status: 'lead', how: 'lead brief' })
  })

  it('fills a null or empty lead value from the site', () => {
    const lead = parseLeadBrief({ ...acme, phone: null, photo_urls: [], license_number: '', crew_photo_urls: [] })
    const { brief, provenance } = mergeBrief(lead, site)
    expect(brief.phone).toBe('(208) 555-0199')
    expect(brief.photo_urls).toEqual(['photos/01.jpg', 'photos/02.jpg'])
    expect(brief.license_number).toBe('PL-12345')
    expect(provenance.phone).toEqual({ status: 'found', how: 'tel: link' })
    // Lead values everywhere else.
    expect(brief.business_name).toBe('Acme Plumbing')
    expect(brief.review_quotes).toHaveLength(3)
    expect(brief.offers).toEqual(acme.offers)
  })

  it('produces a brief that parses, with schema defaults last and empty fields marked missing', () => {
    const { brief, provenance } = mergeBrief(null, site)
    expect(DesignBriefSchema.safeParse(brief).success).toBe(true)
    expect(brief.offers).toEqual([])
    expect(brief.segment).toBe('residential')
    expect(provenance.offers.status).toBe('missing')
    expect(provenance.segment).toEqual({ status: 'default', how: 'schema default' })
    expect(provenance.hours.status).toBe('missing')
    expect(provenance.logo_url).toEqual({ status: 'found', how: 'img marked "logo"' })
    expect(brief.current_site?.desktop_url).toBe('current-desktop.jpg')
  })

  it('throws when the merged brief does not validate', () => {
    const { tone_descriptors: _dropped, ...withoutTone } = site
    expect(() => mergeBrief(null, withoutTone)).toThrow()
  })

  it('leaves absent lead fields absent instead of defaulting them', () => {
    expect(parseLeadBrief({ business_name: 'X' })).toEqual({ business_name: 'X' })
  })
})

describe('rebaseAssets', () => {
  it('moves lead-relative asset paths under the public base and leaves URLs alone', () => {
    const { brief } = mergeBrief(null, {
      ...site,
      crew_photo_urls: { value: ['photos/03.jpg', 'https://images.example/crew.jpg'], status: 'inferred', how: 'tagged' },
    })
    const app = rebaseAssets(brief, '/leads/acme')
    expect(app.photo_urls).toEqual(['/leads/acme/photos/01.jpg', '/leads/acme/photos/02.jpg'])
    expect(app.crew_photo_urls).toEqual(['/leads/acme/photos/03.jpg', 'https://images.example/crew.jpg'])
    expect(app.logo_url).toBe('/leads/acme/logo.png')
    expect(app.current_site).toEqual({
      desktop_url: '/leads/acme/current-desktop.jpg',
      mobile_url: '/leads/acme/current-mobile.jpg',
      captured_at: '2026-10-06T20:00:00.000Z',
    })
    expect(DesignBriefSchema.safeParse(app).success).toBe(true)
  })
})
