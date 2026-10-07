import { z } from 'zod/v4'
import { VISION_TIER, describeError, formatFor, parseStructured, type AiClient } from './ai'

/**
 * Step 4: one ai-core vision call per kept photo, tagging what it shows and
 * how well it would hold up large, except photos whose URL already names a
 * stock vendor; then the deterministic mapping from tags to the brief's
 * photo_urls and crew_photo_urls.
 */

export const PHOTO_KINDS = ['building', 'crew', 'van', 'job', 'logo', 'stock', 'other'] as const
export type PhotoKind = (typeof PHOTO_KINDS)[number]

export interface PhotoTag {
  kind: PhotoKind
  /** 1–5. */
  quality: number
  note: string
}

const PhotoTagWire = z.object({
  kind: z.enum(PHOTO_KINDS),
  quality: z.number(),
  note: z.string(),
})

const VISION_SYSTEM = `You tag photos taken from a local contractor's website, for a redesign of that site.
kind:
- building: the company's own shop, office or storefront
- crew: people who work for the company (owners, technicians, team shots)
- van: the company's branded trucks or vans
- job: real work in progress or finished work (installs, repairs, equipment, job sites)
- logo: a logo, badge, award seal or a graphic that is mostly text
- stock: obviously generic stock imagery (posed models, staged scenes, generic tools or homes with nothing tying them to this company)
- other: anything else
quality: 1 to 5, how well it would work as a large photo on a professional site (sharpness, light, composition); 1 is unusable.
note: under 15 words, what the photo shows.`

/**
 * Stock-library names anywhere in a photo's URL or filename. Substrings,
 * because site builders prefix them (hibu serves "RSshutterstock_1148345093-1920w.jpg");
 * "canva" spares "canvas".
 */
const STOCK_VENDOR =
  /shutterstock|istock|gettyimages|adobestock|stock\.adobe|depositphotos|dreamstime|123rf|alamy|pexels|unsplash|pixabay|freepik|canva(?!s)/i
/** A bare "stock" path segment, e.g. /images/stock/kitchen.jpg. */
const STOCK_SEGMENT = /(?:^|\/)stock(?:\/|$)/i

/** The stock vendor a photo's URL names, "stock" for a bare /stock/ segment, or null. */
export function stockVendor(url: string): string | null {
  const vendor = STOCK_VENDOR.exec(url)
  if (vendor) return vendor[0].toLowerCase()
  let path = url
  try {
    path = new URL(url).pathname
  } catch {
    // A bare filename or path; test it as given.
  }
  return STOCK_SEGMENT.test(path) ? 'stock' : null
}

/** Tags one JPEG. Throws when the call or its JSON fails; `tagPhotos` turns that into an untagged result. */
export async function tagPhoto(client: AiClient, jpeg: Buffer): Promise<{ tag: PhotoTag; model: string }> {
  const res = await client.complete({
    provider: 'anthropic',
    tier: VISION_TIER,
    maxTokens: 400,
    temperature: 0,
    timeoutMs: 60_000,
    messages: [
      { role: 'system', content: VISION_SYSTEM },
      {
        role: 'user',
        content: [
          { type: 'image', mediaType: 'image/jpeg', data: jpeg.toString('base64') },
          { type: 'text', text: 'Tag this photo.' },
        ],
      },
    ],
    outputConfig: { format: formatFor(PhotoTagWire, 'photo_tag') },
  })
  const wire = parseStructured(res, PhotoTagWire)
  const quality = Math.min(5, Math.max(1, Math.round(wire.quality) || 1))
  return { tag: { kind: wire.kind, quality, note: wire.note.trim().slice(0, 140) }, model: res.model }
}

export interface Tagged<T> {
  item: T
  tag: PhotoTag
  /** Why tagging failed, when it did; the photo then counts as "other", quality 1. */
  error?: string
  /** The stock vendor its URL names, when it did; the photo then counts as "stock", quality 1, with no vision call. */
  vendor?: string
}

/**
 * Tags every photo, three calls at a time. A photo whose URL names a stock
 * vendor is tagged stock without a call. A failed call never fails the run.
 */
export async function tagPhotos<T extends { url: string; jpeg: Buffer }>(
  client: AiClient,
  photos: T[],
): Promise<{ tagged: Tagged<T>[]; model: string | null }> {
  const tagged: Array<Tagged<T>> = new Array(photos.length)
  let model: string | null = null
  let next = 0
  const worker = async () => {
    while (next < photos.length) {
      const i = next++
      const vendor = stockVendor(photos[i].url)
      if (vendor) {
        // Unrated, so it tops up after any stock or other photo vision rated.
        tagged[i] = { item: photos[i], tag: { kind: 'stock', quality: 1, note: 'vendor URL' }, vendor }
        continue
      }
      try {
        const result = await tagPhoto(client, photos[i].jpeg)
        model ??= result.model
        tagged[i] = { item: photos[i], tag: result.tag }
      } catch (error) {
        const reason = describeError(error)
        tagged[i] = { item: photos[i], tag: { kind: 'other', quality: 1, note: 'untagged' }, error: reason }
      }
    }
  }
  await Promise.all(Array.from({ length: 3 }, worker))
  return { tagged, model }
}

export const MAX_PHOTOS = 8
export const MAX_CREW_PHOTOS = 4
/** Below this many real photos, stock/other photos top the set up to it. */
export const MIN_REAL_PHOTOS = 3

const REAL: ReadonlySet<PhotoKind> = new Set(['building', 'crew', 'van', 'job'])

/** Highest quality first; equal quality keeps site order. */
function byQuality<T extends { tag: PhotoTag }>(list: T[]): T[] {
  return list
    .map((entry, i) => ({ entry, i }))
    .sort((a, b) => b.entry.tag.quality - a.entry.tag.quality || a.i - b.i)
    .map(({ entry }) => entry)
}

export interface PhotoPlan<T> {
  /** building/job, best first, max 8; topped up with stock/other when the site has too few real photos. */
  photos: T[]
  /** crew/van, best first, max 4. */
  crew: T[]
  /** The stock/other photos used to top up, if any; the intake report flags them. */
  fallback: T[]
}

/**
 * crew/van → crew (max 4); building/job → photos (max 8), best first.
 * Stock and other are used only when the site has fewer than three real
 * photos, and then only to bring the total to three. Logos never are.
 */
export function mapTaggedPhotos<T extends { tag: PhotoTag }>(tagged: T[]): PhotoPlan<T> {
  const crew = byQuality(tagged.filter((t) => t.tag.kind === 'crew' || t.tag.kind === 'van')).slice(0, MAX_CREW_PHOTOS)
  const photos = byQuality(tagged.filter((t) => t.tag.kind === 'building' || t.tag.kind === 'job')).slice(0, MAX_PHOTOS)
  const realCount = tagged.filter((t) => REAL.has(t.tag.kind)).length
  const fallback =
    realCount < MIN_REAL_PHOTOS
      ? byQuality(tagged.filter((t) => t.tag.kind === 'stock' || t.tag.kind === 'other')).slice(0, MIN_REAL_PHOTOS - realCount)
      : []
  return { photos: [...photos, ...fallback].slice(0, MAX_PHOTOS), crew, fallback }
}
