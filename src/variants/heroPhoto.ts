import { variants } from './variants'

const indexOf = (slug: string) => Math.max(0, variants.findIndex((v) => v.slug === slug))

/**
 * Each variant leads with a different photo: variant index i takes
 * crew[i % crew.length] when the brief has crew photos (owners, crews,
 * branded vans), else photos[i % photos.length], so five directions on the
 * same brief never share a trade hero. Returns undefined only when both
 * sets are empty.
 */
export function heroPhotoFor(slug: string, photos: string[], crew: string[] = []): string | undefined {
  const pool = crew.length > 0 ? crew : photos
  if (pool.length === 0) return undefined
  return pool[indexOf(slug) % pool.length]
}

/**
 * Photos for a variant's service tiles: the trade detail shots first, then
 * the brief's other photos, never the trade photo this variant would lead
 * with, so a tile never repeats a hero. Crew photos never become tiles.
 */
export function tilePhotosFor(slug: string, photos: string[], detail: string[]): string[] {
  const hero = heroPhotoFor(slug, photos)
  return [...new Set([...detail, ...photos.filter((p) => p !== hero)])]
}
