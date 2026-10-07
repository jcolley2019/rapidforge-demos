import { createHash } from 'node:crypto'
import * as cheerio from 'cheerio'
import sharp from 'sharp'
import { imageSource } from './extract'
import { FETCH_TIMEOUT_MS, USER_AGENT, absoluteUrl, hostKey, type FetchedPage, type Fetcher } from './fetch'

/**
 * Step 3: the site's own photos. Collect <img> and og:image URLs on the
 * site's host or an image CDN, drop svg/gif/icons, dedupe, download up to
 * 20, keep those at least 600px on the long edge, and re-encode each as a
 * JPEG no larger than 1600px.
 */

export const MAX_DOWNLOADS = 20
export const MIN_LONG_EDGE = 600
export const MAX_LONG_EDGE = 1600
const JPEG_QUALITY = 82

const NOT_A_PHOTO_EXT = /\.(?:svg|gif|ico)$/i
const NOT_A_PHOTO_WORD = /icon|favicon|sprite|logo|badge|placeholder|spinner|loader|pixel|emoji/i
/** Image hosts a small-business site serves its own photos from. */
const IMAGE_CDN =
  /(?:^|\.)(?:cloudfront\.net|wp\.com|squarespace-cdn\.com|wixstatic\.com|cloudinary\.com|imgix\.net|amazonaws\.com|googleusercontent\.com|shopify\.com|ctfassets\.net|website-files\.com|hubspotusercontent[\w-]*\.net|b-cdn\.net|wpenginepowered\.com|kinstacdn\.com|filesusr\.com|smushcdn\.com|ewp\.cloud|optimole\.com)$/

export interface PhotoCandidate {
  url: string
  buffer: Buffer
}

export interface KeptPhoto {
  /** Where the photo came from on the prospect's site. */
  url: string
  jpeg: Buffer
  width: number
  height: number
}

export function isSameHostOrCdn(url: string, siteUrl: string): boolean {
  try {
    const host = hostKey(url)
    const site = hostKey(siteUrl)
    return host === site || host.endsWith(`.${site}`) || IMAGE_CDN.test(host) || /(?:^|[.-])cdn[.-]/.test(host)
  } catch {
    return false
  }
}

const CSS_URL = /url\(\s*['"]?([^'")]+)['"]?\s*\)/gi

/** url(...) targets in a CSS text, e.g. a hero section's background-image. */
function cssUrls(css: string): string[] {
  return [...css.matchAll(CSS_URL)].map((m) => m[1].trim()).filter((u) => !u.startsWith('data:'))
}

/**
 * Photo URLs in document order, homepage first: each <img>'s largest
 * source and each element's background image (style attribute or
 * data-background-image), then background images set in the page's own
 * <style> blocks, then og:image. Site builders often set the hero photo as
 * a CSS background, so <img> alone misses the best photo on the page.
 */
export function collectPhotoUrls(pages: FetchedPage[], siteUrl: string): string[] {
  const urls: string[] = []
  const seen = new Set<string>()
  const add = (raw: string | undefined, base: string, context = '') => {
    const url = absoluteUrl(raw, base)
    if (!url || seen.has(url) || !isSameHostOrCdn(url, siteUrl)) return
    const { pathname } = new URL(url)
    if (NOT_A_PHOTO_EXT.test(pathname) || NOT_A_PHOTO_WORD.test(`${pathname} ${context}`)) return
    seen.add(url)
    urls.push(url)
  }
  for (const page of pages) {
    const $ = cheerio.load(page.html)
    $('img, [style*="url("], [data-background-image], [data-bg]').each((_, el) => {
      const get = (name: string) => $(el).attr(name)
      const context = `${get('class') ?? ''} ${get('alt') ?? ''}`
      if (el.tagName === 'img') {
        // Declared sizes under 100px are icons whatever the file is called.
        const declared = Math.max(Number(get('width')) || 0, Number(get('height')) || 0)
        if (declared > 0 && declared < 100) return
        add(imageSource(get, true), page.url, context)
        return
      }
      for (const url of [get('data-background-image'), get('data-bg'), ...cssUrls(get('style') ?? '')]) add(url, page.url, context)
    })
    for (const url of cssUrls($('style').text())) add(url, page.url)
    add($('meta[property="og:image"], meta[name="og:image"]').first().attr('content'), page.url)
  }
  return urls
}

/** A Bearer token for one origin, e.g. the leads worker's photo route. */
export interface OriginBearer {
  origin: string
  token: string
}

/** The Authorization header for `url`: only when it is on the bearer's origin, never for any other host. */
export function authHeaderFor(url: string, bearer?: OriginBearer): Record<string, string> {
  if (!bearer) return {}
  try {
    return new URL(url).origin === bearer.origin ? { authorization: `Bearer ${bearer.token}` } : {}
  } catch {
    return {}
  }
}

/**
 * Downloads at most `MAX_DOWNLOADS` images, five at a time; failures are
 * reported, not thrown. With `bearer`, URLs on its origin carry its token.
 */
export async function downloadImages(
  urls: string[],
  fetcher: Fetcher = fetch,
  bearer?: OriginBearer,
): Promise<{ candidates: PhotoCandidate[]; failures: string[] }> {
  const queue = urls.slice(0, MAX_DOWNLOADS)
  const results: Array<PhotoCandidate | null> = new Array(queue.length).fill(null)
  const failures: string[] = []
  let next = 0
  const worker = async () => {
    while (next < queue.length) {
      const i = next++
      try {
        const res = await fetcher(queue[i], {
          headers: { 'user-agent': USER_AGENT, accept: 'image/*', ...authHeaderFor(queue[i], bearer) },
          signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const type = res.headers.get('content-type') ?? ''
        if (/svg|gif|text\/html/i.test(type)) throw new Error(`skipped ${type}`)
        results[i] = { url: queue[i], buffer: Buffer.from(await res.arrayBuffer()) }
      } catch (error) {
        failures.push(`${queue[i]}: ${error instanceof Error ? error.message : String(error)}`)
      }
    }
  }
  await Promise.all(Array.from({ length: 5 }, worker))
  return { candidates: results.filter((r): r is PhotoCandidate => r !== null), failures }
}

/**
 * The candidates worth keeping, in order: deduped by URL and by identical
 * bytes, svg/gif dropped, at least 600px on the long edge, each re-encoded
 * as a JPEG at most 1600px on the long edge. Unreadable files are dropped.
 */
export async function selectPhotos(candidates: PhotoCandidate[]): Promise<KeptPhoto[]> {
  const kept: KeptPhoto[] = []
  const seenUrls = new Set<string>()
  const seenBytes = new Set<string>()
  for (const { url, buffer } of candidates) {
    const digest = createHash('sha1').update(buffer).digest('hex')
    if (seenUrls.has(url) || seenBytes.has(digest)) continue
    seenUrls.add(url)
    seenBytes.add(digest)
    try {
      const meta = await sharp(buffer).metadata()
      if (meta.format === 'svg' || meta.format === 'gif') continue
      if (Math.max(meta.width ?? 0, meta.height ?? 0) < MIN_LONG_EDGE) continue
      const { data, info } = await sharp(buffer)
        .rotate()
        .resize({ width: MAX_LONG_EDGE, height: MAX_LONG_EDGE, fit: 'inside', withoutEnlargement: true })
        .flatten({ background: '#ffffff' })
        .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
        .toBuffer({ resolveWithObject: true })
      kept.push({ url, jpeg: data, width: info.width, height: info.height })
    } catch {
      // Not an image sharp can read; skip it.
    }
  }
  return kept
}
