/**
 * The widths a page offers the browser for each photo. Intake writes every
 * site photo as photos/01.jpg, at most 1600px on the long edge, plus
 * photos/01-800.jpg and photos/01-1200.jpg, at most 800 and 1200px wide
 * and never wider than the 1600 one. The trade stock asks Unsplash for the
 * same widths through its w= parameter.
 */
export const PHOTO_WIDTHS = [800, 1200, 1600] as const

/** The cap the plain file name carries. */
export const FULL_PHOTO_WIDTH = 1600

/** "photos/01.jpg" at 800 is "photos/01-800.jpg"; the full width keeps the plain name. */
export function sizedPhotoName(file: string, width: number): string {
  return width === FULL_PHOTO_WIDTH ? file : file.replace(/\.jpg$/, `-${width}.jpg`)
}

/** A photo intake wrote, once the app brief has rebased it under /leads/<slug>/. */
const INTAKE_PHOTO = /^\/leads\/[a-z0-9-]+\/photos\/\d+\.jpg$/
const UNSPLASH = /^https:\/\/images\.unsplash\.com\//

/**
 * The srcset for a photo, or undefined when it comes in one size only: an
 * intake photo lists its three files, an Unsplash photo the same widths by
 * w=. Any other URL (a brief's own remote photo) gets none.
 */
export function photoSrcSet(src: string): string | undefined {
  if (INTAKE_PHOTO.test(src)) return PHOTO_WIDTHS.map((w) => `${sizedPhotoName(src, w)} ${w}w`).join(', ')
  if (UNSPLASH.test(src)) {
    return PHOTO_WIDTHS.map((w) => {
      const url = new URL(src)
      url.searchParams.set('w', String(w))
      return `${url.href} ${w}w`
    }).join(', ')
  }
  return undefined
}

/**
 * `sizes` for the slots photos fill, from the variants' CSS: heroes that
 * bleed edge to edge, a hero photo that takes the right half on a laptop,
 * Premium Dark's framed hero panel, and the service tiles (three across
 * inside a ~76rem wrap, two from 640px, one on a phone).
 */
export const PHOTO_SIZES = {
  fullBleed: '100vw',
  halfHero: '(min-width: 1024px) 50vw, 100vw',
  heroPanel: '(min-width: 1024px) 36rem, 100vw',
  tile: '(min-width: 1024px) 26rem, (min-width: 640px) 50vw, 100vw',
} as const
