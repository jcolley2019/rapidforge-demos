import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { DesignBriefSchema } from './brief/design-brief'
import { SiteContext } from './brief/site-context'
import { toSiteContent, type SiteContent } from './brief/site-content'
import PickerPage from './PickerPage'
import nosite from './test/fixtures/lead-nosite.json'

/** The fictional no-website lead as a brief-only intake leaves it: no current_site, no website_url. */
const noWebsite = toSiteContent(DesignBriefSchema.parse({ ...nosite.audit.design_brief, photo_urls: [] }))

function picker(site: SiteContent) {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <SiteContext.Provider value={site}>
        <PickerPage />
      </SiteContext.Provider>
    </MemoryRouter>,
  )
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('picker, for a prospect with no website', () => {
  it('swaps "Your site today" for the no-website card, without frames or the problem line', () => {
    vi.stubEnv('VITE_SCROLL', '0')
    picker(noWebsite)
    expect(screen.getByRole('heading', { name: "You don't have a website yet" })).toBeTruthy()
    expect(screen.getByText('Here are five ways to start — every one is a complete, working site built from your Google listing.')).toBeTruthy()
    expect(screen.queryByRole('heading', { name: 'Your site today' })).toBeNull()
    expect(document.querySelector('.pk-now')).toBeNull()
    expect(document.querySelectorAll('.pk-none img')).toHaveLength(0)
    expect(document.body.textContent).not.toContain(noWebsite.problemLine)
  })

  it('says six ways when the build has the Scroll Story', () => {
    vi.stubEnv('VITE_SCROLL', '1')
    picker(noWebsite)
    expect(screen.getByText(/^Here are six ways to start — /)).toBeTruthy()
  })

  it('keeps "Your site today" when the brief has screenshots', () => {
    picker({
      ...noWebsite,
      websiteUrl: 'https://summit.example/',
      currentSite: { desktopUrl: '/leads/x/current-desktop.jpg', mobileUrl: '/leads/x/current-mobile.jpg', capturedAt: '2026-10-21T15:00:00Z' },
    })
    expect(screen.getByRole('heading', { name: 'Your site today' })).toBeTruthy()
    expect(document.querySelector('.pk-none')).toBeNull()
  })
})
