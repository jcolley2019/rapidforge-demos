import { describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// Swap the current brief for the sparse fixture before any page module loads.
vi.mock('../brief/current', async () => {
  const { DesignBriefSchema } = await import('../brief/design-brief')
  const { toSiteContent } = await import('../brief/site-content')
  const sparse = (await import('../brief/fixtures/sparse-electric.json')).default
  return {
    briefName: 'sparse-electric',
    siteContent: toSiteContent(DesignBriefSchema.parse(sparse)),
  }
})

import App from '../App'
import { siteContent } from '../brief/current'
import { variants } from './variants'

/**
 * Every variant must survive a brief with no reviews, no hours, no phone,
 * and no address — rendering nothing for the missing data rather than the
 * words "undefined" or "null".
 */
describe('variants on the sparse brief', () => {
  it('is actually rendering the sparse fixture', () => {
    expect(siteContent.name).toBe('Sparse Electric')
    expect(siteContent.reviews).toEqual([])
    expect(siteContent.hours).toBeNull()
    expect(siteContent.phone).toBeNull()
    expect(siteContent.address).toBeNull()
  })

  for (const variant of variants) {
    it(`renders /${variant.slug} (${variant.name}) without leaking null or undefined`, () => {
      expect(() =>
        render(
          <MemoryRouter initialEntries={[`/${variant.slug}`]}>
            <App />
          </MemoryRouter>,
        ),
      ).not.toThrow()
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
  }

  it('renders the picker without a phone or address line', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )
    const text = document.body.textContent ?? ''
    expect(text).toContain('Sparse Electric')
    expect(text).not.toMatch(/undefined|\bnull\b/)
  })
})
