import { siteContent } from '../brief/current'
import { variants } from './variants'

/**
 * Each variant leads with a different photo from the brief's set: variant
 * index i takes photos[i % photos.length], so five directions on the same
 * brief never share a hero. Returns undefined only when the set is empty.
 */
export function heroPhotoFor(slug: string, photos: string[] = siteContent.photos): string | undefined {
  if (photos.length === 0) return undefined
  const i = Math.max(0, variants.findIndex((v) => v.slug === slug))
  return photos[i % photos.length]
}

/**
 * Photos for a variant's service tiles: the trade detail shots first, then
 * the brief's other photos, never the one this variant leads with, so a tile
 * never repeats the hero just above it.
 */
export function tilePhotosFor(
  slug: string,
  photos: string[] = siteContent.photos,
  detail: string[] = siteContent.detailPhotos,
): string[] {
  const hero = heroPhotoFor(slug, photos)
  return [...new Set([...detail, ...photos.filter((p) => p !== hero)])]
}
