import type { DesignBrief } from './design-brief'
import { copyFamilyFor, pickCopy, type CopyFamily } from './copy'

/**
 * SiteContent — what the variants render. Derived from a DesignBrief by
 * `toSiteContent`; nothing here is invented beyond deterministic copy
 * templates and short per-vertical service blurbs. Reviews are verbatim.
 */

export interface SiteService {
  title: string
  blurb: string
}

export interface SiteReview {
  text: string
  rating: number | null
  author: string | null
}

export interface SiteHoursRow {
  day: string
  open: string | null
  close: string | null
}

export interface SiteCta {
  label: string
  href: string
  kind: DesignBrief['primary_cta']['kind']
}

export interface SiteContent {
  name: string
  /** First two words of the name, or the whole name when it is ≤ 2 words. */
  shortName: string
  /** Human label for the vertical, e.g. "Plumbing". */
  verticalLabel: string
  /** City parsed from the address, or null. */
  city: string | null
  headline: string
  subhead: string
  services: SiteService[]
  reviews: SiteReview[]
  hours: SiteHoursRow[] | null
  phone: string | null
  /** "tel:" + digits, or null when there is no phone. */
  phoneHref: string | null
  address: string | null
  cta: SiteCta
  /** current_site_problem — kept for the picker, shown nowhere on the site. */
  problemLine: string
}

const VERTICAL_LABELS: Record<string, string> = {
  plumber: 'Plumbing',
  plumbing: 'Plumbing',
  plumbing_contractor: 'Plumbing',
  hvac: 'Heating & Cooling',
  hvac_contractor: 'Heating & Cooling',
  heating_and_cooling: 'Heating & Cooling',
  electrician: 'Electrical',
  electrical: 'Electrical',
  electrical_contractor: 'Electrical',
  roofer: 'Roofing',
  roofing: 'Roofing',
  landscaper: 'Landscaping',
  landscaping: 'Landscaping',
  dentist: 'Dental Care',
  dental_office: 'Dental Care',
  auto_repair: 'Auto Repair',
  general_contractor: 'General Contracting',
  cleaning_service: 'Cleaning',
  pest_control: 'Pest Control',
}

/** Short service blurbs by vertical family, matched on a title keyword. */
const SERVICE_BLURBS: Record<CopyFamily, Array<[keyword: string, blurb: string]>> = {
  plumbing: [
    ['drain', 'Clogs cleared and lines flowing again, without the mess.'],
    ['water heater', 'Repairs and replacements for tank and tankless units.'],
    ['leak', 'Pinpointed and fixed before it becomes water damage.'],
    ['sewer', 'Diagnosis and repair of main lines, from camera inspection to replacement.'],
    ['fixture', 'Faucets, toilets, and sinks installed cleanly and set up right.'],
    ['repipe', 'Aging or failing pipe replaced with modern materials.'],
    ['emergency', 'When it cannot wait, neither do we.'],
  ],
  hvac: [
    ['air condition', 'Repair, tune-ups, and new systems sized for your home.'],
    ['ac', 'Repair, tune-ups, and new systems sized for your home.'],
    ['furnace', 'Safe, efficient heat through the coldest months.'],
    ['heat pump', 'Year-round comfort from one efficient system.'],
    ['duct', 'Sealed and balanced ductwork for even temperatures room to room.'],
    ['maintenance', 'Seasonal checkups that catch small problems early.'],
    ['thermostat', 'Smart controls installed and configured for you.'],
  ],
  electrical: [
    ['panel', 'Upgrades and replacements that bring your service up to code and capacity.'],
    ['wiring', 'New circuits and rewires done neatly and safely.'],
    ['lighting', 'Indoor and outdoor lighting designed, installed, and dimmed just right.'],
    ['ev', 'Home charging installed for your vehicle and your panel.'],
    ['generator', 'Standby power sized and wired for when the grid goes down.'],
    ['outlet', 'Outlets, switches, and GFCI protection where you need them.'],
    ['inspection', 'A clear read on the condition of your electrical system.'],
    ['emergency', 'When it cannot wait, neither do we.'],
  ],
  generic: [],
}

export function shortNameOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  return words.length <= 2 ? name.trim() : words.slice(0, 2).join(' ')
}

export function verticalLabelOf(vertical: string): string {
  const known = VERTICAL_LABELS[vertical]
  if (known) return known
  return vertical
    .split('_')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

/**
 * Pull a city out of a US-style address: the segment before the trailing
 * "ST 12345" segment, or the second segment stripped of state/zip.
 */
export function cityFromAddress(address: string | null): string | null {
  if (!address) return null
  const parts = address
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
  if (parts.length >= 3) return parts[parts.length - 2] || null
  if (parts.length === 2) {
    const city = parts[1]
      .replace(/\s+[A-Z]{2}\s*\d{5}(?:-\d{4})?$/, '')
      .replace(/\s+[A-Z]{2}$/, '')
      .trim()
    return city || null
  }
  return null
}

export function phoneHrefOf(phone: string | null): string | null {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  return digits ? `tel:${digits}` : null
}

function blurbFor(family: CopyFamily, title: string): string {
  const key = title.toLowerCase()
  for (const [keyword, blurb] of SERVICE_BLURBS[family]) {
    if (key.includes(keyword)) return blurb
  }
  return ''
}

export function toSiteContent(brief: DesignBrief): SiteContent {
  const name = brief.business_name.trim()
  const shortName = shortNameOf(name)
  const verticalLabel = verticalLabelOf(brief.vertical)
  const city = cityFromAddress(brief.address)
  const family = copyFamilyFor(brief.vertical)

  const { headline, subhead } = pickCopy(brief, { name, shortName, city, verticalLabel })

  const phone = brief.phone?.trim() || null
  const phoneHref = phoneHrefOf(phone)

  const cta: SiteCta = {
    label: brief.primary_cta.label,
    kind: brief.primary_cta.kind,
    href:
      brief.primary_cta.kind === 'phone' && phoneHref ? phoneHref : brief.primary_cta.href,
  }

  return {
    name,
    shortName,
    verticalLabel,
    city,
    headline,
    subhead,
    services: brief.services.map((title) => ({ title, blurb: blurbFor(family, title) })),
    reviews: brief.review_quotes.map((q) => ({
      text: q.text,
      rating: q.rating,
      author: q.author ?? null,
    })),
    hours: brief.hours ? brief.hours.map((h) => ({ ...h })) : null,
    phone,
    phoneHref,
    address: brief.address?.trim() || null,
    cta,
    problemLine: brief.current_site_problem,
  }
}
