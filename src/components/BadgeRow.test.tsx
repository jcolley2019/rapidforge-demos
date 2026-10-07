import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import BadgeRow from './BadgeRow'
import { DesignBriefSchema } from '../brief/design-brief'
import { toSiteContent } from '../brief/site-content'
import acme from '../brief/fixtures/acme-plumbing.json'
import sparse from '../brief/fixtures/sparse-electric.json'

const acmeBrief = DesignBriefSchema.parse(acme)
const acmeSite = toSiteContent(acmeBrief)
/** The acme brief as it was before it had badges and stats. */
const acmeDefaults = toSiteContent({ ...acmeBrief, badges: [], stats: [] })
const sparseSite = toSiteContent(DesignBriefSchema.parse(sparse))

describe('BadgeRow', () => {
  it('shows each badge as a mark: BBB shield, license seal, award ribbon, rating with its count', () => {
    const { container } = render(<BadgeRow site={acmeSite} />)
    const marks = [...container.querySelectorAll('.br-mark')]
    expect(marks.map((m) => m.className)).toEqual([
      'br-mark br-mark-bbb',
      'br-mark br-mark-license',
      'br-mark br-mark-award',
      'br-mark br-mark-rating',
    ])
    for (const mark of marks) expect(mark.querySelector('svg.br-icon')).not.toBeNull()
    expect(marks[0].textContent).toBe('A+BBB')
    expect(marks[1].textContent).toContain('PLB-C-12345')
    const rating = marks[3]
    expect(rating.querySelector('[role="img"]')?.getAttribute('aria-label')).toBe('4.9 out of 5 stars')
    expect(rating.textContent).toContain('312 Google reviews')
    expect(container.querySelector('.ts')).toBeNull()
  })

  it('shows each stat as a big-number tile, label then value, with words set apart from numbers', () => {
    const { container } = render(<BadgeRow site={acmeSite} />)
    const tiles = [...container.querySelectorAll('.br-stat')].map((t) => [
      t.querySelector('dt')?.textContent,
      t.querySelector('dd')?.textContent,
      t.classList.contains('br-stat-word'),
    ])
    expect(tiles).toEqual([
      ['years in business', '22', false],
      ['jobs completed', '9,000+', false],
      ['and insured', 'Licensed', true],
    ])
  })

  it('lets the stars announce the rating once', () => {
    const { container } = render(<BadgeRow site={acmeSite} />)
    const rating = container.querySelector('.br-mark-rating')!
    expect(rating.querySelector('.br-mark-big > [aria-hidden="true"]')?.textContent).toBe('4.9')
    expect(rating.querySelectorAll('[role="img"]')).toHaveLength(1)
  })

  it('renders one half on request and skips kinds shown elsewhere', () => {
    const stats = render(<BadgeRow site={acmeSite} part="stats" />).container
    expect(stats.querySelectorAll('.br-stat')).toHaveLength(3)
    expect(stats.querySelector('.br-mark')).toBeNull()
    const marks = render(<BadgeRow site={acmeSite} part="marks" skip={['rating']} />).container
    expect(marks.querySelector('.br-stat')).toBeNull()
    expect([...marks.querySelectorAll('.br-mark')].map((m) => m.className)).not.toContain('br-mark br-mark-rating')
    expect(marks.querySelectorAll('.br-mark')).toHaveLength(3)
  })

  it('falls back to the chips, the average rating, and a phone link without badges or stats', () => {
    const { container } = render(<BadgeRow site={acmeDefaults} />)
    expect(container.querySelector('.br')).toBeNull()
    const chips = [...container.querySelectorAll('.ts-chip')].map((c) => c.textContent)
    expect(chips).toEqual(acmeDefaults.trust)
    expect(container.querySelector('.ts-rating')?.textContent).toContain('4.7 / 5')
    const call = container.querySelector('a.ts-call')
    expect(call?.getAttribute('href')).toBe('tel:2085550142')
    expect(call?.textContent).toBe('Call (208) 555-0142')
  })

  it('hides the marks on the sparse brief, keeping only the default chips', () => {
    const { container } = render(<BadgeRow site={sparseSite} />)
    expect(container.querySelector('.br')).toBeNull()
    expect(container.querySelectorAll('.ts-chip').length).toBe(sparseSite.trust.length)
    expect(container.querySelector('.ts-rating')).toBeNull()
    expect(container.querySelector('.ts-call')).toBeNull()
    expect(render(<BadgeRow site={sparseSite} part="stats" />).container.innerHTML).toBe('')
  })

  it('renders nothing at all when there are no chips, reviews, or phone', () => {
    const { container } = render(<BadgeRow site={{ ...sparseSite, trust: [] }} />)
    expect(container.innerHTML).toBe('')
  })
})
