import type { ComponentType } from 'react'
import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import { siteContent, siteContentFor } from '../brief/current'
import { SiteContext } from '../brief/site-context'
import { variants } from './variants'
import AerialPage from './aerial/AerialPage'
import HeritagePage from './heritage/HeritagePage'

const commercial = siteContentFor('acme-commercial')!
const FOLLOWING = Node.DOCUMENT_POSITION_FOLLOWING

function renderRoute(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

/**
 * The segment switch: the acme-commercial fixture renders every variant in
 * commercial mode, with a bid request in the nav, a subhead that names the
 * audience, no offers, and "Who we work with" where the towns would be.
 */
describe('variants on the commercial brief', () => {
  it('is actually a commercial brief', () => {
    expect(commercial.segment).toBe('commercial')
    expect(commercial.mode).toBe('commercial')
  })

  for (const variant of variants) {
    it(`renders /${variant.slug} (${variant.name}) in commercial mode`, () => {
      renderRoute(`/${variant.slug}?brief=acme-commercial`)
      const nav = document.querySelector('header')!
      const navCta = [...nav.querySelectorAll('a')].find((a) => a.textContent === 'Request a bid')
      expect(navCta).toBeDefined()
      expect(document.querySelector('.ub-book')?.textContent).toBe('Request a bid')

      const hero = document.querySelector('section[aria-label="Introduction"]')!
      expect(hero.textContent).toMatch(/general contractors, property managers and builders/)
      // The bid request leads; the call follows.
      const actions = [...hero.querySelectorAll('a[href]')]
      expect(actions[0].textContent).toBe('Request a bid')
      expect(actions[1].getAttribute('href')).toBe('tel:2085550142')

      expect(document.querySelector('.of')).toBeNull()
      expect(document.querySelector('#areas')).toBeNull()
      const who = document.querySelector('#who')
      expect(who).not.toBeNull()
      expect(who!.querySelector('h2')?.textContent).toBe('Who we work with')
      const tiles = who!.querySelectorAll('.ww-tile')
      expect(tiles.length).toBeGreaterThanOrEqual(3)
      expect(tiles.length).toBeLessThanOrEqual(4)
      // In the slot the service areas take on a residential page.
      expect(document.querySelector('#services')!.compareDocumentPosition(who!) & FOLLOWING).toBeTruthy()
    })
  }

  it('switches a mixed brief to commercial in modern-minimal only', () => {
    const mixed = { ...siteContent, segment: 'mixed' as const }
    const page = (Page: ComponentType) =>
      render(
        <MemoryRouter>
          <SiteContext.Provider value={mixed}>
            <Page />
          </SiteContext.Provider>
        </MemoryRouter>,
      )

    const minimal = page(AerialPage)
    expect(minimal.container.querySelector('#who')).not.toBeNull()
    expect(minimal.container.querySelector('.of')).toBeNull()
    expect(minimal.container.querySelector('.ub-book')?.textContent).toBe('Request a bid')
    // Every action reads as a bid request, not the brief's homeowner label.
    const heroLinks = [...minimal.container.querySelectorAll('section[aria-label="Introduction"] a[href]')]
    expect(heroLinks[0].textContent).toBe('Request a bid')
    minimal.unmount()

    const trust = page(HeritagePage)
    expect(trust.container.querySelector('#who')).toBeNull()
    expect(trust.container.querySelector('.of')).not.toBeNull()
    expect(trust.container.querySelector('.ub-book')?.textContent).toBe(siteContent.cta.label)
  })

  it('speaks in the jobsite register in modern-minimal on the residential brief, offers kept', () => {
    const minimal = renderRoute('/aerial')
    const hero = minimal.container.querySelector('section[aria-label="Introduction"]')!
    expect(hero.querySelector('h1')?.textContent).toBe(siteContent.registers.jobsite.headline)
    expect(hero.textContent).not.toMatch(/contractors|property managers/)
    expect(minimal.container.querySelector('.of')).not.toBeNull()
    expect(minimal.container.querySelector('#who')).toBeNull()
    minimal.unmount()

    const trust = renderRoute('/heritage')
    expect(trust.container.querySelector('h1')?.textContent).toBe(siteContent.registers.residential.headline)
  })
})
