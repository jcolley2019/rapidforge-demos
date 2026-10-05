import { DesignBriefSchema } from './design-brief'
import { toSiteContent } from './site-content'

/**
 * The brief this build renders. Chosen by VITE_BRIEF (a filename stem under
 * src/brief/fixtures); defaults to acme-plumbing.
 */
const DEFAULT_BRIEF = 'acme-plumbing'

const fixtures = import.meta.glob<{ default: unknown }>('./fixtures/*.json', { eager: true })

function stemOf(path: string): string {
  return path.replace(/^.*\//, '').replace(/\.json$/, '')
}

const requested = import.meta.env.VITE_BRIEF?.trim() || DEFAULT_BRIEF
const entry = Object.entries(fixtures).find(([path]) => stemOf(path) === requested)

if (!entry) {
  const available = Object.keys(fixtures).map(stemOf).sort().join(', ')
  throw new Error(`VITE_BRIEF="${requested}" has no fixture. Available: ${available}`)
}

export const briefName = requested
export const siteContent = toSiteContent(DesignBriefSchema.parse(entry[1].default))
