import { DesignBriefSchema, type DesignBrief } from '../brief/design-brief'

/**
 * Step 7: one DesignBrief from the lead brief and what the site gave.
 * Precedence per field: the lead brief's value when it is non-empty, then
 * the site's, then the schema default. The result has passed
 * DesignBriefSchema.parse, so nothing is written unless it is valid.
 */

export type BriefKey = keyof DesignBrief

/** Where a field's final value came from. */
export type FieldStatus = 'lead' | 'found' | 'inferred' | 'generated' | 'default' | 'missing'

export interface SiteField<K extends BriefKey> {
  value: DesignBrief[K]
  /** found: read off the site; inferred: judged (AI or heuristic); generated: made by intake itself. */
  status: 'found' | 'inferred' | 'generated'
  how: string
}

export type SiteFields = { [K in BriefKey]?: SiteField<K> }

export interface Provenance {
  status: FieldStatus
  how: string
}

export const BRIEF_FIELDS = Object.keys(DesignBriefSchema.shape) as BriefKey[]

/** A lead brief may be partial; absent fields stay absent rather than taking defaults. */
const LeadBriefSchema = DesignBriefSchema.partial()

export function parseLeadBrief(raw: unknown): Partial<DesignBrief> {
  return LeadBriefSchema.parse(raw)
}

/** null, undefined, a blank string and an empty array count as empty. */
export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  return false
}

export function mergeBrief(
  lead: Partial<DesignBrief> | null,
  site: SiteFields,
): { brief: DesignBrief; provenance: Record<BriefKey, Provenance> } {
  const merged: Record<string, unknown> = {}
  const chosen: Partial<Record<BriefKey, Provenance>> = {}
  for (const key of BRIEF_FIELDS) {
    const fromLead = lead?.[key]
    const fromSite = site[key]
    if (!isEmpty(fromLead)) {
      merged[key] = fromLead
      chosen[key] = { status: 'lead', how: 'lead brief' }
    } else if (fromSite && !isEmpty(fromSite.value)) {
      merged[key] = fromSite.value
      chosen[key] = { status: fromSite.status, how: fromSite.how }
    } else if (fromLead !== undefined) {
      merged[key] = fromLead
    } else if (fromSite) {
      merged[key] = fromSite.value
    }
    // Neither side has the key: the schema default applies.
  }

  const brief = DesignBriefSchema.parse(merged)
  const provenance = {} as Record<BriefKey, Provenance>
  for (const key of BRIEF_FIELDS) {
    if (isEmpty(brief[key])) provenance[key] = { status: 'missing', how: 'not found' }
    else provenance[key] = chosen[key] ?? { status: 'default', how: 'schema default' }
  }
  return { brief, provenance }
}

/** True for a path relative to the lead folder ("photos/01.jpg"), false for a URL or a rooted path. */
function isLeadRelative(url: string): boolean {
  return !/^(?:[a-z][a-z0-9+.-]*:|\/)/i.test(url)
}

/**
 * The brief with every lead-relative asset path ("photos/01.jpg",
 * "logo.png", "current-desktop.jpg") moved under `base`, e.g.
 * "/leads/acme" → "/leads/acme/photos/01.jpg". Remote URLs are left alone.
 */
export function rebaseAssets(brief: DesignBrief, base: string): DesignBrief {
  const at = (url: string) => (isLeadRelative(url) ? `${base}/${url}` : url)
  return {
    ...brief,
    photo_urls: brief.photo_urls.map(at),
    crew_photo_urls: brief.crew_photo_urls.map(at),
    logo_url: brief.logo_url === null ? null : at(brief.logo_url),
    current_site: brief.current_site && {
      ...brief.current_site,
      desktop_url: at(brief.current_site.desktop_url),
      mobile_url: at(brief.current_site.mobile_url),
    },
  }
}
