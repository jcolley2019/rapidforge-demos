import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import { siteContent } from '../brief/current'
import { variants } from './variants'

/**
 * Regression net: every registered variant must mount through its route
 * without throwing and must render the business name from the brief.
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
