import * as cheerio from 'cheerio'
import type { CheerioAPI } from 'cheerio'
import { absoluteUrl, hostKey, type FetchedSite } from './fetch'

/**
 * Step 2: everything the current site states outright, read
 * deterministically: tel: links, JSON-LD, regexes over the visible text,
 * the nav and headings, the logo, and the stylesheets' colors. Nothing
 * here guesses; the refine step does the judgement calls.
 */

/** A value read from the site, and how it was read (for the intake report). */
export interface Found<T> {
  value: T
  how: string
}

export interface HoursRow {
  day: string
  open: string | null
  close: string | null
}

export interface ExtractedReview {
  text: string
  rating: number | null
  author?: string
}

export interface SiteCta {
  label: string
  kind: 'booking' | 'form'
  href: string
}

/**
 * Yes/no facts about the current site's static HTML, for the "what is
 * wrong with it" line. Only facts a missing script cannot fake: review and
 * booking widgets often load by script, so "no reviews" is never claimed.
 */
export interface SiteSignals {
  hasTelLink: boolean
  hasViewport: boolean
  isHttps: boolean
  hasHours: boolean
  hasBooking: boolean
}

export interface SiteExtract {
  businessName: Found<string> | null
  vertical: Found<string> | null
  phone: Found<string> | null
  hours: Found<HoursRow[]> | null
  /** Lines that mention days with times, for the refine step to normalize. */
  hoursText: string | null
  hoursNote: Found<string> | null
  address: Found<string> | null
  license: Found<string> | null
  foundedYear: Found<number> | null
  reviews: Found<ExtractedReview[]> | null
  rating: Found<{ value: string; count: number | null }> | null
  serviceAreas: Found<string[]> | null
  /** Nav labels and h2/h3 headings that might name a service, raw. */
  serviceCandidates: string[]
  logoUrl: Found<string> | null
  brandColors: Found<string[]> | null
  cta: Found<SiteCta> | null
  signals: SiteSignals
  /** Visible text, homepage first, capped for the refine prompt. */
  text: string
}

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const

// Text -------------------------------------------------------------------

const BLOCKS =
  'p, div, li, ul, ol, dl, dt, dd, h1, h2, h3, h4, h5, h6, section, article, aside, header, footer, nav, main, table, tr, td, th, address, blockquote, figure, figcaption, form, fieldset, legend'
const INLINES = 'a, span, button, label, strong, em, b, i, small, sup, sub'

/** The page's visible text as trimmed lines, one per block element. */
export function visibleLines(html: string): string[] {
  const $ = cheerio.load(html)
  $('head, script, style, noscript, svg, template, iframe').remove()
  $('br').replaceWith('\n')
  $(INLINES).each((_, el) => {
    $(el).append(' ')
  })
  $(BLOCKS).each((_, el) => {
    $(el).append('\n')
  })
  return $.root()
    .text()
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
}

function tidy(text: string | undefined): string {
  return (text ?? '').replace(/\s+/g, ' ').trim()
}

const TEXT_BUDGET = { home: 6000, other: 2500, total: 15000 }

function promptText(pageLines: string[][]): string {
  const parts = pageLines.map((lines, i) => lines.join('\n').slice(0, i === 0 ? TEXT_BUDGET.home : TEXT_BUDGET.other))
  return parts.join('\n\n---\n\n').slice(0, TEXT_BUDGET.total)
}

// JSON-LD ----------------------------------------------------------------

type LdNode = Record<string, unknown>

/** Every typed node in the page's JSON-LD, nested ones and @graph members included. */
export function jsonLdNodes($: CheerioAPI): LdNode[] {
  const nodes: LdNode[] = []
  const walk = (value: unknown, depth: number) => {
    if (depth > 10 || value === null || typeof value !== 'object') return
    if (Array.isArray(value)) {
      for (const item of value) walk(item, depth + 1)
      return
    }
    const node = value as LdNode
    if ('@type' in node) nodes.push(node)
    for (const child of Object.values(node)) walk(child, depth + 1)
  }
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      walk(JSON.parse($(el).text()), 0)
    } catch {
      // Malformed JSON-LD is common on small-business sites; skip the block.
    }
  })
  return nodes
}

function ldTypes(node: LdNode): string[] {
  const type = node['@type']
  return (Array.isArray(type) ? type : [type]).filter((t): t is string => typeof t === 'string').map((t) => t.toLowerCase())
}

const BUSINESS_TYPE = /business$|contractor$|^plumber$|^electrician$|^roofingcontractor$|^professionalservice$|^store$/
const GENERIC_ORG = /^(?:organization|corporation)$/

function str(value: unknown): string | null {
  if (typeof value === 'string') return tidy(value) || null
  if (typeof value === 'number') return String(value)
  return null
}

/** The page's business node: a specific business type first, else a plain Organization. */
function businessNode(nodes: LdNode[]): LdNode | null {
  const named = nodes.filter((n) => str(n.name))
  return (
    named.find((n) => ldTypes(n).some((t) => BUSINESS_TYPE.test(t))) ??
    named.find((n) => ldTypes(n).some((t) => GENERIC_ORG.test(t))) ??
    null
  )
}

// Phone ------------------------------------------------------------------

/** "(208) 555-0142" from any 10-digit US number, with or without a leading 1. */
export function formatPhone(raw: string): string | null {
  let digits = raw.replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('1')) digits = digits.slice(1)
  if (digits.length !== 10) return null
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

const PHONE_TEXT = /(?:\+?1[\s.-]?)?\(?\b\d{3}\)?[\s.-]?\d{3}[\s.-]\d{4}\b/

function extractPhone(docs: CheerioAPI[], lines: string[]): Found<string> | null {
  for (const $ of docs) {
    for (const el of $('a[href]').toArray()) {
      const href = $(el).attr('href') ?? ''
      if (!/^tel:/i.test(href.trim())) continue
      const phone = formatPhone(href.trim().slice(4))
      if (phone) return { value: phone, how: 'tel: link' }
    }
  }
  for (const line of lines) {
    const match = PHONE_TEXT.exec(line)
    const phone = match && formatPhone(match[0])
    if (phone) return { value: phone, how: 'page text' }
  }
  return null
}

// Hours ------------------------------------------------------------------

const DAY_INDEX: Record<string, number> = { mo: 0, tu: 1, we: 2, th: 3, fr: 4, sa: 5, su: 6 }

function dayIndex(token: string): number | null {
  const t = token
    .toLowerCase()
    .replace(/^https?:\/\/schema\.org\//, '')
    .replace(/[^a-z]/g, '')
  const index = DAY_INDEX[t.slice(0, 2)]
  return index === undefined ? null : index
}

/** Day indexes for "Mo-Fr", "Mo,We,Fr", "Monday through Friday"; ranges may wrap past Sunday. */
function daySpan(from: number, to: number | null): number[] {
  if (to === null) return [from]
  const days: number[] = []
  for (let d = from; ; d = (d + 1) % 7) {
    days.push(d)
    if (d === to || days.length === 7) break
  }
  return days
}

/** "7:00 AM" from "07:00", "19:30", "7am", "7:30 p.m."; null when it is not a time. */
export function to12h(time: string): string | null {
  const m = /^(\d{1,2})(?::?(\d{2}))?(?::\d{2})?\s*(am|pm|a\.m\.?|p\.m\.?)?$/i.exec(time.trim())
  if (!m) return null
  let hour = Number(m[1])
  const minutes = m[2] ?? '00'
  if (Number(minutes) > 59) return null
  const suffix = m[3]?.toLowerCase().replace(/\./g, '')
  if (suffix) {
    if (hour < 1 || hour > 12) return null
    return `${hour}:${minutes} ${suffix.toUpperCase()}`
  }
  if (hour > 24) return null
  if (hour === 24) hour = 0
  return `${hour % 12 === 0 ? 12 : hour % 12}:${minutes} ${hour >= 12 ? 'PM' : 'AM'}`
}

function emptyWeek(): HoursRow[] {
  return DAYS.map((day) => ({ day, open: null, close: null }))
}

/** Rows from schema.org openingHours strings, e.g. ["Mo-Fr 07:00-18:00", "Sa 08:00-14:00"]. */
export function hoursFromOpeningHours(value: unknown): HoursRow[] | null {
  const specs = (Array.isArray(value) ? value : [value]).filter((v): v is string => typeof v === 'string')
  const rows = emptyWeek()
  let set = false
  const entry = /([A-Za-z]{2,9}(?:\s*[-,]\s*[A-Za-z]{2,9})*)\s*(\d{1,2}:\d{2})?\s*(?:-\s*(\d{1,2}:\d{2}))?/g
  for (const spec of specs) {
    for (const m of spec.matchAll(entry)) {
      // A day list with no times means open around the clock.
      const open = to12h(m[2] ?? '00:00')
      const close = to12h(m[3] ?? '23:59')
      for (const part of m[1].split(',')) {
        const [a, b] = part.split('-').map((s) => dayIndex(s))
        if (a === null || a === undefined) continue
        for (const d of daySpan(a, b ?? null)) {
          rows[d] = { day: DAYS[d], open, close }
          set = true
        }
      }
    }
  }
  return set ? rows : null
}

/** Rows from schema.org OpeningHoursSpecification nodes. */
function hoursFromSpecifications(nodes: LdNode[]): HoursRow[] | null {
  const rows = emptyWeek()
  let set = false
  for (const node of nodes) {
    if (!ldTypes(node).includes('openinghoursspecification')) continue
    const days = (Array.isArray(node.dayOfWeek) ? node.dayOfWeek : [node.dayOfWeek]).filter(
      (d): d is string => typeof d === 'string',
    )
    const opens = str(node.opens)
    const closes = str(node.closes)
    // opens == closes ("00:00"/"00:00") is schema.org's way of saying closed.
    const closed = !opens || !closes || opens === closes
    for (const day of days) {
      const d = dayIndex(day)
      if (d === null) continue
      rows[d] = { day: DAYS[d], open: closed ? null : to12h(opens), close: closed ? null : to12h(closes) }
      set = true
    }
  }
  return set ? rows : null
}

const DAY_WORD = '(?:mon|tue|wed|thu|fri|sat|sun)[a-z]*\\.?'
const TIME_WORD = '\\d{1,2}(?::\\d{2})?\\s*(?:am|pm|a\\.m\\.?|p\\.m\\.?)'
const HOURS_TEXT = new RegExp(
  `\\b(${DAY_WORD})(?:\\s*(?:-|–|—|to|thru|through)\\s*(${DAY_WORD}))?\\s*:?\\s*(?:(${TIME_WORD})\\s*(?:-|–|—|to)\\s*(${TIME_WORD})|(closed))`,
  'gi',
)

/** Rows from lines like "Mon–Fri: 7am – 6pm" and "Sunday Closed"; the first mention of a day wins. */
export function hoursFromText(lines: string[]): HoursRow[] | null {
  const rows = emptyWeek()
  const done = new Set<number>()
  for (const line of lines) {
    for (const m of line.matchAll(HOURS_TEXT)) {
      const from = dayIndex(m[1])
      if (from === null) continue
      const to = m[2] ? dayIndex(m[2]) : null
      const open = m[5] ? null : to12h(m[3])
      const close = m[5] ? null : to12h(m[4])
      for (const d of daySpan(from, to)) {
        if (done.has(d)) continue
        rows[d] = { day: DAYS[d], open, close }
        done.add(d)
      }
    }
  }
  return done.size > 0 ? rows : null
}

const HOURS_HINT = new RegExp(`\\b${DAY_WORD}\\b.*(?:\\d|closed)|24\\s*/\\s*7|24 hours`, 'i')

function hoursLines(lines: string[]): string | null {
  const hits = lines.filter((l) => l.length <= 200 && HOURS_HINT.test(l)).slice(0, 12)
  return hits.length > 0 ? hits.join('\n') : null
}

const ALWAYS_OPEN = /24\s*\/\s*7|24 hours a day|open 24 hours|24-hour emergency|24 hour emergency/i

function extractHoursNote(lines: string[]): Found<string> | null {
  const line = lines.find((l) => ALWAYS_OPEN.test(l))
  if (!line) return null
  return { value: /emergenc/i.test(line) ? '24/7 emergency service' : 'Open 24/7', how: 'page text' }
}

// License, founding year -------------------------------------------------

/** The brief's `Lic(ense)?\.?\s*#?\s*[A-Z0-9-]+`, also allowing "No." or ":", and requiring a digit. */
const LICENSE = /\bLic(?:ense)?\.?\s*(?:#|No\.?|Number)?\s*:?\s*#?\s*([A-Z0-9][A-Z0-9-]*\d[A-Z0-9-]*)/

function extractLicense(lines: string[]): Found<string> | null {
  for (const line of lines) {
    const m = LICENSE.exec(line)
    if (m) return { value: m[1].replace(/-+$/, ''), how: 'page text' }
  }
  return null
}

const FOUNDED = /\b(?:since|established(?:\s+in)?|est\.?|founded(?:\s+in)?)\s+((?:18|19|20)\d\d)\b/i

function extractFoundedYear(lines: string[], now: Date): Found<number> | null {
  for (const line of lines) {
    const m = FOUNDED.exec(line)
    const year = m ? Number(m[1]) : NaN
    if (year >= 1850 && year <= now.getFullYear()) return { value: year, how: 'page text' }
  }
  return null
}

// Reviews ----------------------------------------------------------------

function ratingOf(value: unknown): number | null {
  const source = value && typeof value === 'object' ? (value as LdNode).ratingValue : value
  const n = Number(source)
  return Number.isFinite(n) && n >= 0 && n <= 5 ? n : null
}

function extractReviews(nodes: LdNode[]): ExtractedReview[] {
  const reviews: ExtractedReview[] = []
  const seen = new Set<string>()
  for (const node of nodes) {
    if (!ldTypes(node).includes('review')) continue
    const text = str(node.reviewBody) ?? str(node.description)
    if (!text || text.length < 20 || seen.has(text.toLowerCase())) continue
    seen.add(text.toLowerCase())
    const author = str(node.author) ?? str((node.author as LdNode | undefined)?.name)
    reviews.push({ text, rating: ratingOf(node.reviewRating), ...(author ? { author } : {}) })
    if (reviews.length === 5) break
  }
  return reviews
}

function extractRating(nodes: LdNode[], business: LdNode | null): { value: string; count: number | null } | null {
  const node =
    nodes.find((n) => ldTypes(n).includes('aggregaterating')) ??
    (business?.aggregateRating && typeof business.aggregateRating === 'object' ? (business.aggregateRating as LdNode) : null)
  if (!node) return null
  const value = ratingOf(node.ratingValue)
  if (value === null) return null
  const count = Number(node.reviewCount ?? node.ratingCount)
  return { value: String(Math.round(value * 10) / 10), count: Number.isFinite(count) && count > 0 ? count : null }
}

// Address, name ----------------------------------------------------------

function addressFromLd(business: LdNode | null): string | null {
  const raw = business?.address
  if (typeof raw === 'string') return tidy(raw) || null
  const a = (Array.isArray(raw) ? raw[0] : raw) as LdNode | undefined
  if (!a || typeof a !== 'object') return null
  const street = str(a.streetAddress)
  const city = str(a.addressLocality)
  const regionZip = [str(a.addressRegion), str(a.postalCode)].filter(Boolean).join(' ')
  const parts = [street, city, regionZip].filter(Boolean)
  return parts.length >= 2 ? parts.join(', ') : null
}

const ADDRESS_TEXT =
  /\b\d{2,6}\s+(?:[NSEW]\.?\s+)?[A-Z0-9][A-Za-z0-9.' -]{1,40}?\s(?:St|Street|Ave|Avenue|Rd|Road|Blvd|Boulevard|Dr|Drive|Ln|Lane|Way|Hwy|Highway|Pkwy|Parkway|Ct|Court|Pl|Place|Cir|Circle|Trl|Trail)\.?(?:,?\s*(?:Suite|Ste\.?|Unit|#)\s*[\w-]+)?,?\s+[A-Z][A-Za-z .]+,\s*[A-Z]{2}\s+\d{5}(?:-\d{4})?\b/

function extractAddress(business: LdNode | null, lines: string[]): Found<string> | null {
  const ld = addressFromLd(business)
  if (ld) return { value: ld, how: 'JSON-LD address' }
  for (const line of lines) {
    const m = ADDRESS_TEXT.exec(line)
    if (m) return { value: tidy(m[0]), how: 'page text' }
  }
  return null
}

/** The title segment that shares the most words with the hostname, e.g. "Goodson Plumbing" for goodsonplumbing.com. */
function nameFromTitle(title: string, homeUrl: string): string | null {
  const host = hostKey(homeUrl).replace(/[^a-z0-9]/g, '')
  let best: { name: string; score: number } | null = null
  for (const segment of title.split(/\s+[|–—:-]\s+|\s*[|–—]\s*/)) {
    const name = tidy(segment)
    const words = name.toLowerCase().match(/[a-z0-9]+/g) ?? []
    const score = words.filter((w) => w.length > 2 && host.includes(w)).length
    if (name && score > 0 && (!best || score > best.score)) best = { name, score }
  }
  return best?.name ?? null
}

function extractBusinessName($: CheerioAPI, business: LdNode | null, homeUrl: string): Found<string> | null {
  const ld = str(business?.name)
  if (ld) return { value: ld, how: 'JSON-LD name' }
  const og = tidy($('meta[property="og:site_name"]').attr('content'))
  if (og) return { value: og, how: 'og:site_name' }
  const fromTitle = nameFromTitle(tidy($('title').first().text()), homeUrl)
  return fromTitle ? { value: fromTitle, how: 'page title' } : null
}

// Service areas ----------------------------------------------------------

const AREA_CUE = /\b(?:serving|service areas?|areas we serve|areas served|proudly serves?|we serve)\b:?/i
const NOT_PLACES = new Set([
  'we', 'our', 'you', 'your', 'all', 'call', 'contact', 'home', 'homes', 'residential', 'commercial', 'service',
  'services', 'area', 'areas', 'the', 'surrounding', 'nearby', 'more', 'including', 'customers', 'clients',
])

/** A town name from a list token: the leading run of capitalized words, minus a state code. */
export function placeName(token: string): string | null {
  const t = tidy(token)
    .replace(/^(?:the|and|or|&)\s+/i, '')
    .replace(/[.:;!?)]+$/, '')
  const m = /^[A-Z][\w'’.-]*(?:\s+(?:[A-Z][\w'’.-]*|of))*/.exec(t)
  if (!m) return null
  const words = m[0].replace(/[.,]+$/, '').split(' ').slice(0, 4)
  while (words.length > 1 && /^[A-Z]{2}$/.test(words[words.length - 1])) words.pop()
  const name = words.join(' ')
  if (/^[A-Z]{2}$/.test(name) || /\d/.test(name) || name.length < 3) return null
  if (words.every((w) => NOT_PLACES.has(w.toLowerCase()))) return null
  return name
}

function placesFrom(text: string): string[] {
  return text
    .split(/,|;|•|·|\||\/|\band\b|&/)
    .map(placeName)
    .filter((p): p is string => p !== null)
}

/** Town names from lists under a "Service areas" heading and from sentences like "Serving Boise, Meridian and Nampa". */
export function extractServiceAreas(docs: CheerioAPI[], lines: string[]): string[] {
  const areas: string[] = []
  for (const $ of docs) {
    $('h1, h2, h3, h4, h5, h6, strong, p').each((_, el) => {
      const heading = tidy($(el).text())
      if (heading.length > 80 || !AREA_CUE.test(heading)) return
      const list = $(el).nextAll('ul, ol').first()
      const items = list.length > 0 ? list : $(el).parent().find('ul, ol').first()
      items.find('li').each((_, li) => {
        const name = placeName($(li).text())
        if (name) areas.push(name)
      })
    })
  }
  for (const line of lines) {
    const cue = AREA_CUE.exec(line)
    if (!cue) continue
    const after = line.slice(cue.index + cue[0].length)
    const sentence = after.split(/[.!?](?:\s|$)|\bsince\b/i)[0].slice(0, 240)
    areas.push(...placesFrom(sentence))
  }
  const seen = new Set<string>()
  return areas.filter((a) => !seen.has(a.toLowerCase()) && seen.add(a.toLowerCase())).slice(0, 24)
}

// Services ---------------------------------------------------------------

const NAV_NOISE =
  /^(?:home|about(?: us)?|who we are|contact(?: us)?|blog|news|reviews?|testimonials|careers|jobs|join our team|financing|coupons?|specials|offers|deals|faqs?|service areas?|areas we serve|locations?|gallery|our work|our team|team|privacy(?: policy)?|terms.*|sitemap|menu|search|close|learn more|read more|more|get started|call(?: now| us| today)?|book(?: now| online)?|schedule(?: now| service| online)?|request service|get a quote|free estimate|login|log in|pay(?: online| bill)?|shop|cart|español|skip to content|services|our services|all services|residential|commercial|why choose us)$/i

/** Nav labels, then h2/h3 headings, that could name a service; generic site chrome dropped. */
export function serviceCandidates(docs: CheerioAPI[]): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  const add = (raw: string) => {
    const text = tidy(raw).replace(/[›»→+▾▼]+$/, '').trim()
    const key = text.toLowerCase()
    if (text.length < 3 || text.length > 60 || text.split(' ').length > 7) return
    if (NAV_NOISE.test(text) || /[?|]/.test(text) || PHONE_TEXT.test(text) || seen.has(key)) return
    seen.add(key)
    out.push(text)
  }
  for (const $ of docs) $('nav a, header a, [class*="menu"] a, [id*="menu"] a').each((_, el) => add($(el).text()))
  for (const $ of docs) $('h2, h3').each((_, el) => add($(el).text()))
  return out.slice(0, 60)
}

// Logo, images -----------------------------------------------------------

type AttrGetter = (name: string) => string | undefined

function largestFromSrcset(srcset: string | undefined): string | undefined {
  if (!srcset) return undefined
  let best: { url: string; size: number } | undefined
  for (const candidate of srcset.split(/,\s+/)) {
    const [url, descriptor = '1x'] = candidate.trim().split(/\s+/)
    const size = Number.parseFloat(descriptor) || 1
    if (url && (!best || size > best.size)) best = { url, size }
  }
  return best?.url
}

/** An img's real source: lazy-load attributes first, a data: placeholder skipped; srcset's largest when asked. */
export function imageSource(get: AttrGetter, preferLargest: boolean): string | undefined {
  const src = [get('data-src'), get('data-lazy-src'), get('src')].find((s) => s && !s.startsWith('data:'))
  const largest = largestFromSrcset(get('srcset') ?? get('data-srcset') ?? get('data-lazy-srcset'))
  return preferLargest ? (largest ?? src) : (src ?? largest)
}

function iconSize(rel: string, sizes: string | undefined): number {
  if (sizes === 'any') return 512
  const n = Math.max(0, ...(sizes ?? '').split(/\s+/).map((s) => Number.parseInt(s, 10) || 0))
  return n || (rel.includes('apple-touch-icon') ? 180 : 16)
}

/** The logo: an img whose src/alt/class says "logo" (header first), else og:image, else the largest icon. */
export function extractLogo($: CheerioAPI, pageUrl: string): Found<string> | null {
  for (const el of [...$('header img').toArray(), ...$('img').toArray()]) {
    const get: AttrGetter = (name) => $(el).attr(name)
    const src = imageSource(get, false)
    const haystack = `${src ?? ''} ${get('alt') ?? ''} ${get('class') ?? ''}`
    const url = /logo/i.test(haystack) ? absoluteUrl(src, pageUrl) : null
    if (url) return { value: url, how: 'img marked "logo"' }
  }
  const og = absoluteUrl($('meta[property="og:image"], meta[name="og:image"]').first().attr('content'), pageUrl)
  if (og) return { value: og, how: 'og:image' }
  let best: { url: string; size: number } | null = null
  $('link[rel][href]').each((_, el) => {
    const rel = ($(el).attr('rel') ?? '').toLowerCase()
    if (!rel.split(/\s+/).some((r) => r === 'icon' || r.startsWith('apple-touch-icon'))) return
    const url = absoluteUrl($(el).attr('href'), pageUrl)
    const size = iconSize(rel, $(el).attr('sizes'))
    if (url && (!best || size > best.size)) best = { url, size }
  })
  const icon = best as { url: string; size: number } | null
  return icon ? { value: icon.url, how: `largest icon (${icon.size}px)` } : null
}

// Brand colors -----------------------------------------------------------

/** "#rrggbb" for a hex, rgb() or hsl() color; null for anything else or a mostly transparent color. */
export function normalizeColor(value: string): string | null {
  const v = value.trim().toLowerCase()
  const hex = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/.exec(v)
  if (hex) {
    let h = hex[1]
    if (h.length <= 4) h = [...h].map((c) => c + c).join('')
    if (h.length === 8 && Number.parseInt(h.slice(6), 16) < 128) return null
    return `#${h.slice(0, 6)}`
  }
  const fn = /^(rgba?|hsla?)\(([^)]*)\)$/.exec(v)
  if (!fn) return null
  const parts = fn[2].split(/[\s,/]+/).filter(Boolean)
  if (parts.length < 3) return null
  const alpha = parts[3] === undefined ? 1 : Number.parseFloat(parts[3]) / (parts[3].endsWith('%') ? 100 : 1)
  if (!(alpha >= 0.5)) return null
  let rgb: number[]
  if (fn[1].startsWith('rgb')) {
    rgb = parts.slice(0, 3).map((p) => (p.endsWith('%') ? (Number.parseFloat(p) * 255) / 100 : Number.parseFloat(p)))
  } else {
    const h = Number.parseFloat(parts[0]) / 360
    const s = Number.parseFloat(parts[1]) / 100
    const l = Number.parseFloat(parts[2]) / 100
    rgb = hslToRgb(h, s, l)
  }
  if (rgb.some((c) => !Number.isFinite(c))) return null
  return `#${rgb.map((c) => Math.round(Math.min(255, Math.max(0, c))).toString(16).padStart(2, '0')).join('')}`
}

function hslToRgb(h: number, s: number, l: number): number[] {
  const hue = (t: number) => {
    const p = l < 0.5 ? l * (1 + s) : l + s - l * s
    const q = 2 * l - p
    const x = ((t % 1) + 1) % 1
    if (x < 1 / 6) return q + (p - q) * 6 * x
    if (x < 1 / 2) return p
    if (x < 2 / 3) return q + (p - q) * (2 / 3 - x) * 6
    return q
  }
  return [hue(h + 1 / 3), hue(h), hue(h - 1 / 3)].map((c) => c * 255)
}

/**
 * True for white, black and grays: low chroma, or nearly white or nearly
 * black. Chroma rather than HSL saturation, so tinted grays such as
 * Tailwind's #111827 and #374151 count as gray.
 */
export function isNeutral(hex: string): boolean {
  const [r, g, b] = [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16) / 255)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const lightness = (max + min) / 2
  return max - min < 0.12 || lightness > 0.94 || lightness < 0.06
}

const COLOR_LITERAL = /#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})\b|(?:rgba?|hsla?)\([^)]*\)/gi
const CUSTOM_PROP = /(--[\w-]+)\s*:\s*([^;{}]+)/g
const VAR_REF = /var\(\s*(--[\w-]+)/g
/** WordPress's default palette, declared on every block theme whether used or not. */
const WP_PRESET = /^--wp--preset--/
/** Default link blues and purples (browser defaults, CSS "blue") that resets and site builders restate. */
const UA_DEFAULTS = new Set(['#0000ee', '#551a8b', '#ee0000', '#0000ff'])

/**
 * The most used non-neutral colors, most used first, at most four. A color
 * counts once per literal and once per var() reference to a custom
 * property that holds it, so `--brand: #1d4ed8` used ten times ranks high.
 */
export function extractBrandColors(cssTexts: string[]): string[] {
  const counts = new Map<string, number>()
  const bump = (color: string | null) => {
    if (color && !isNeutral(color) && !UA_DEFAULTS.has(color)) counts.set(color, (counts.get(color) ?? 0) + 1)
  }
  // Declaration blocks only, so a selector such as #add or #face is never read as a color.
  const blocks = cssTexts.flatMap((css) => css.replace(/\/\*[\s\S]*?\*\//g, '').match(/\{[^{}]*\}/g) ?? [])
  const props = new Map<string, string>()
  for (const block of blocks) {
    for (const m of block.matchAll(CUSTOM_PROP)) {
      if (WP_PRESET.test(m[1])) continue
      const color = normalizeColor(m[2].replace(/!important/i, ''))
      if (color) props.set(m[1], color)
    }
  }
  for (const block of blocks) {
    const own = block.replace(/--wp--preset--[\w-]+\s*:[^;{}]+/g, '')
    for (const m of own.matchAll(COLOR_LITERAL)) bump(normalizeColor(m[0]))
    for (const m of own.matchAll(VAR_REF)) bump(props.get(m[1]) ?? null)
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([color]) => color)
}

// Call to action ---------------------------------------------------------

function labelCase(text: string): string {
  const t = tidy(text)
  return t === t.toUpperCase() ? t.charAt(0) + t.slice(1).toLowerCase() : t
}

/** The site's own booking link, else its quote/contact link. */
function extractCta($: CheerioAPI, pageUrl: string): Found<SiteCta> | null {
  let form: SiteCta | null = null
  for (const el of $('a[href]').toArray()) {
    const raw = ($(el).attr('href') ?? '').trim()
    const text = tidy($(el).text())
    if (!text || text.length > 32 || raw.startsWith('#')) continue
    const href = absoluteUrl(raw, pageUrl)
    if (!href) continue
    if (/\b(?:book|schedule)\b/i.test(text)) return { value: { label: labelCase(text), kind: 'booking', href }, how: 'booking link' }
    if (!form && /\b(?:free (?:quote|estimate)|get a (?:quote|estimate)|request (?:service|a quote|an estimate)|contact us)\b/i.test(text)) {
      form = { label: labelCase(text), kind: 'form', href }
    }
  }
  return form ? { value: form, how: 'quote/contact link' } : null
}

// Vertical ---------------------------------------------------------------

const VERTICALS: Array<[vertical: string, words: RegExp]> = [
  ['plumbing', /plumb/gi],
  ['hvac', /\bhvac\b|air condition|furnace|heat pump/gi],
  ['electrical', /electric/gi],
  ['roofing', /\broof/gi],
]

export function detectVertical(text: string): string | null {
  let best: { vertical: string; count: number } | null = null
  for (const [vertical, words] of VERTICALS) {
    const count = text.match(words)?.length ?? 0
    if (count > 0 && (!best || count > best.count)) best = { vertical, count }
  }
  return best?.vertical ?? null
}

// All of it --------------------------------------------------------------

function found<T>(value: T | null | undefined, how: string): Found<T> | null {
  if (value === null || value === undefined) return null
  if (Array.isArray(value) && value.length === 0) return null
  return { value, how }
}

export function extractSite(site: FetchedSite, now = new Date()): SiteExtract {
  const docs = site.pages.map((p) => cheerio.load(p.html))
  const home = docs[0]
  const pageLines = site.pages.map((p) => visibleLines(p.html))
  const lines = pageLines.flat()
  const text = promptText(pageLines)
  const ld = docs.flatMap(jsonLdNodes)
  const business = businessNode(ld)

  const ldHours = hoursFromSpecifications(ld) ?? hoursFromOpeningHours(ld.map((n) => n.openingHours).flat())
  const hours = ldHours ? { value: ldHours, how: 'JSON-LD openingHours' } : found(hoursFromText(lines), 'page text')
  const reviews = extractReviews(ld)
  const rating = extractRating(ld, business)
  const cta = extractCta(home, site.homeUrl)
  const css = [...docs.map(($) => $('style').text()), ...site.stylesheets.map((s) => s.css)]

  return {
    businessName: extractBusinessName(home, business, site.homeUrl),
    vertical: found(detectVertical(`${tidy(home('title').text())}\n${text}`), 'keyword count'),
    phone: extractPhone(docs, lines),
    hours,
    hoursText: hoursLines(lines),
    hoursNote: extractHoursNote(lines),
    address: extractAddress(business, lines),
    license: extractLicense(lines),
    foundedYear: extractFoundedYear(lines, now),
    reviews: found(reviews, 'JSON-LD Review'),
    rating: found(rating, 'JSON-LD AggregateRating'),
    serviceAreas: found(extractServiceAreas(docs, lines), 'text near "serving" / "service area"'),
    serviceCandidates: serviceCandidates(docs),
    logoUrl: extractLogo(home, site.homeUrl),
    brandColors: found(extractBrandColors(css), 'stylesheet color frequency'),
    cta,
    signals: {
      hasTelLink: docs.some(($) => $('a[href]').toArray().some((el) => /^\s*tel:/i.test($(el).attr('href') ?? ''))),
      hasViewport: home('meta[name="viewport"]').length > 0,
      isHttps: site.homeUrl.startsWith('https:'),
      hasHours: hours !== null,
      hasBooking: cta?.value.kind === 'booking',
    },
    text,
  }
}
