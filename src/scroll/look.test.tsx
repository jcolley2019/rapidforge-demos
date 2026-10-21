import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import { siteContentFor } from '../brief/current'
import { previewFor } from '../presets/previews'
import { variants } from '../variants/variants'
import { SCROLL_LOOK, SCROLL_SLUG, scrollEnabled } from './look'

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
