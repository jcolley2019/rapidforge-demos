import { describe, expect, it } from 'vitest'
import { DesignBriefSchema } from './design-brief'
import acmePlumbing from './fixtures/acme-plumbing.json'

describe('DesignBriefSchema', () => {
  it('parses the acme-plumbing fixture', () => {
    const brief = DesignBriefSchema.parse(acmePlumbing)
    expect(brief.business_name).toBe('Acme Plumbing')
    expect(brief.services).toHaveLength(6)
    expect(brief.review_quotes).toHaveLength(3)
    expect(brief.hours).toHaveLength(7)
    expect(brief.primary_cta.kind).toBe('booking')
    expect(brief.photo_urls).toEqual([])
  })

  it('rejects fewer than 3 tone_descriptors', () => {
    const result = DesignBriefSchema.safeParse({
      ...acmePlumbing,
      tone_descriptors: ['dependable', 'local'],
    })
    expect(result.success).toBe(false)
  })

  it('rejects an unknown primary_cta.kind', () => {
    const result = DesignBriefSchema.safeParse({
      ...acmePlumbing,
      primary_cta: { ...acmePlumbing.primary_cta, kind: 'email' },
    })
    expect(result.success).toBe(false)
  })
})
