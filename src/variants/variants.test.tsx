import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import { siteContent } from '../brief/current'
import { allTradePhotoUrls } from '../brief/trade-photos'
import { variants } from './variants'

const allowedHeroSrcs = new Set([...allTradePhotoUrls(), ...siteContent.photos])

/**
 * Regression net: every registered variant must mount through its route
 * without throwing, render the business name from the brief, show a real
 * photograph in its hero, and mount the trust strip right after it.
 */
describe('variants', () => {
  it('registers at least one variant', () => {
    expect(variants.length).toBeGreaterThan(0)
  })

  for (const variant of variants) {
    it(`renders /${variant.slug} (${variant.name}) with the business name`, () => {
      expect(() =>
        render(
          <MemoryRouter initialEntries={[`/${variant.slug}`]}>
            <App />
          </MemoryRouter>,
        ),
      ).not.toThrow()
      expect(document.body.textContent).toContain(siteContent.name)
      expect(document.title).toBe(`${siteContent.name} — ${variant.name}`)
    })

    it(`renders /${variant.slug} with a real photo in the hero and a trust strip under it`, () => {
      render(
        <MemoryRouter initialEntries={[`/${variant.slug}`]}>
          <App />
        </MemoryRouter>,
      )
      const hero = document.querySelector('section[aria-label="Introduction"]')
      expect(hero).not.toBeNull()
      const img = hero!.querySelector('img')
      expect(img).not.toBeNull()
      expect(allowedHeroSrcs.has(img!.getAttribute('src') ?? '')).toBe(true)

      const strip = document.querySelector('.ts')
      expect(strip).not.toBeNull()
      expect(hero!.compareDocumentPosition(strip!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
      expect(strip!.querySelector('a[href="tel:2085550142"]')).not.toBeNull()
    })
  }

  it('renders the picker with the business name on every card', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )
    const hits = document.body.textContent?.split(siteContent.name).length ?? 0
    expect(hits - 1).toBeGreaterThanOrEqual(variants.length)
  })
})
