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
