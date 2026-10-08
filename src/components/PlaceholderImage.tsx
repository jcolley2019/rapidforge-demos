import { useState, type CSSProperties } from 'react'
import { photoSrcSet } from '../brief/photo-sizes'
import type { PresetPalette } from '../presets/presets'

export interface PlaceholderImageProps {
  /** Photo to show. When it fails to load the gradient takes over. */
  src?: string
  alt?: string
  /** CSS aspect-ratio for the gradient fallback, e.g. "16 / 9". Defaults to "16 / 9". */
  aspectRatio?: string
  /** Gradient start color. Falls back to palette.surface. */
  gradientFrom?: string
  /** Gradient end color. Falls back to palette.bg. */
  gradientTo?: string
  /** Soft tint color for the highlight. Falls back to palette.accent. */
  lineColor?: string
  /** Highlight opacity, 0–1. */
  lineOpacity?: number
  /** Optional label rendered in the corner of the fallback. */
  label?: string
  /** Label text color. Any CSS color string. */
  labelColor?: string
  /** Seed to shift the highlight between instances. */
  seed?: number
  /** Preset palette; supplies any color not given explicitly. */
  palette?: PresetPalette
  className?: string
  loading?: 'eager' | 'lazy'
  /** How wide the slot renders (see PHOTO_SIZES); used when the photo comes in several sizes. */
  sizes?: string
}

/**
 * A photo with a quiet gradient behind it. Renders the `<img>` when `src` is
 * given and swaps to the gradient only if the image errors, so a dead URL
 * never leaves a broken-image glyph on the page. Without `src` it is the
 * gradient alone. A photo that comes in several sizes (an intake photo or
 * the Unsplash stock) gets a srcset, so a phone or a tile loads the 800 or
 * 1200 copy instead of the 1600.
 */
export default function PlaceholderImage({
  src,
  alt = '',
  aspectRatio = '16 / 9',
  gradientFrom,
  gradientTo,
  lineColor,
  lineOpacity = 0.35,
  label,
  labelColor,
  seed = 1,
  palette,
  className = '',
  loading,
  sizes,
}: PlaceholderImageProps) {
  const [failed, setFailed] = useState(false)

  if (src && !failed) {
    const srcSet = photoSrcSet(src)
    return (
      <img
        src={src}
        srcSet={srcSet}
        sizes={srcSet ? sizes : undefined}
        alt={alt}
        className={className}
        loading={loading}
        onError={() => setFailed(true)}
      />
    )
  }

  const from = gradientFrom ?? palette?.surface ?? '#e9e9e6'
  const to = gradientTo ?? palette?.bg ?? '#d6d6d2'
  const tint = lineColor ?? palette?.accent ?? '#999999'
  const text = labelColor ?? palette?.muted ?? tint

  // The seed moves the highlight so neighbouring placeholders differ.
  const fx = 22 + ((seed * 37) % 56)
  const fy = 18 + ((seed * 53) % 50)
  const pct = Math.round(Math.max(0, Math.min(1, lineOpacity)) * 100)

  const style: CSSProperties = {
    aspectRatio,
    backgroundColor: to,
    backgroundImage: [
      `radial-gradient(60% 55% at ${fx}% ${fy}%, color-mix(in srgb, ${tint} ${pct}%, transparent) 0%, transparent 70%)`,
      `linear-gradient(160deg, ${from} 0%, ${to} 100%)`,
    ].join(', '),
  }

  const name = label || alt
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={style}
      {...(name ? { role: 'img', 'aria-label': name } : { 'aria-hidden': true })}
    >
      {label && (
        <span
          className="absolute right-3 bottom-2 text-xs tracking-wide opacity-70"
          style={{ color: text }}
        >
          {label}
        </span>
      )}
    </div>
  )
}
