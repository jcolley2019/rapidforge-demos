import { describe, expect, it } from 'vitest'
import { fireEvent, render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import { siteContent } from '../brief/current'
import { allTradePhotoUrls } from '../brief/trade-photos'
import { presetForVariant } from '../presets/presets'
import { previewFor } from '../presets/previews'
import { variants } from './variants'
import { heroPhotoFor, tilePhotosFor } from './heroPhoto'

const allowedHeroSrcs = new Set([...allTradePhotoUrls(), ...siteContent.photos, ...siteContent.crewPhotos])

function renderRoute(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

const FOLLOWING = Node.DOCUMENT_POSITION_FOLLOWING

/**
 * Regression net: every registered variant must mount through its route
 * without throwing, render the business name from the brief, lead with the
 * brief's crew photo, and put its sections in the agreed order.
 */
describe('variants', () => {
  it('registers at least one variant', () => {
    expect(variants.length).toBeGreaterThan(0)
  })

  for (const variant of variants) {
    it(`renders /${variant.slug} (${variant.name}) with the business name`, () => {
      expect(() => renderRoute(`/${variant.slug}`)).not.toThrow()
      expect(document.body.textContent).toContain(siteContent.name)
      expect(document.title).toBe(`${siteContent.name} — ${variant.name}`)
    })

    it(`renders /${variant.slug} with a crew photo in the hero and the badge row with it`, () => {
      renderRoute(`/${variant.slug}`)
      const hero = document.querySelector('section[aria-label="Introduction"]')
      expect(hero).not.toBeNull()
      const img = hero!.querySelector('img')
      expect(img).not.toBeNull()
      expect(allowedHeroSrcs.has(img!.getAttribute('src') ?? '')).toBe(true)
      // The brief has crew photos, so variant i leads with crew[i % crew.length].
      const i = variants.indexOf(variant)
      expect(img!.getAttribute('src')).toBe(siteContent.crewPhotos[i % siteContent.crewPhotos.length])

      // The badge row sits inside the hero or after it, never before.
      const rows = [...document.querySelectorAll('.br')]
      expect(rows.length).toBeGreaterThan(0)
      for (const row of rows) expect(hero!.contains(row) || Boolean(hero!.compareDocumentPosition(row) & FOLLOWING)).toBe(true)
      expect(document.querySelectorAll('.br-mark').length).toBeGreaterThan(0)
      expect(document.querySelectorAll('.br-stat').length).toBeGreaterThan(0)
    })

    it(`renders /${variant.slug} with the utility bar, offers under the hero, and towns after services`, () => {
      renderRoute(`/${variant.slug}`)
      const bar = document.querySelector('.ub')
      const nav = document.querySelector('header')
      expect(bar).not.toBeNull()
      expect(bar!.compareDocumentPosition(nav!) & FOLLOWING).toBeTruthy()
      expect(bar!.querySelector('a[href="tel:2085550142"]')).not.toBeNull()

      const hero = document.querySelector('section[aria-label="Introduction"]')!
      expect(hero.nextElementSibling?.classList.contains('of')).toBe(true)
      expect(document.querySelectorAll('.of-coupon')).toHaveLength(1)

      const services = document.querySelector('#services')!
      const areas = document.querySelector('#areas')
      expect(areas).not.toBeNull()
      expect(services.compareDocumentPosition(areas!) & FOLLOWING).toBeTruthy()
      expect(areas!.querySelectorAll('.sa-chip')).toHaveLength(siteContent.serviceAreas.length)
      expect(document.querySelector('#who')).toBeNull()
    })

    it(`renders /${variant.slug} call-first, with the hours note by the hours and the services heading shown on load`, () => {
      renderRoute(`/${variant.slug}`)
      const hero = document.querySelector('section[aria-label="Introduction"]')!
      const actions = [...hero.querySelectorAll('a[href]')]
      expect(actions[0].getAttribute('href')).toBe('tel:2085550142')
      expect(actions[1].textContent).toBe(siteContent.cta.label)

      expect(document.querySelector('#contact')?.textContent).toContain(siteContent.hoursNote)
      expect(document.querySelector('footer')?.textContent).toContain(siteContent.hoursNote)

      const heading = document.querySelector('#services h2')!
      expect(heading.closest('.rv')).toBeNull()
    })
  }

  it('leads every variant with a crew photo when the brief has them, else a trade photo', () => {
    const photos = ['a', 'b', 'c', 'd', 'e'].map((k) => `https://img.example/${k}.jpg`)
    const crew = ['https://img.example/crew-1.jpg', 'https://img.example/crew-2.jpg']
    variants.forEach((v, i) => {
      expect(heroPhotoFor(v.slug, photos, crew)).toBe(crew[i % crew.length])
      expect(heroPhotoFor(v.slug, photos)).toBe(photos[i % photos.length])
    })
    // Crew photos lead even when the brief has no photos of its own.
    const aerial = variants.findIndex((v) => v.slug === 'aerial')
    expect(heroPhotoFor('aerial', [], crew)).toBe(crew[aerial % crew.length])
    expect(heroPhotoFor('aerial', [], [])).toBeUndefined()
  })

  it('gives every variant a different trade hero when the brief has at least five', () => {
    const photos = ['a', 'b', 'c', 'd', 'e'].map((k) => `https://img.example/${k}.jpg`)
    const srcs = variants.map((v) => heroPhotoFor(v.slug, photos))
    expect(new Set(srcs).size).toBe(variants.length)
    expect(heroPhotoFor('aerial', ['only'])).toBe('only')
    expect(heroPhotoFor('aerial', [])).toBeUndefined()
  })

  it('keeps each variant hero out of its own service tiles', () => {
    const photos = ['a', 'b', 'c'].map((k) => `https://img.example/${k}.jpg`)
    const detail = ['https://img.example/d1.jpg', 'https://img.example/d2.jpg']
    for (const v of variants) {
      const tiles = tilePhotosFor(v.slug, photos, detail)
      expect(tiles).not.toContain(heroPhotoFor(v.slug, photos))
      expect(tiles.slice(0, detail.length)).toEqual(detail)
      expect(new Set(tiles).size).toBe(tiles.length)
    }
  })

  it('renders the picker headline and one screenshot card per variant, described by its preset', () => {
    renderRoute('/')
    expect(document.querySelector('h1')?.textContent).toBe(`${siteContent.name} — five looks, pick one`)
    const cards = [...document.querySelectorAll('a.pk-card')]
    expect(cards).toHaveLength(variants.length)
    variants.forEach((variant, i) => {
      const { desktop, mobile } = previewFor(variant.slug)
      const preset = presetForVariant(variant.slug)
      expect(cards[i].getAttribute('href')).toBe(`/${variant.slug}`)
      const srcs = [...cards[i].querySelectorAll('img')].map((img) => img.getAttribute('src'))
      expect(srcs).toEqual([desktop, mobile])
      expect(cards[i].textContent).toContain(preset.name)
      expect(cards[i].querySelector('.pk-desc')?.textContent).toBe(preset.description)
      expect(cards[i].querySelectorAll('.pk-swatch')).toHaveLength(4)
    })
  })

  it('swaps the picker between the residential and commercial fixture at run time', () => {
    renderRoute('/')
    const [residential, commercial] = [...document.querySelectorAll('.pk-segment button')]
    expect(residential.textContent).toBe('Residential')
    expect(commercial.textContent).toBe('Commercial')
    expect(residential.getAttribute('aria-pressed')).toBe('true')
    expect(commercial.getAttribute('aria-pressed')).toBe('false')

    fireEvent.click(commercial)
    expect(commercial.getAttribute('aria-pressed')).toBe('true')
    const cards = [...document.querySelectorAll('a.pk-card')]
    variants.forEach((variant, i) => {
      expect(cards[i].getAttribute('href')).toBe(`/${variant.slug}?brief=acme-commercial`)
    })

    fireEvent.click(residential)
    expect(document.querySelector('a.pk-card')?.getAttribute('href')).toBe(`/${variants[0].slug}`)
  })
})
