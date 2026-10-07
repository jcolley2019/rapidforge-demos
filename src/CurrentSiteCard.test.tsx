import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DesignBriefSchema } from './brief/design-brief'
import acme from './brief/fixtures/acme-plumbing.json'
import { toSiteContent } from './brief/site-content'
import CurrentSiteCard from './CurrentSiteCard'

const withCurrentSite = toSiteContent(
  DesignBriefSchema.parse({
    ...acme,
    current_site: {
      desktop_url: '/leads/acme/current-desktop.jpg',
      mobile_url: '/leads/acme/current-mobile.jpg',
      captured_at: '2026-10-06T20:00:00.000Z',
    },
  }),
)

describe('CurrentSiteCard', () => {
  it('shows both screenshots, the heading, the problem line and the hand-off to the grid', () => {
    render(<CurrentSiteCard current={withCurrentSite.currentSite} problem={withCurrentSite.problemLine} />)
    expect(screen.getByRole('heading', { name: 'Your site today' })).toBeTruthy()
    const shots = screen.getAllByRole('img').map((img) => img.getAttribute('src'))
    expect(shots).toEqual(['/leads/acme/current-desktop.jpg', '/leads/acme/current-mobile.jpg'])
    expect(screen.getByText(acme.current_site_problem)).toBeTruthy()
    expect(screen.getByText('Five ways forward')).toBeTruthy()
  })

  it('renders nothing when the brief has no current site', () => {
    const site = toSiteContent(DesignBriefSchema.parse(acme))
    expect(site.currentSite).toBeNull()
    const { container } = render(<CurrentSiteCard current={site.currentSite} problem={site.problemLine} />)
    expect(container.innerHTML).toBe('')
  })
})
