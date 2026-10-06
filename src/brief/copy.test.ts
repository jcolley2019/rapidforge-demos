import { describe, expect, it } from 'vitest'
import { DesignBriefSchema } from './design-brief'
import { copyFamilyFor, ctaHeadlineFor, pickCopy, templatesFor, type CopyContext, type CopyFamily } from './copy'
import { toSiteContent } from './site-content'
import acme from './fixtures/acme-plumbing.json'
import sparse from './fixtures/sparse-electric.json'

const acmeBrief = DesignBriefSchema.parse(acme)
const sparseBrief = DesignBriefSchema.parse(sparse)
const FAMILIES: CopyFamily[] = ['plumbing', 'hvac', 'electrical', 'generic']

const words = (s: string) => s.trim().split(/\s+/).length

const contexts: CopyContext[] = [
  { name: 'Acme Plumbing', shortName: 'Acme Plumbing', city: 'Nampa', verticalLabel: 'Plumbing' },
  { name: 'Sparse Electric', shortName: 'Sparse Electric', city: null, verticalLabel: 'Electrical' },
  { name: 'Treasure Valley Heating & Air', shortName: 'Treasure Valley', city: 'Boise', verticalLabel: 'Roofing' },
]

describe('copy house rules', () => {
  it('gives both fixtures a headline of eight words or fewer', () => {
    for (const site of [toSiteContent(acmeBrief), toSiteContent(sparseBrief)]) {
      expect(words(site.headline), site.headline).toBeLessThanOrEqual(8)
    }
  })

  it('keeps every template headline at eight words or fewer for a one-word city or no city', () => {
    for (const family of FAMILIES) {
      for (const t of templatesFor(family)) {
        for (const ctx of contexts) {
          const h = t.headline(ctx)
          expect(words(h), `${family}: ${h}`).toBeLessThanOrEqual(8)
        }
      }
    }
  })

  it('uses no italics or dashes anywhere in the copy', () => {
    const banned = /[—–]|<em>|\*/
    for (const family of FAMILIES) {
      for (const t of templatesFor(family)) {
        for (const ctx of contexts) {
          expect(t.headline(ctx)).not.toMatch(banned)
          expect(t.subhead(ctx)).not.toMatch(banned)
        }
      }
      expect(ctaHeadlineFor(family, contexts[0])).not.toMatch(banned)
    }
  })

  it('names the city, a response promise, and a trust fact in every subhead', () => {
    for (const family of FAMILIES) {
      for (const t of templatesFor(family)) {
        const s = t.subhead(contexts[0])
        expect(s, s).toContain('Nampa')
        expect(s, s).toMatch(/same-day|same day|on the way/i)
        expect(s, s).toMatch(/licensed|insured|upfront|approve/i)
      }
    }
  })

  it('picks the dependable plumbing template for the acme fixture, deterministically', () => {
    const ctx = contexts[0]
    const a = pickCopy(acmeBrief, ctx)
    const b = pickCopy(acmeBrief, ctx)
    expect(a).toEqual(b)
    expect(a.headline).toBe('Nampa plumbers who show up on time.')
    expect(copyFamilyFor('electrician')).toBe('electrical')
  })
})
