import { describe, expect, it } from 'vitest'
import { DesignBriefSchema } from './design-brief'
import {
  audiencesFor,
  commercialCopyFor,
  copyFamilyFor,
  ctaHeadlineFor,
  jobsiteCopyFor,
  pickCopy,
  templatesFor,
  type CopyContext,
  type CopyFamily,
} from './copy'
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

  it('keeps the commercial and jobsite registers to the same house rules', () => {
    const banned = /[—–]|<em>|\*/
    for (const family of FAMILIES) {
      for (const ctx of contexts) {
        const registers = [
          commercialCopyFor(family, 'commercial', ctx),
          commercialCopyFor(family, 'new_construction', ctx),
          jobsiteCopyFor(family, ctx),
        ]
        for (const r of registers) {
          expect(words(r.headline), r.headline).toBeLessThanOrEqual(8)
          for (const line of [r.headline, r.subhead, r.ctaHeadline]) expect(line).not.toMatch(banned)
        }
      }
      const [commercial, builders, jobsite] = [
        commercialCopyFor(family, 'commercial', contexts[0]),
        commercialCopyFor(family, 'new_construction', contexts[0]),
        jobsiteCopyFor(family, contexts[0]),
      ]
      for (const r of [commercial, builders, jobsite]) {
        expect(r.subhead, r.subhead).toContain('Nampa')
        expect(r.subhead, r.subhead).toMatch(/licensed/i)
      }
      // Commercial copy names its audience and promises the schedule.
      expect(commercial.subhead).toMatch(/general contractors, property managers and builders/)
      expect(builders.subhead).toMatch(/builders, developers and general contractors/)
      for (const r of [commercial, builders]) expect(r.subhead).toMatch(/schedule/)
      // The jobsite register keeps the same-day promise and claims no clients.
      expect(jobsite.subhead).toMatch(/same-day/)
      expect(jobsite.subhead).not.toMatch(/contractors|property managers|developers/)
    }
  })

  it('gives three or four audience tiles with no place names', () => {
    for (const segment of ['commercial', 'new_construction'] as const) {
      const tiles = audiencesFor(segment, contexts[0])
      expect(tiles.length).toBeGreaterThanOrEqual(3)
      expect(tiles.length).toBeLessThanOrEqual(4)
      for (const t of tiles) expect(`${t.title} ${t.blurb}`).not.toMatch(/Nampa|Boise|Caldwell/)
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

  it("gives the leads app's air_conditioning vertical the HVAC copy, not the generic", () => {
    expect(copyFamilyFor('air_conditioning')).toBe('hvac')
    const ctx = contexts[0]
    const brief = { ...acmeBrief, vertical: 'air_conditioning' }
    expect(pickCopy(brief, ctx)).toEqual(pickCopy({ ...acmeBrief, vertical: 'hvac' }, ctx))
    expect(pickCopy(brief, ctx)).not.toEqual(pickCopy({ ...acmeBrief, vertical: 'unmapped_trade' }, ctx))
    expect(ctaHeadlineFor(copyFamilyFor('air_conditioning'), ctx)).toBe('Need heating or cooling help today?')
  })
})
