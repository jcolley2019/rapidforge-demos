import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import { siteContentFor } from '../brief/current'
import { TRADE_PHOTOS } from '../brief/trade-photos'
import { variants } from './variants'

// The sparse fixture, picked at run time the way the picker's toggle picks one.
const QUERY = '?brief=sparse-electric'
const sparse = siteContentFor('sparse-electric')!

function renderRoute(path: string) {
  return render(
    <MemoryRouter initialEntries={[`${path}${QUERY}`]}>
      <App />
    </MemoryRouter>,
  )
}

/**
 * Every variant must survive a brief with no reviews, no hours, no phone,
 * no address and none of the RFD.PRESETS.5 fields, rendering nothing for
 * the missing data rather than the words "undefined" or "null", and every
 * new section must hide.
 */
describe('variants on the sparse brief', () => {
  it('is actually rendering the sparse fixture', () => {
    expect(sparse.name).toBe('Sparse Electric')
    expect(sparse.reviews).toEqual([])
    expect(sparse.hours).toBeNull()
    expect(sparse.phone).toBeNull()
    expect(sparse.address).toBeNull()
  })

  for (const variant of variants) {
    it(`renders /${variant.slug} (${variant.name}) without leaking null or undefined`, () => {
      expect(() => renderRoute(`/${variant.slug}`)).not.toThrow()
      const text = document.body.textContent ?? ''
      expect(text).toContain('Sparse Electric')
      expect(text).not.toMatch(/undefined/)
      expect(text).not.toMatch(/\bnull\b/)
      expect(document.querySelector('#reviews')).toBeNull()
      expect(document.querySelector('#contact')).toBeNull()
      // Every link is http(s), tel:, an in-page anchor, or a route — no email schemes.
      for (const a of document.querySelectorAll('a[href]')) {
        expect(a.getAttribute('href')).toMatch(/^(https?:|tel:|#|\/)/)
      }
    })

    it(`hides every new section on /${variant.slug} and falls back to the trust chips`, () => {
      renderRoute(`/${variant.slug}`)
      expect(document.querySelector('.ub')).toBeNull()
      expect(document.querySelector('.of')).toBeNull()
      expect(document.querySelector('#areas')).toBeNull()
      expect(document.querySelector('#who')).toBeNull()
      expect(document.querySelector('.br')).toBeNull()
      const chips = [...document.querySelectorAll('.ts-chip')].map((c) => c.textContent)
      expect(chips).toEqual(sparse.trust)
      // No crew photos: the hero falls back to the trade photo.
      const img = document.querySelector('section[aria-label="Introduction"] img')
      expect(TRADE_PHOTOS.electrical.hero).toContain(img?.getAttribute('src'))
    })
  }

  it('renders the picker without a phone, an address line, or a segment toggle', () => {
    renderRoute('/')
    const text = document.body.textContent ?? ''
    expect(text).toContain('Sparse Electric')
    expect(text).not.toMatch(/undefined|\bnull\b/)
    expect(document.querySelector('.pk-segment')).toBeNull()
  })
})
