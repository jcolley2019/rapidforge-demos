import leadBrief, { stem as leadStem } from 'virtual:lead-brief'
import { DesignBriefSchema } from './design-brief'
import { toSiteContent, type SiteContent } from './site-content'

/**
 * The briefs this build can render, keyed by fixture stem (a filename under
 * src/brief/fixtures). VITE_BRIEF picks the default at build time and
 * defaults to acme-plumbing; at run time a `?brief=<stem>` query picks any
 * other one from the same map, which is how the picker's Residential /
 * Commercial toggle swaps fixtures without a rebuild.
 *
 * Acme and sparse fixtures are globbed. Lead fixtures (lead-*.json, one per
 * prospect, gitignored) are not: a build carries at most the one lead that
 * VITE_BRIEF names, through `virtual:lead-brief`, so a deploy for one
 * prospect never contains another's data.
 */
const DEFAULT_BRIEF = 'acme-plumbing'

const fixtures = import.meta.glob<{ default: unknown }>(['./fixtures/*.json', '!./fixtures/lead-*.json'], {
  eager: true,
})

function stemOf(path: string): string {
  return path.replace(/^.*\//, '').replace(/\.json$/, '')
}

export interface LeadModule {
  stem: string
  brief: unknown
}

/** Stem → raw brief: every globbed fixture plus the built lead, when there is one. */
export function briefRegistry(globbed: Record<string, { default: unknown }>, lead: LeadModule | null): Map<string, unknown> {
  const map = new Map(Object.entries(globbed).map(([path, mod]) => [stemOf(path), mod.default]))
  if (lead) map.set(lead.stem, lead.brief)
  return map
}

/** The stem `requested` resolves to within `registry`: itself when present, else `fallback`. */
export function resolveStem(registry: Map<string, unknown>, requested: string | null | undefined, fallback: string): string {
  const stem = requested?.trim()
  return stem && registry.has(stem) ? stem : fallback
}

const briefModules = briefRegistry(fixtures, leadStem ? { stem: leadStem, brief: leadBrief } : null)

const requested = import.meta.env.VITE_BRIEF?.trim() || DEFAULT_BRIEF

if (!briefModules.has(requested)) {
  const available = [...briefModules.keys()].sort().join(', ')
  throw new Error(`VITE_BRIEF="${requested}" has no fixture. Available: ${available}`)
}

const parsed = new Map<string, SiteContent>()

/** The parsed site for a fixture stem, or null when there is no such fixture. */
export function siteContentFor(stem: string): SiteContent | null {
  const cached = parsed.get(stem)
  if (cached) return cached
  if (!briefModules.has(stem)) return null
  const site = toSiteContent(DesignBriefSchema.parse(briefModules.get(stem)))
  parsed.set(stem, site)
  return site
}

export const briefName = requested
export const siteContent = siteContentFor(requested)!

/** The stem a `?brief=` value resolves to: itself when it names a fixture, else the default. */
export function resolveBriefName(param: string | null | undefined): string {
  return resolveStem(briefModules, param, briefName)
}

/** Residential and commercial fixtures of one business, for the picker's segment toggle. */
export interface SegmentTwins {
  residential: string
  commercial: string
}

const SEGMENT_TWINS: SegmentTwins[] = [{ residential: 'acme-plumbing', commercial: 'acme-commercial' }]

/** The twin pair a stem belongs to, or null when it has no counterpart. */
export function twinsFor(stem: string): SegmentTwins | null {
  return (
    SEGMENT_TWINS.find(
      (t) => (t.residential === stem || t.commercial === stem) && briefModules.has(t.residential) && briefModules.has(t.commercial),
    ) ?? null
  )
}
