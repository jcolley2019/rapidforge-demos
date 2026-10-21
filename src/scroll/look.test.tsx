import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import { siteContentFor } from '../brief/current'
import { swatchesOf } from '../presets/presets'
import { previewFor } from '../presets/previews'
import { variants } from '../variants/variants'
import { SCROLL_LOOK, SCROLL_SLUG, scrollCard, scrollEnabled } from './look'

function picker() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>,
  )
}

afterEach(() => {
  vi.unstubAllEnvs()
})

const BUILD_CARD = {
  description: 'Drawn like a cross-section on dark soil: a blue water line bores under the yard as you scroll, past your reviews, to one big Call button.',
  swatches: ['#13110E', '#EFE9DD', '#4DA3FF', '#A79F90'],
}

/** The swatch colours as the DOM reports them: rgb(), from the hex in the card. */
function rgb(hex: string): string {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
  return `rgb(${r}, ${g}, ${b})`
}

describe('Scroll Story card', () => {
  it('is off unless the build was made with VITE_SCROLL=1', () => {
    expect(scrollEnabled({})).toBe(false)
    expect(scrollEnabled({ VITE_SCROLL: '0' })).toBe(false)
    expect(scrollEnabled({ VITE_SCROLL: '1' })).toBe(true)
  })

  it('shows nothing of it with the flag off: five cards, five looks', () => {
    vi.stubEnv('VITE_SCROLL', '0')
    picker()
    expect(document.querySelectorAll('a.pk-card')).toHaveLength(variants.length)
    expect(document.querySelector('h1')?.textContent).toContain('five looks')
    expect(document.body.textContent).not.toContain(SCROLL_LOOK.name)
  })

  it('adds a sixth card, last, linking to /scroll with its previews, with the flag on', () => {
    vi.stubEnv('VITE_SCROLL', '1')
    picker()
    const site = siteContentFor('acme-plumbing')!
    const cards = [...document.querySelectorAll('a.pk-card')]
    expect(cards).toHaveLength(variants.length + 1)
    expect(document.querySelector('h1')?.textContent).toBe(`${site.name} — six looks, pick one`)
    const card = cards[cards.length - 1]
    expect(card.getAttribute('href')).toBe('/scroll')
    const { desktop, mobile } = previewFor(SCROLL_SLUG, site.vertical)
    expect(desktop).toBe('/previews/plumbing/scroll.jpg')
    expect([...card.querySelectorAll('img')].map((img) => img.getAttribute('src'))).toEqual([desktop, mobile])
    expect(card.querySelector('.pk-name')?.textContent).toBe('Scroll Story')
    expect(card.querySelector('.pk-desc')?.textContent).toBe(
      'A cinematic page that moves as you scroll: your photos, your story, one screen at a time.',
    )
    expect(card.querySelectorAll('.pk-swatch')).toHaveLength(4)
  })

  it('shows the build card.json blurb and swatches when the deploy passed it in as VITE_SCROLL_CARD', () => {
    vi.stubEnv('VITE_SCROLL', '1')
    vi.stubEnv('VITE_SCROLL_CARD', JSON.stringify(BUILD_CARD))
    picker()
    const cards = [...document.querySelectorAll('a.pk-card')]
    const card = cards[cards.length - 1]
    expect(card.getAttribute('href')).toBe('/scroll')
    expect(card.querySelector('.pk-name')?.textContent).toBe('Scroll Story')
    expect(card.querySelector('.pk-desc')?.textContent).toBe(BUILD_CARD.description)
    const shown = [...card.querySelectorAll<HTMLElement>('.pk-swatch')].map((swatch) => swatch.style.backgroundColor)
    expect(shown).toEqual(BUILD_CARD.swatches.map(rgb))
    // Only the Scroll Story card changes; the five React looks keep their own.
    const blurbs = cards.map((c) => c.querySelector('.pk-desc')?.textContent)
    expect(blurbs.filter((blurb) => blurb === BUILD_CARD.description)).toHaveLength(1)
  })

  it('has its own "I like this" that opens the pick modal for variant scroll / preset scroll-story', async () => {
    vi.stubEnv('VITE_SCROLL', '1')
    const post = vi.fn(async () => new Response(JSON.stringify({ saved: true, emailed: false }), { status: 200 }))
    vi.stubGlobal('fetch', post)
    picker()
    const likes = [...document.querySelectorAll('button.pk-like')]
    expect(likes).toHaveLength(variants.length + 1)
    fireEvent.click(likes[likes.length - 1])
    expect(document.querySelector('.pick-title')?.textContent).toBe('You like Scroll Story.')
    fireEvent.change(document.querySelector('input[name="email"]')!, { target: { value: 'owner@example.com' } })
    fireEvent.submit(document.querySelector('form.pick-form')!)
    await vi.waitFor(() => expect(post).toHaveBeenCalledTimes(1))
    const body = JSON.parse((post.mock.calls[0] as unknown as [string, RequestInit])[1].body as string)
    expect(body.variant_slug).toBe('scroll')
    expect(body.preset_id).toBe('scroll-story')
    expect(body.preset_name).toBe('Scroll Story')
    expect(SCROLL_SLUG).toBe('scroll')
    vi.unstubAllGlobals()
  })
})

describe('Scroll Story card content', () => {
  const DEFAULTS = { description: SCROLL_LOOK.description, swatches: swatchesOf(SCROLL_LOOK) }

  it('is the build card when VITE_SCROLL_CARD parses', () => {
    expect(scrollCard({ VITE_SCROLL_CARD: JSON.stringify(BUILD_CARD) })).toEqual(BUILD_CARD)
  })

  it('falls back to the default blurb and swatches without a card', () => {
    expect(DEFAULTS.swatches).toHaveLength(4)
    expect(scrollCard({})).toEqual(DEFAULTS)
    expect(scrollCard({ VITE_SCROLL_CARD: '' })).toEqual(DEFAULTS)
  })

  it.each([
    ['not JSON', '{nope'],
    ['no description', JSON.stringify({ swatches: BUILD_CARD.swatches })],
    ['a 141-character description', JSON.stringify({ ...BUILD_CARD, description: 'x'.repeat(141) })],
    ['three swatches', JSON.stringify({ ...BUILD_CARD, swatches: BUILD_CARD.swatches.slice(0, 3) })],
    ['a swatch that is not hex', JSON.stringify({ ...BUILD_CARD, swatches: ['navy', '#EFE9DD', '#4DA3FF', '#A79F90'] })],
  ])('falls back to the defaults on %s', (_name, value) => {
    expect(scrollCard({ VITE_SCROLL_CARD: value })).toEqual(DEFAULTS)
  })
})
