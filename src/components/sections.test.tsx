import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import AudienceStrip from './AudienceStrip'
import Offers from './Offers'
import ServiceAreas from './ServiceAreas'
import UtilityBar from './UtilityBar'
import { DesignBriefSchema } from '../brief/design-brief'
import { forLean, toSiteContent } from '../brief/site-content'
import { servingHeading } from '../brief/site-helpers'
import acme from '../brief/fixtures/acme-plumbing.json'
import commercial from '../brief/fixtures/acme-commercial.json'
import sparse from '../brief/fixtures/sparse-electric.json'

const acmeBrief = DesignBriefSchema.parse(acme)
const acmeSite = toSiteContent(acmeBrief)
const commercialSite = toSiteContent(DesignBriefSchema.parse(commercial))
const sparseSite = toSiteContent(DesignBriefSchema.parse(sparse))
/** The commercial page with offers in the brief anyway. */
const commercialWithOffers = { ...commercialSite, offers: acmeSite.offers }

describe('UtilityBar', () => {
  it('puts the utility line, a call link and the page action above the nav', () => {
    const { container } = render(<UtilityBar site={acmeSite} />)
    expect(container.querySelector('.ub-line')?.textContent).toBe(acmeSite.utilityLine)
    // Everything after the hours note can drop on a phone instead of being cut mid-word.
    expect([...container.querySelectorAll('.ub-part')].map((p) => p.classList.contains('ub-more'))).toEqual([
      false,
      true,
    ])
    expect(container.querySelector('a.ub-call')?.getAttribute('href')).toBe('tel:2085550142')
    const book = container.querySelector('a.ub-book')
    expect(book?.textContent).toBe('Book a Plumber')
    expect(book?.getAttribute('href')).toBe(acmeSite.cta.href)
    expect(render(<UtilityBar site={commercialSite} />).container.querySelector('.ub-book')?.textContent).toBe(
      'Request a bid',
    )
  })

  it('still shows the call link with a phone and no utility line', () => {
    const { container } = render(<UtilityBar site={{ ...acmeSite, utilityLine: null }} />)
    expect(container.querySelector('.ub-line')).toBeNull()
    expect(container.querySelector('.ub-call')).not.toBeNull()
  })

  it('shows the phone once when the page action is itself the call (All Plumbing & Sewer)', () => {
    const site = toSiteContent({
      ...acmeBrief,
      primary_cta: { label: `Call ${acmeBrief.phone}`, kind: 'phone', href: 'tel:2085550142' },
    })
    for (const s of [site, { ...site, utilityLine: null }]) {
      const { container } = render(<UtilityBar site={s} />)
      const links = [...container.querySelectorAll('a')]
      expect(links.map((a) => a.getAttribute('href'))).toEqual(['tel:2085550142'])
      expect(container.querySelector('.ub-book')).toBeNull()
      expect(container.textContent?.split(acmeBrief.phone!).length).toBe(2)
    }
  })

  it('hides when there is no utility line and no phone, as on the sparse brief', () => {
    expect(render(<UtilityBar site={sparseSite} />).container.innerHTML).toBe('')
  })
})

describe('Offers', () => {
  it('shows a coupon as a ticket and financing as a card', () => {
    const { container } = render(<Offers site={acmeSite} />)
    const items = [...container.querySelectorAll('.of-item')]
    expect(items.map((i) => i.className)).toEqual(['of-item of-coupon', 'of-item of-financing'])
    expect(items[0].querySelector('.of-stub')?.textContent).toBe('Coupon')
    expect(items[0].querySelector('.of-title')?.textContent).toBe('$50 off any repair')
    expect(items[0].querySelector('.of-expires')?.textContent).toBe('Ends Dec 31, 2026')
    expect(items[1].querySelector('.of-title')?.textContent).toBe('0% for 12 months')
    expect(items[1].querySelector('.of-expires')).toBeNull()
  })

  it('hides on the sparse brief, and on a commercial page even when the brief has offers', () => {
    expect(render(<Offers site={sparseSite} />).container.innerHTML).toBe('')
    expect(render(<Offers site={commercialWithOffers} />).container.innerHTML).toBe('')
  })
})

describe('ServiceAreas', () => {
  it('lists every town as a chip with a pin, under a heading built from the data', () => {
    const { container } = render(<ServiceAreas site={acmeSite} />)
    const chips = [...container.querySelectorAll('.sa-chip')]
    expect(chips.map((c) => c.textContent)).toEqual(acmeSite.serviceAreas)
    for (const chip of chips) expect(chip.querySelector('svg.sa-pin')).not.toBeNull()
    const heading = container.querySelector('h2')?.textContent
    expect(heading).toBe(servingHeading(acmeSite))
    expect(heading).toContain(acmeSite.city)
    expect(heading).toContain(`${acmeSite.serviceAreas.length - 1} nearby towns`)
  })

  it('hides on the sparse brief and gives way to the audience strip on a commercial page', () => {
    expect(render(<ServiceAreas site={sparseSite} />).container.innerHTML).toBe('')
    expect(commercialSite.serviceAreas.length).toBeGreaterThan(0)
    expect(render(<ServiceAreas site={commercialSite} />).container.innerHTML).toBe('')
  })
})

describe('AudienceStrip', () => {
  it('shows three or four audience tiles on a commercial page', () => {
    const { container } = render(<AudienceStrip site={commercialSite} />)
    expect(container.querySelector('h2')?.textContent).toBe('Who we work with')
    const tiles = [...container.querySelectorAll('.ww-tile h3')].map((t) => t.textContent)
    expect(tiles).toEqual(commercialSite.audiences.map((a) => a.title))
    expect(tiles.length).toBeGreaterThanOrEqual(3)
    expect(tiles.length).toBeLessThanOrEqual(4)
  })

  it('hides on residential pages, including the jobsite register', () => {
    expect(render(<AudienceStrip site={acmeSite} />).container.innerHTML).toBe('')
    expect(render(<AudienceStrip site={forLean(acmeSite, 'commercial')} />).container.innerHTML).toBe('')
    expect(render(<AudienceStrip site={sparseSite} />).container.innerHTML).toBe('')
  })
})
