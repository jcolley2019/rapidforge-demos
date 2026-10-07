import { DesignBriefSchema } from './design-brief'
import { toSiteContent, type SiteContent } from './site-content'

/**
 * The briefs this build can render, keyed by fixture stem (a filename under
 * src/brief/fixtures). VITE_BRIEF picks the default at build time and
 * defaults to acme-plumbing; at run time a `?brief=<stem>` query picks any
 * other one from the same map, which is how the picker's Residential /
 * Commercial toggle swaps fixtures without a rebuild.
 */
const DEFAULT_BRIEF = 'acme-plumbing'

const fixtures = import.meta.glob<{ default: unknown }>('./fixtures/*.json', { eager: true })

function stemOf(path: string): string {
  return path.replace(/^.*\//, '').replace(/\.json$/, '')
}

const briefModules = new Map(Object.entries(fixtures).map(([path, mod]) => [stemOf(path), mod.default]))

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
  const stem = param?.trim()
  return stem && briefModules.has(stem) ? stem : briefName
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
