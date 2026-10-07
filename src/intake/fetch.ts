import * as cheerio from 'cheerio'

/**
 * Step 1: the prospect's homepage, up to five same-host pages it links to
 * that look like about / services / contact / reviews / areas pages, and the
 * same-host stylesheets those pages link. Everything stays in memory.
 */

export const USER_AGENT = 'Mozilla/5.0 (compatible; RapidForgeIntake/1.0; RapidForge AI website-demo intake)'
export const FETCH_TIMEOUT_MS = 15_000
export const MAX_LINKED_PAGES = 5
const MAX_STYLESHEETS = 8
/** Which linked pages are worth reading, in the order a slot goes to each. */
const PAGE_HINTS = ['services', 'about', 'reviews', 'areas', 'contact'] as const
const NOT_A_PAGE = /\.(?:pdf|jpe?g|png|gif|webp|svg|zip|docx?|xlsx?|mp4|mp3)$/i
/** Platform CSS (WordPress core and plugins, the Duda/Hibu runtime): shipped defaults, never the business's brand. */
const VENDOR_CSS = /\/wp-includes\/|\/wp-content\/plugins\/|\/_dm\/s\/rt\//i

export type Fetcher = (url: string, init?: RequestInit) => Promise<Response>

export interface FetchedPage {
  url: string
  html: string
}

export interface FetchedSheet {
  url: string
  css: string
}

export interface FetchedSite {
  /** The homepage URL after redirects. */
  homeUrl: string
  /** Homepage first, then the linked pages that answered. */
  pages: FetchedPage[]
  stylesheets: FetchedSheet[]
  /** Pages or stylesheets that could not be fetched, one line each. */
  failures: string[]
}

/** Hostname without a leading "www.", so www.example.com and example.com match. */
export function hostKey(url: string): string {
  return new URL(url).hostname.toLowerCase().replace(/^www\./, '')
}

export function sameHost(a: string, b: string): boolean {
  try {
    return hostKey(a) === hostKey(b)
  } catch {
    return false
  }
}

/** An absolute http(s) URL for `href` on `base`, without its fragment, or null. */
export function absoluteUrl(href: string | undefined, base: string): string | null {
  if (!href) return null
  try {
    const url = new URL(href.trim(), base)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    url.hash = ''
    return url.href
  } catch {
    return null
  }
}

function safeDecode(path: string): string {
  try {
    return decodeURIComponent(path)
  } catch {
    return path
  }
}

function pageKey(url: string): string {
  const u = new URL(url)
  return `${hostKey(url)}${u.pathname.replace(/\/+$/, '') || '/'}`
}

/**
 * Same-host links worth reading, at most `max`: first one link per hint
 * (services, about, reviews, areas, contact) in that order, then any other
 * hinted links in document order. A link qualifies when its path or its
 * text mentions a hint.
 */
export function pickLinkedPages(html: string, pageUrl: string, max = MAX_LINKED_PAGES): string[] {
  const $ = cheerio.load(html)
  const self = pageKey(pageUrl)
  const seen = new Set<string>([self])
  const links: Array<{ url: string; haystack: string }> = []
  $('a[href]').each((_, el) => {
    const url = absoluteUrl($(el).attr('href'), pageUrl)
    if (!url || !sameHost(url, pageUrl)) return
    const { pathname } = new URL(url)
    if (NOT_A_PAGE.test(pathname)) return
    const key = pageKey(url)
    if (seen.has(key)) return
    const haystack = `${safeDecode(pathname)} ${$(el).text()}`.toLowerCase()
    if (!PAGE_HINTS.some((hint) => haystack.includes(hint))) return
    seen.add(key)
    links.push({ url, haystack })
  })

  const picked: string[] = []
  for (const hint of PAGE_HINTS) {
    const link = links.find((l) => l.haystack.includes(hint) && !picked.includes(l.url))
    if (link && picked.length < max) picked.push(link.url)
  }
  for (const link of links) {
    if (picked.length >= max) break
    if (!picked.includes(link.url)) picked.push(link.url)
  }
  return picked
}

/** Same-host stylesheets a page links, minus WordPress core and plugin CSS. */
export function linkedStylesheets(html: string, pageUrl: string): string[] {
  const $ = cheerio.load(html)
  const urls: string[] = []
  $('link[rel~="stylesheet"][href]').each((_, el) => {
    const url = absoluteUrl($(el).attr('href'), pageUrl)
    if (url && sameHost(url, pageUrl) && !VENDOR_CSS.test(url) && !urls.includes(url)) urls.push(url)
  })
  return urls
}

/** GET a text resource with the RapidForge UA and a 15 s timeout. Throws on a non-2xx answer. */
export async function fetchText(
  url: string,
  fetcher: Fetcher = fetch,
): Promise<{ url: string; text: string; contentType: string }> {
  const res = await fetcher(url, {
    headers: { 'user-agent': USER_AGENT, accept: 'text/html,application/xhtml+xml,text/css,*/*;q=0.8' },
    redirect: 'follow',
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return { url: res.url || url, text: await res.text(), contentType: res.headers.get('content-type') ?? '' }
}

function reason(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export async function fetchSite(url: string, fetcher: Fetcher = fetch): Promise<FetchedSite> {
  const home = await fetchText(url, fetcher)
  const homeUrl = home.url
  const failures: string[] = []

  const linked = pickLinkedPages(home.text, homeUrl)
  const settled = await Promise.allSettled(linked.map((u) => fetchText(u, fetcher)))
  const pages: FetchedPage[] = [{ url: homeUrl, html: home.text }]
  settled.forEach((result, i) => {
    if (result.status === 'rejected') failures.push(`${linked[i]}: ${reason(result.reason)}`)
    else if (!/html/i.test(result.value.contentType)) failures.push(`${linked[i]}: not HTML (${result.value.contentType})`)
    else pages.push({ url: result.value.url, html: result.value.text })
  })

  const sheetUrls = [...new Set(pages.flatMap((p) => linkedStylesheets(p.html, p.url)))].slice(0, MAX_STYLESHEETS)
  const sheets = await Promise.allSettled(sheetUrls.map((u) => fetchText(u, fetcher)))
  const stylesheets: FetchedSheet[] = []
  sheets.forEach((result, i) => {
    if (result.status === 'rejected') failures.push(`${sheetUrls[i]}: ${reason(result.reason)}`)
    else stylesheets.push({ url: sheetUrls[i], css: result.value.text })
  })

  return { homeUrl, pages, stylesheets, failures }
}
