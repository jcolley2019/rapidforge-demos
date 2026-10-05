import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import { content } from '../content/content'
import { variants } from './variants'

/**
 * Regression net: every registered variant must mount through its route
 * without throwing and must render the company name from the content seam.
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
      expect(document.body.textContent).toContain(content.name)
    })
  }
})
