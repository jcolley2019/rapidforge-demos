import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import TrustStrip from './TrustStrip'
import { DesignBriefSchema } from '../brief/design-brief'
import { toSiteContent } from '../brief/site-content'
import acme from '../brief/fixtures/acme-plumbing.json'
import sparse from '../brief/fixtures/sparse-electric.json'

const acmeSite = toSiteContent(DesignBriefSchema.parse(acme))
const sparseSite = toSiteContent(DesignBriefSchema.parse(sparse))

describe('TrustStrip', () => {
  it('renders the chips, the average rating, and a phone link', () => {
    const { container } = render(<TrustStrip site={acmeSite} />)
    const chips = [...container.querySelectorAll('.ts-chip')].map((c) => c.textContent)
    expect(chips).toEqual(acmeSite.trust)
    expect(container.querySelector('.ts-rating')?.textContent).toContain('4.7 / 5')
    const call = container.querySelector('a.ts-call')
    expect(call?.getAttribute('href')).toBe('tel:2085550142')
    expect(call?.textContent).toBe('Call (208) 555-0142')
  })

  it('hides the rating and phone link when the brief has neither', () => {
    const { container } = render(<TrustStrip site={sparseSite} />)
    expect(container.querySelectorAll('.ts-chip').length).toBe(sparseSite.trust.length)
    expect(container.querySelector('.ts-rating')).toBeNull()
    expect(container.querySelector('.ts-call')).toBeNull()
  })

  it('renders nothing at all when there are no chips, reviews, or phone', () => {
    const { container } = render(<TrustStrip site={{ ...sparseSite, trust: [] }} />)
    expect(container.innerHTML).toBe('')
  })
})
