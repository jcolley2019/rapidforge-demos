import type { ComponentType } from 'react'
import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { DesignBriefSchema } from '../brief/design-brief'
import { SiteContext } from '../brief/site-context'
import { toSiteContent } from '../brief/site-content'
import { TRADE_PHOTOS } from '../brief/trade-photos'
import nosite from '../test/fixtures/lead-nosite.json'
import AerialPage from './aerial/AerialPage'
import CleanProPage from './cleanpro/CleanProPage'
import GeospatialPage from './geospatial/GeospatialPage'
import HeritagePage from './heritage/HeritagePage'
import TexasPage from './texas/TexasPage'
import { variants } from './variants'

const PAGES: Record<string, ComponentType> = {
  heritage: HeritagePage,
  geospatial: GeospatialPage,
  cleanpro: CleanProPage,
  texas: TexasPage,
  aerial: AerialPage,
}

/** The fictional no-website lead as a brief-only intake writes it: stock photos, no website_url, no current_site. */
const site = toSiteContent(DesignBriefSchema.parse({ ...nosite.audit.design_brief, photo_urls: TRADE_PHOTOS.plumbing.hero }))

/**
 * RFD.INTAKE.16: no variant reads website_url or current_site, so a lead
 * with neither renders like any other: its own name and phone, stock
 * photos, and no link or line about a current site.
 */
describe('variants for a lead with no website', () => {
  it('covers every variant', () => {
    expect(Object.keys(PAGES).sort()).toEqual(variants.map((v) => v.slug).sort())
  })

  for (const variant of variants) {
    it(`renders /${variant.slug} with the lead's name and phone, stock photos, and nothing about a current site`, () => {
      const Page = PAGES[variant.slug]
      render(
        <MemoryRouter initialEntries={[`/${variant.slug}`]}>
          <SiteContext.Provider value={site}>
            <Page />
          </SiteContext.Provider>
        </MemoryRouter>,
      )
      const text = document.body.textContent ?? ''
      expect(text).toContain('Summit and Sage')
      expect(text).toContain('(555) 010-0142')
      expect(text).not.toMatch(/current site|your site today|old site|undefined|\bnull\b/i)
      const hrefs = [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href') ?? '')
      expect(hrefs.some((href) => href === 'tel:5550100142')).toBe(true)
      expect(hrefs.filter((href) => /^https?:/.test(href) && !href.includes('google.com/maps'))).toEqual([])
      const photos = [...document.querySelectorAll('img')].map((img) => img.getAttribute('src') ?? '')
      expect(photos.some((src) => src.startsWith('https://images.unsplash.com/'))).toBe(true)
      expect(photos.filter((src) => src.includes('/leads/'))).toEqual([])
    })
  }
})
