import type { CSSProperties } from 'react'
import type { PresetPalette } from '../presets/presets'

export interface PlaceholderImageProps {
  /** CSS aspect-ratio value, e.g. "16 / 9", "4 / 3", "1 / 1". Defaults to "16 / 9". */
  aspectRatio?: string
  /** Gradient start color. Falls back to palette.surface. */
  gradientFrom?: string
  /** Gradient end color. Falls back to palette.bg. */
  gradientTo?: string
  /** Soft tint color for the highlight. Falls back to palette.accent. */
  lineColor?: string
  /** Highlight opacity, 0–1. */
  lineOpacity?: number
  /** Optional label rendered in the corner (e.g. "Site photo coming soon"). */
  label?: string
  /** Label text color. Any CSS color string. */
  labelColor?: string
  /** Seed to shift the highlight between instances. */
  seed?: number
  /** Preset palette; supplies any color not given explicitly. */
  palette?: PresetPalette
  className?: string
}

/**
 * Neutral soft-gradient block that holds an image slot open. Takes its
 * colors from a preset palette (or explicit overrides) and draws nothing
 * figurative — a quiet wash with one soft highlight.
 */
export default function PlaceholderImage({
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
}: PlaceholderImageProps) {
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

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={style}
      role="img"
      aria-label={label ?? 'Placeholder image'}
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
