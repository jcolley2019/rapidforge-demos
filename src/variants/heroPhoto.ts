import { copyFamilyFor } from '../brief/copy'
import { isIntakePhoto } from '../brief/photo-sizes'
import type { SiteContent } from '../brief/site-content'
import { PORTRAIT_STOCK, TRADE_PHOTOS } from '../brief/trade-photos'
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
 * The photo a full-bleed hero (one photo filling the first screen) leads
 * with: the lead's best landscape intake photo at least 1200px wide, else
 * landscape stock, never one of the lead's smaller or portrait photos or a
 * portrait stock shot stretched to fit. Stock is what heroPhotoFor would
 * pick from the brief's non-intake photos (a fixture's stock crew, else the
 * trade heroes), or from the trade family's heroes when the brief's own
 * photos are all intake ones.
 */
export function fullBleedPhotoFor(
  slug: string,
  site: Pick<SiteContent, 'landscapePhoto' | 'photos' | 'crewPhotos' | 'vertical'>,
): string | undefined {
  if (site.landscapePhoto) return site.landscapePhoto
  const wide = (p: string) => !isIntakePhoto(p) && !PORTRAIT_STOCK.has(p)
  const photos = site.photos.filter(wide)
  const stock = TRADE_PHOTOS[copyFamilyFor(site.vertical)].hero.filter(wide)
  return heroPhotoFor(slug, photos.length > 0 ? photos : stock, site.crewPhotos.filter(wide))
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
