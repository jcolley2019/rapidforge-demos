import { describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import { presetForVariant } from '../presets/presets'
import PickModal, { type PickTarget } from './PickModal'
import LikeThisButton from './LikeThisButton'
import { pickSlugOf } from '../pick/slug'
import { SiteContext } from '../brief/site-context'
import { siteContent } from '../brief/current'

const BUSINESS_ID = 'dff84968-ffa0-4188-84e6-079e1556e3e0'

const target: PickTarget = {
  slug: 'goodson',
  businessName: 'Goodson Plumbing Services',
  businessId: null,
  preset: presetForVariant('heritage', 'plumbing'),
  variantSlug: 'heritage',
}

const ok = () => vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }))

function type(label: RegExp, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } })
}

describe('PickModal', () => {
  it('requires an email or a phone before posting', async () => {
    const post = ok()
    render(<PickModal target={target} onClose={() => {}} post={post as unknown as typeof fetch} />)
    type(/your name/i, 'Rob')
    fireEvent.click(screen.getByRole('button', { name: /send my pick/i }))
    expect((await screen.findByRole('alert')).textContent).toMatch(/email or a phone/i)
    expect(post).not.toHaveBeenCalled()
  })

  it('posts the pick with the preset and business pre-filled, then shows the success state', async () => {
    const post = ok()
    render(<PickModal target={target} onClose={() => {}} post={post as unknown as typeof fetch} />)
    type(/your name/i, 'Rob')
    type(/phone/i, '(208) 629-4278')
    type(/anything you'd change/i, 'Bigger phone number.')
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /send my pick/i }))
    })
    await waitFor(() => expect(screen.getByRole('status').textContent).toContain("Got it — we'll be in touch."))
    expect(post).toHaveBeenCalledTimes(1)
    const [url, init] = post.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('/api/pick')
    expect(JSON.parse(init.body as string)).toMatchObject({
      slug: 'goodson',
      business_name: 'Goodson Plumbing Services',
      preset_id: 'clean-trust',
      preset_name: 'Clean Trust',
      variant_slug: 'heritage',
      name: 'Rob',
      email: '',
      phone: '(208) 629-4278',
      note: 'Bigger phone number.',
      website: '',
    })
    expect(JSON.parse(init.body as string).page_url).toMatch(/^http/)
    // A fixture has no business id, so the payload is the pre-RFD.PICKS.11 one.
    expect(JSON.parse(init.body as string)).not.toHaveProperty('businessId')
  })

  it('sends the business id with the variant and page URL when the build has one', async () => {
    const post = ok()
    render(<PickModal target={{ ...target, businessId: BUSINESS_ID }} onClose={() => {}} post={post as unknown as typeof fetch} />)
    type(/email/i, 'test@example.com')
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /send my pick/i }))
    })
    await waitFor(() => expect(screen.getByRole('status').textContent).toContain("Got it — we'll be in touch."))
    const body = JSON.parse((post.mock.calls[0] as unknown as [string, RequestInit])[1].body as string)
    expect(body).toMatchObject({ businessId: BUSINESS_ID, variant_slug: 'heritage', preset_id: 'clean-trust', email: 'test@example.com' })
    expect(body.page_url).toBe(window.location.href)
  })

  it('shows the server’s error and stays on the form when the post fails', async () => {
    const post = vi.fn(async () => new Response(JSON.stringify({ ok: false, error: 'Email is not configured' }), { status: 502 }))
    render(<PickModal target={target} onClose={() => {}} post={post as unknown as typeof fetch} />)
    type(/email/i, 'rob@example.com')
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /send my pick/i }))
    })
    expect((await screen.findByRole('alert')).textContent).toContain('Email is not configured')
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('keeps the honeypot out of sight and out of the tab order, but in the payload', async () => {
    const post = ok()
    render(<PickModal target={target} onClose={() => {}} post={post as unknown as typeof fetch} />)
    const hp = document.querySelector<HTMLInputElement>('input[name="website"]')!
    expect(hp.tabIndex).toBe(-1)
    expect(hp.closest('[aria-hidden="true"]')).not.toBeNull()
    expect(hp.closest('.pick-hp')).not.toBeNull()
    fireEvent.change(hp, { target: { value: 'http://spam.example' } })
    type(/email/i, 'bot@example.com')
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /send my pick/i }))
    })
    await waitFor(() => expect(post).toHaveBeenCalled())
    expect(JSON.parse((post.mock.calls[0] as unknown as [string, RequestInit])[1].body as string).website).toBe('http://spam.example')
  })

  it('closes on Escape and on the close button', () => {
    const onClose = vi.fn()
    render(<PickModal target={target} onClose={onClose} post={ok() as unknown as typeof fetch} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalledTimes(2)
  })
})

describe('I like this one, on the pages', () => {
  it('derives the lead slug from the brief name', () => {
    expect(pickSlugOf('lead-robgoodsonplumbing-com')).toBe('robgoodsonplumbing-com')
    expect(pickSlugOf('acme-plumbing')).toBe('acme-plumbing')
  })

  it('takes the business id from SiteContent into the floating button’s pick', async () => {
    const post = ok()
    vi.stubGlobal('fetch', post)
    try {
      render(
        <MemoryRouter initialEntries={['/cleanpro']}>
          <SiteContext.Provider value={{ ...siteContent, leadBusinessId: BUSINESS_ID }}>
            <LikeThisButton variantSlug="cleanpro" />
          </SiteContext.Provider>
        </MemoryRouter>,
      )
      fireEvent.click(screen.getByRole('button', { name: /i like this one/i }))
      type(/email/i, 'test@example.com')
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /send my pick/i }))
      })
      await waitFor(() => expect(post).toHaveBeenCalledTimes(1))
      const body = JSON.parse((post.mock.calls[0] as unknown as [string, RequestInit])[1].body as string)
      expect(body).toMatchObject({ businessId: BUSINESS_ID, variant_slug: 'cleanpro' })
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('floats on a variant page and opens the modal for that variant’s preset', () => {
    render(
      <MemoryRouter initialEntries={['/texas?brief=acme-hvac']}>
        <App />
      </MemoryRouter>,
    )
    const fab = screen.getByRole('button', { name: /i like this one/i })
    expect(fab.className).toContain('pick-fab')
    fireEvent.click(fab)
    const dialog = screen.getByRole('dialog')
    expect(dialog.textContent).toContain(`You like ${presetForVariant('texas', 'hvac').name}.`)
  })

  it('gives every picker card its own "I like this"', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )
    const likes = screen.getAllByRole('button', { name: /^i like this$/i })
    expect(likes).toHaveLength(5)
    // Not inside the card link: a button in an anchor is invalid and would open the page.
    for (const b of likes) expect(b.closest('a')).toBeNull()
    fireEvent.click(likes[1])
    expect(screen.getByRole('dialog').textContent).toContain(`You like ${presetForVariant('geospatial', 'plumbing').name}.`)
  })
})
