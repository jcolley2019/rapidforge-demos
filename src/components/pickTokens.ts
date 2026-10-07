import type { CSSProperties } from 'react'
import { mix } from '../presets/tokens'
import type { Preset } from '../presets/presets'

/**
 * The "I like this one" button and modal sit on five very different pages,
 * so like the "All concepts" chip they take their colours from the preset
 * they belong to: these tokens, set inline from the preset's palette, are
 * all PickModal.css reads.
 */

function luminance(hex: string): number {
  const h = hex.replace('#', '')
  const [r, g, b] = [0, 2, 4].map((i) => Number.parseInt(h.slice(i, i + 2), 16) / 255)
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

const stack = (family: string) => `'${family}', 'Segoe UI', system-ui, sans-serif`

export function pickTokens(preset: Preset): CSSProperties {
  const { bg, surface, text, muted, accent } = preset.palette
  const dark = luminance(bg) < 0.3
  return {
    '--pick-accent': accent,
    '--pick-accent-2': mix(accent, dark ? '#ffffff' : '#000000', 0.14),
    '--pick-on-accent': luminance(accent) > 0.45 ? text : '#ffffff',
    '--pick-bg': surface,
    '--pick-field': dark ? mix(surface, '#ffffff', 0.05) : mix(surface, '#ffffff', 0.5),
    '--pick-text': text,
    '--pick-muted': muted,
    '--pick-line': mix(surface, text, dark ? 0.22 : 0.14),
    '--pick-scrim': dark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(20, 24, 30, 0.55)',
    '--pick-font-body': stack(preset.type.body),
    '--pick-font-display': stack(preset.type.display),
  } as CSSProperties
}
