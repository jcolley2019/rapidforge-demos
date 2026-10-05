import type { SiteContent, SiteHoursRow } from './site-content'

/** "7:00 AM – 6:00 PM", or "Closed" when either side is missing. */
export function hoursLabel(row: SiteHoursRow): string {
  return row.open && row.close ? `${row.open} – ${row.close}` : 'Closed'
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

/** "Plumbing in Nampa" / "Plumbing" — a short locality line. */
export function localityLine(site: SiteContent): string {
  return site.city ? `${site.verticalLabel} in ${site.city}` : site.verticalLabel
}
