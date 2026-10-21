import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DesignBriefSchema } from './brief/design-brief'
import acme from './brief/fixtures/acme-plumbing.json'
import { toSiteContent } from './brief/site-content'
import CurrentSiteCard from './CurrentSiteCard'
import nosite from './test/fixtures/lead-nosite.json'

const withCurrentSite = toSiteContent(
  DesignBriefSchema.parse({
    ...acme,
    website_url: 'https://acme-plumbing.example/',
    current_site: {
      desktop_url: '/leads/acme/current-desktop.jpg',
      mobile_url: '/leads/acme/current-mobile.jpg',
      captured_at: '2026-10-06T20:00:00.000Z',
    },
  }),
)

const noWebsite = toSiteContent(DesignBriefSchema.parse({ ...nosite.audit.design_brief, photo_urls: [] }))

const LINE = 'Here are five ways to start — every one is a complete, working site built from your Google listing.'

describe('CurrentSiteCard', () => {
  it('shows both screenshots, the heading, the problem line and the hand-off to the grid', () => {
    render(
      <CurrentSiteCard
        current={withCurrentSite.currentSite}
        problem={withCurrentSite.problemLine}
        websiteUrl={withCurrentSite.websiteUrl}
        looks="five"
      />,
    )
    expect(screen.getByRole('heading', { name: 'Your site today' })).toBeTruthy()
    const shots = screen.getAllByRole('img').map((img) => img.getAttribute('src'))
    expect(shots).toEqual(['/leads/acme/current-desktop.jpg', '/leads/acme/current-mobile.jpg'])
    expect(screen.getByText(acme.current_site_problem)).toBeTruthy()
    expect(screen.getByText('Five ways forward')).toBeTruthy()
    expect(screen.queryByRole('heading', { name: "You don't have a website yet" })).toBeNull()
  })

  it('renders nothing when the brief has a website but no screenshots', () => {
    const site = toSiteContent(DesignBriefSchema.parse({ ...acme, website_url: 'https://acme-plumbing.example/' }))
    expect(site.currentSite).toBeNull()
    expect(site.websiteUrl).toBe('https://acme-plumbing.example/')
    const { container } = render(<CurrentSiteCard current={site.currentSite} problem={site.problemLine} websiteUrl={site.websiteUrl} looks="five" />)
    expect(container.innerHTML).toBe('')
  })

  it('says there is no website yet, in one line, with no frames and no problem line, when there is neither', () => {
    expect(noWebsite.currentSite).toBeNull()
    expect(noWebsite.websiteUrl).toBeNull()
    const { container } = render(
      <CurrentSiteCard current={noWebsite.currentSite} problem={noWebsite.problemLine} websiteUrl={noWebsite.websiteUrl} looks="five" />,
    )
    expect(screen.getByRole('heading', { name: "You don't have a website yet" })).toBeTruthy()
    expect(screen.getByText(LINE)).toBeTruthy()
    expect(container.querySelectorAll('img')).toHaveLength(0)
    expect(container.textContent).not.toContain(noWebsite.problemLine)
    expect(screen.queryByRole('heading', { name: 'Your site today' })).toBeNull()
  })

  it('counts six ways with the Scroll Story', () => {
    render(<CurrentSiteCard current={null} problem="" websiteUrl={null} looks="six" />)
    expect(screen.getByText(LINE.replace('five', 'six'))).toBeTruthy()
  })
})
