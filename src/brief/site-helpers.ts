import type { SiteBadge, SiteContent, SiteHoursRow } from './site-content'

/**
 * A clock time as the site shows it, 12-hour: the leads app's "06:00" and
 * "20:00" read "6:00 AM" and "8:00 PM", and "7:00 am" or "7am" read
 * "7:00 AM". Anything else comes back as given, trimmed.
 */
export function formatTime(value: string): string {
  const time = value.trim()
  const h24 = /^([01]?\d|2[0-4]):([0-5]\d)(?::[0-5]\d)?$/.exec(time)
  if (h24) {
    const hour = Number(h24[1])
    if (hour === 24 && h24[2] !== '00') return time
    return `${hour % 12 || 12}:${h24[2]} ${hour < 12 || hour === 24 ? 'AM' : 'PM'}`
  }
  const h12 = /^(1[0-2]|0?[1-9])(?::([0-5]\d))?\s*([ap])\.?\s*m\.?$/i.exec(time)
  if (h12) return `${Number(h12[1])}:${h12[2] ?? '00'} ${h12[3].toUpperCase()}M`
  return time
}

/** "7:00 AM – 6:00 PM" whichever clock the brief used, or "Closed" when either side is missing. */
export function hoursLabel(row: SiteHoursRow): string {
  return row.open && row.close ? `${formatTime(row.open)} – ${formatTime(row.close)}` : 'Closed'
}

/** True when the Hours/Contact section has anything to show. */
export function hasContactInfo(site: SiteContent): boolean {
  return Boolean(site.hours || site.address || site.phone)
}

/** Mean of the numeric ratings, rounded to one decimal, or null. */
export function averageRating(site: SiteContent): number | null {
  const rated = site.reviews.map((r) => r.rating).filter((r): r is number => r !== null)
  if (rated.length === 0) return null
  return Math.round((rated.reduce((a, b) => a + b, 0) / rated.length) * 10) / 10
}

export interface NavLink {
  label: string
  href: string
}

/** In-page nav: only sections that will actually render. */
export function navLinks(site: SiteContent, contactLabel = 'Contact'): NavLink[] {
  const links: NavLink[] = [{ label: 'Services', href: '#services' }]
  if (site.reviews.length > 0) links.push({ label: 'Reviews', href: '#reviews' })
  if (hasContactInfo(site)) links.push({ label: contactLabel, href: '#contact' })
  return links
}

/**
 * The nav's own phone link, or null. A brief whose action already dials
 * the phone (a CTA of "Call ...") puts the number on the nav's button, so
 * the bare number beside it would say it twice; the button stays.
 */
export function navPhoneHref(site: SiteContent): string | null {
  return site.phoneHref !== null && site.cta.href !== site.phoneHref ? site.phoneHref : null
}

/** "Plumbing in Nampa" / "Plumbing" — a short locality line. */
export function localityLine(site: SiteContent): string {
  return site.city ? `${site.verticalLabel} in ${site.city}` : site.verticalLabel
}

/**
 * How a badge reads as a mark: the large line and the small one under it.
 * A rating leads with its score, a BBB badge with its grade, everything
 * else with its label.
 */
export function badgeFace(badge: SiteBadge): { big: string; small: string | null } {
  if (badge.kind === 'rating' && badge.value) return { big: badge.value, small: badge.label }
  if (badge.kind === 'bbb' && badge.value) return { big: badge.value, small: badge.label }
  return { big: badge.label, small: badge.value ?? null }
}

/** A star score parsed from a rating badge's value, or null. */
export function badgeScore(badge: SiteBadge): number | null {
  if (badge.kind !== 'rating' || !badge.value) return null
  const score = Number.parseFloat(badge.value)
  return Number.isFinite(score) && score >= 0 && score <= 5 ? score : null
}

/**
 * The service-areas heading from the data alone: "Serving Nampa and 7
 * nearby towns", led by the business's own city when it is on the list.
 */
export function servingHeading(site: SiteContent): string {
  const areas = site.serviceAreas
  if (areas.length === 0) return ''
  const lead = site.city && areas.includes(site.city) ? site.city : areas[0]
  const others = areas.length - 1
  if (others === 0) return `Serving ${lead}`
  return `Serving ${lead} and ${others} nearby ${others === 1 ? 'town' : 'towns'}`
}

export interface SiteAction {
  label: string
  href: string
  /** True for the click-to-call action. */
  call: boolean
}

/**
 * The two hero (and quote band) actions, in rank order. Plumbing sites lead
 * with the call, so a residential page with a phone puts Call first and the
 * brief's own action second; a commercial page leads with the bid request.
 * A brief whose action already dials the phone gets one action, not two.
 */
export function heroActions(site: SiteContent): { primary: SiteAction; secondary: SiteAction | null } {
  const own: SiteAction = { label: site.cta.label, href: site.cta.href, call: site.cta.href.startsWith('tel:') }
  const call: SiteAction | null = site.ctaSecondary ? { ...site.ctaSecondary, call: true } : null
  if (!call || own.href === call.href) return { primary: own, secondary: null }
  return site.mode === 'residential' ? { primary: call, secondary: own } : { primary: own, secondary: call }
}

/** The quote band's id, so "#quote" reaches it. */
export const QUOTE_HREF = '#quote'

/**
 * The quote band's actions: the hero's, less any that would point the band
 * at itself. A brief with no form of its own sends its CTA to "#quote" (the
 * sparse brief does), which scrolls the hero there but goes nowhere from
 * inside the band, so the band drops it; with nothing left it shows no
 * buttons.
 */
export function quoteActions(site: SiteContent): { primary: SiteAction | null; secondary: SiteAction | null } {
  const { primary, secondary } = heroActions(site)
  const away = [primary, secondary].filter((a): a is SiteAction => a !== null && a.href !== QUOTE_HREF)
  return { primary: away[0] ?? null, secondary: away[1] ?? null }
}

/** "Licensed & insured", then the license number and founding year when the brief has them. */
export function credentialLines(site: SiteContent): string[] {
  const lines = ['Licensed & insured']
  if (site.licenseNumber) lines.push(`License ${site.licenseNumber}`)
  if (site.foundedYear) lines.push(`In business since ${site.foundedYear}`)
  return lines
}

/**
 * One-line hours summary for a footer: consecutive days with the same hours
 * are folded, e.g. "Mon–Fri 7:00 AM – 6:00 PM · Sat 8:00 AM – 2:00 PM · Sun Closed".
 */
export function hoursSummary(hours: SiteHoursRow[] | null): string | null {
  if (!hours || hours.length === 0) return null
  const short = (day: string) => day.slice(0, 3)
  const groups: Array<{ from: string; to: string; label: string }> = []
  for (const row of hours) {
    const label = hoursLabel(row)
    const last = groups[groups.length - 1]
    if (last && last.label === label) last.to = row.day
    else groups.push({ from: row.day, to: row.day, label })
  }
  return groups
    .map((g) => `${g.from === g.to ? short(g.from) : `${short(g.from)}–${short(g.to)}`} ${g.label}`)
    .join(' · ')
}
