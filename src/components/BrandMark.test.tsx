import type { ComponentType } from 'react'
import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { DesignBriefSchema } from '../brief/design-brief'
import acme from '../brief/fixtures/acme-plumbing.json'
import { SiteContext } from '../brief/site-context'
import { toSiteContent } from '../brief/site-content'
import WsNav from '../variants/aerial/WsNav'
import ClNav from '../variants/cleanpro/ClNav'
import DhNav from '../variants/geospatial/DhNav'
import PpNav from '../variants/heritage/PpNav'
import IsNav from '../variants/texas/IsNav'

const NAVS: Array<[name: string, Nav: ComponentType]> = [
  ['heritage', PpNav],
  ['geospatial', DhNav],
  ['cleanpro', ClNav],
  ['texas', IsNav],
  ['aerial', WsNav],
]

const plain = toSiteContent(DesignBriefSchema.parse(acme))
const withLogo = toSiteContent(DesignBriefSchema.parse({ ...acme, logo_url: '/leads/acme/logo.png' }))

function brandOf(site: typeof plain, Nav: ComponentType): Element {
  render(
    <SiteContext.Provider value={site}>
      <Nav />
    </SiteContext.Provider>,
  )
  const brand = document.querySelector('header a[href="#top"]')
  expect(brand).not.toBeNull()
  return brand!
}

describe('variant header wordmark', () => {
  for (const [name, Nav] of NAVS) {
    it(`${name}: shows the logo, alt = business name, in place of the text when logo_url is set`, () => {
      const brand = brandOf(withLogo, Nav)
      const img = brand.querySelector('img')
      expect(img?.getAttribute('src')).toBe('/leads/acme/logo.png')
      expect(img?.getAttribute('alt')).toBe('Acme Plumbing')
      expect(brand.textContent).toBe('')
    })

    it(`${name}: keeps the text wordmark when logo_url is null`, () => {
      const brand = brandOf(plain, Nav)
      expect(brand.querySelector('img')).toBeNull()
      expect(brand.textContent).toBe('Acme Plumbing')
    })
  }
})
