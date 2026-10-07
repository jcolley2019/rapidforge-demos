import type { DesignBrief } from './design-brief'
import {
  audiencesFor,
  commercialCopyFor,
  copyFamilyFor,
  ctaHeadlineFor,
  jobsiteCopyFor,
  pickCopy,
  type AudienceTile,
  type CopyFamily,
  type RegisterCopy,
} from './copy'
import { TRADE_PHOTOS } from './trade-photos'

/**
 * SiteContent — what the variants render. Derived from a DesignBrief by
 * `toSiteContent`; nothing here is invented beyond deterministic copy
 * templates and short per-vertical service blurbs. Reviews are verbatim.
 */

export type Segment = DesignBrief['segment']

/**
 * How a page renders. Residential: offers under the hero, service areas,
 * the brief's own call to action. Commercial: "Request a bid", a subhead
 * that names the audience, a "Who we work with" strip, no offers.
 */
export type SiteMode = 'residential' | 'commercial'

export type SiteBadge = DesignBrief['badges'][number]
export type SiteStat = DesignBrief['stats'][number]
export type SiteOffer = DesignBrief['offers'][number]
export type SiteAudience = AudienceTile

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
  /** Action headline for the quote band, e.g. "Need a plumber today?". */
  ctaHeadline: string
  /**
   * Short trust claims: one per badge and stat when the brief has them,
   * else the defaults, which never carry a year or a license number.
   */
  trust: string[]
  services: SiteService[]
  reviews: SiteReview[]
  hours: SiteHoursRow[] | null
  phone: string | null
  /** "tel:" + digits, or null when there is no phone. */
  phoneHref: string | null
  address: string | null
  cta: SiteCta
  /** Click-to-call, when the brief has a phone. */
  ctaSecondary: { label: string; href: string } | null
  /** photo_urls from the brief, or the trade family's stock heroes when the audit found none. */
  photos: string[]
  /** Supporting stock shots for service tiles, from the trade family. */
  detailPhotos: string[]
  /** current_site_problem — kept for the picker, shown nowhere on the site. */
  problemLine: string
  /** The brief's segment, as given. */
  segment: Segment
  /** commercial for commercial and new_construction briefs, else residential. */
  mode: SiteMode
  /** The nav's action label: "Request a bid" in commercial mode, else the CTA label. */
  navCtaLabel: string
  /** Towns served, in brief order. */
  serviceAreas: string[]
  badges: SiteBadge[]
  stats: SiteStat[]
  offers: SiteOffer[]
  foundedYear: number | null
  licenseNumber: string | null
  /** crew_photo_urls: when present, heroes lead with these instead of trade photos. */
  crewPhotos: string[]
  hoursNote: string | null
  /** One line for the bar above the nav, from hours_note and the first three towns, or null. */
  utilityLine: string | null
  /** "Who we work with" tiles, shown in commercial mode. */
  audiences: SiteAudience[]
  /** Copy for each register, so a preset can lean (see `forLean`). */
  registers: Record<'residential' | 'commercial' | 'jobsite', RegisterCopy>
  /** logo_url: when present, variant headers show it in place of the text wordmark. */
  logoUrl: string | null
  /** current_site: the picker's "Your site today" card, or null to leave it out. */
  currentSite: SiteCurrentSite | null
}

export interface SiteCurrentSite {
  desktopUrl: string
  mobileUrl: string
  capturedAt: string
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
    // Before "water heater", so a commercial boiler line gets the commercial blurb.
    ['boiler', 'Commercial boilers and water heaters installed, serviced and repaired.'],
    ['water heater', 'Repairs and replacements for tank and tankless units.'],
    ['leak', 'Pinpointed and fixed before it becomes water damage.'],
    ['sewer', 'Diagnosis and repair of main lines, from camera inspection to replacement.'],
    ['fixture', 'Faucets, toilets, and sinks installed cleanly and set up right.'],
    ['repipe', 'Aging or failing pipe replaced with modern materials.'],
    ['emergency', 'When it cannot wait, neither do we.'],
    ['tenant', 'Plumbing for build-outs and remodels, scheduled around your other trades.'],
    ['rough-in', 'Rough-in to final, built to plan and ready for inspection.'],
    ['backflow', 'Annual testing and certification, with the paperwork filed for you.'],
    ['grease', 'Interceptor pumping, cleaning and repair that keeps kitchens up to code.'],
    ['maintenance', 'Scheduled inspections that catch problems before your tenants do.'],
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

/** A badge as a short claim: "BBB A+", "Idaho license PLB-C-12345", "4.9 from 312 Google reviews". */
export function badgeChip(badge: SiteBadge): string {
  if (!badge.value) return badge.label
  if (badge.kind === 'rating') return `${badge.value} from ${badge.label}`
  return `${badge.label} ${badge.value}`
}

/** "Nampa", "Nampa & Caldwell", "Nampa, Caldwell & Kuna", "Nampa, Caldwell, Kuna & more". */
export function servingList(areas: string[]): string {
  if (areas.length > 3) return `${areas.slice(0, 3).join(', ')} & more`
  if (areas.length <= 1) return areas[0] ?? ''
  return `${areas.slice(0, -1).join(', ')} & ${areas[areas.length - 1]}`
}

export function utilityLineOf(hoursNote: string | null, areas: string[]): string | null {
  const parts: string[] = []
  if (hoursNote) parts.push(hoursNote)
  if (areas.length > 0) parts.push(`Serving ${servingList(areas)}`)
  return parts.length > 0 ? parts.join(' · ') : null
}

const trimmed = (list: string[]) => list.map((s) => s.trim()).filter(Boolean)

export function toSiteContent(brief: DesignBrief): SiteContent {
  const name = brief.business_name.trim()
  const shortName = shortNameOf(name)
  const verticalLabel = verticalLabelOf(brief.vertical)
  const city = cityFromAddress(brief.address)
  const family = copyFamilyFor(brief.vertical)
  const ctx = { name, shortName, city, verticalLabel }

  const phone = brief.phone?.trim() || null
  const phoneHref = phoneHrefOf(phone)

  const segment = brief.segment
  const mode: SiteMode = segment === 'commercial' || segment === 'new_construction' ? 'commercial' : 'residential'
  // A mixed brief renders residential by default; its commercial register
  // (for a commercial-leaning preset) reads like a commercial brief's.
  const commercialFlavor = segment === 'new_construction' ? 'new_construction' : 'commercial'

  const registers: SiteContent['registers'] = {
    residential: { ...pickCopy(brief, ctx), ctaHeadline: ctaHeadlineFor(family, ctx) },
    commercial: commercialCopyFor(family, commercialFlavor, ctx),
    jobsite: jobsiteCopyFor(family, ctx),
  }
  const copy = registers[mode]

  const badgesAndStats = [...brief.badges.map(badgeChip), ...brief.stats.map((s) => `${s.value} ${s.label}`)]
  const trust = badgesAndStats.length > 0 ? badgesAndStats : ['Licensed & insured', 'Same-day service', 'Upfront pricing']
  if (badgesAndStats.length === 0 && city) trust.push(`Serving ${city}`)

  const ownPhotos = trimmed(brief.photo_urls)
  const serviceAreas = trimmed(brief.service_areas)
  const hoursNote = brief.hours_note?.trim() || null

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
    headline: copy.headline,
    subhead: copy.subhead,
    ctaHeadline: copy.ctaHeadline,
    trust,
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
    ctaSecondary: phone && phoneHref ? { label: `Call ${phone}`, href: phoneHref } : null,
    photos: ownPhotos.length > 0 ? ownPhotos : [...TRADE_PHOTOS[family].hero],
    detailPhotos: [...TRADE_PHOTOS[family].detail],
    problemLine: brief.current_site_problem,
    segment,
    mode,
    navCtaLabel: mode === 'commercial' ? 'Request a bid' : cta.label,
    serviceAreas,
    badges: brief.badges.map((b) => ({ ...b })),
    stats: brief.stats.map((s) => ({ ...s })),
    offers: brief.offers.map((o) => ({ ...o })),
    foundedYear: brief.founded_year,
    licenseNumber: brief.license_number?.trim() || null,
    crewPhotos: trimmed(brief.crew_photo_urls),
    hoursNote,
    utilityLine: utilityLineOf(hoursNote, serviceAreas),
    audiences: audiencesFor(commercialFlavor, ctx),
    registers,
    logoUrl: brief.logo_url?.trim() || null,
    currentSite: brief.current_site
      ? {
          desktopUrl: brief.current_site.desktop_url,
          mobileUrl: brief.current_site.mobile_url,
          capturedAt: brief.current_site.captured_at,
        }
      : null,
  }
}

/**
 * The site as a preset with a commercial lean renders it. A mixed brief
 * takes the full commercial switch; a residential brief keeps its sections
 * and call to action but speaks in the jobsite register; a commercial
 * brief is already there. A residential lean changes nothing.
 */
export function forLean(site: SiteContent, lean: SiteMode): SiteContent {
  if (lean !== 'commercial' || site.mode === 'commercial') return site
  if (site.segment === 'mixed') {
    // The brief's CTA was written for homeowners; every action reads as a bid request here.
    return {
      ...site,
      ...site.registers.commercial,
      mode: 'commercial',
      navCtaLabel: 'Request a bid',
      cta: { ...site.cta, label: 'Request a bid' },
    }
  }
  return { ...site, ...site.registers.jobsite }
}
