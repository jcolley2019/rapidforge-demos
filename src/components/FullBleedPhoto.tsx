import { preload } from 'react-dom'
import { PHOTO_SIZES, photoSrcSet } from '../brief/photo-sizes'
import type { PresetPalette } from '../presets/presets'
import PlaceholderImage from './PlaceholderImage'

/**
 * The photo behind a full-bleed hero, the page's largest paint: preloaded
 * at high priority with the same srcset and sizes the <img> asks for, so
 * the browser fetches one copy once, and loaded eagerly. Until it lands the
 * hero's own solid background shows; there is no blur-up.
 */
export default function FullBleedPhoto({
  src,
  palette,
  className,
}: {
  src?: string
  palette: PresetPalette
  className: string
}) {
  if (src) {
    const srcSet = photoSrcSet(src)
    preload(src, {
      as: 'image',
      fetchPriority: 'high',
      ...(srcSet ? { imageSrcSet: srcSet, imageSizes: PHOTO_SIZES.fullBleed } : {}),
    })
  }
  return (
    <PlaceholderImage
      src={src}
      palette={palette}
      aspectRatio="auto"
      className={className}
      sizes={PHOTO_SIZES.fullBleed}
      loading="eager"
      fetchPriority="high"
    />
  )
}
