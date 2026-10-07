import type { CSSProperties } from 'react'
import { presetForVariant, type Preset, type PresetPalette } from './presets'

/**
 * Each variant's stylesheet declares its colour and font tokens on its root
 * class with the plumbing preset's values baked in (hand-tuned in
 * RFD.PRESETS.5). For any other vertical the same tokens are set inline on
 * the root from that vertical's preset, so the stylesheet never changes and
 * plumbing output stays byte-for-byte what it was. Derived shades (a darker
 * hover, a pale tint, a hairline) are mixed here the way the plumbing ones
 * were picked by hand.
 */

type Rgb = [number, number, number]

function toRgb(hex: string): Rgb {
  const h = hex.replace('#', '')
  return [0, 2, 4].map((i) => Number.parseInt(h.slice(i, i + 2), 16)) as Rgb
}

function toHex([r, g, b]: Rgb): string {
  return `#${[r, g, b].map((c) => Math.round(Math.max(0, Math.min(255, c))).toString(16).padStart(2, '0')).join('')}`
}

/** `amount` of the way from `a` to `b`, in sRGB. */
export function mix(a: string, b: string, amount: number): string {
  const [ar, ag, ab] = toRgb(a)
  const [br, bg, bb] = toRgb(b)
  return toHex([ar + (br - ar) * amount, ag + (bg - ag) * amount, ab + (bb - ab) * amount])
}

const darken = (hex: string, amount: number) => mix(hex, '#000000', amount)
/** "0, 36, 79": the triplet a stylesheet's rgba(var(--x), a) reads. */
const triplet = (hex: string) => toRgb(hex).join(', ')
const lighten = (hex: string, amount: number) => mix(hex, '#ffffff', amount)

const stack = (family: string, serif = false) =>
  serif ? `'${family}', Georgia, serif` : `'${family}', 'Segoe UI', system-ui, sans-serif`

type TokenMap = Record<string, string>

/** Variant slug → the tokens its stylesheet reads, from a preset. */
const TOKENS: Record<string, (p: PresetPalette, t: Preset['type']) => TokenMap> = {
  heritage: (p, t) => ({
    '--pp-navy': p.accent,
    '--pp-navy-2': darken(p.accent, 0.25),
    '--pp-blue': p.accent2,
    // A tint of the brand navy, not of accent2: on hvac accent2 is red and a pink since-line is a third hue.
    '--pp-sky': lighten(p.accent, 0.6),
    '--pp-grade': triplet(darken(p.accent, 0.25)),
    '--pp-grade-2': triplet(p.accent),
    '--pp-ground': p.bg,
    '--pp-mist': p.surface,
    '--pp-text': p.text,
    '--pp-muted': p.muted,
    '--pp-border': mix(p.surface, p.text, 0.12),
    '--pp-font-body': stack(t.body),
    '--pp-font-display': stack(t.display),
    '--bc-bg': p.accent,
    '--bc-border': p.accent,
    '--bc-accent': lighten(p.accent, 0.6),
  }),
  geospatial: (p, t) => ({
    '--dh-red': p.accent,
    '--dh-red-2': darken(p.accent, 0.2),
    '--dh-ink': p.accent2,
    '--dh-ink-2': lighten(p.accent2, 0.04),
    '--dh-text': p.text,
    '--dh-muted': p.muted,
    '--dh-grey': p.surface,
    '--dh-line': mix(p.surface, p.text, 0.1),
    '--dh-font-body': stack(t.body),
    '--dh-font-display': stack(t.display),
    '--bc-bg': p.accent2,
    '--bc-border': p.accent2,
    '--bc-accent': p.accent,
  }),
  texas: (p, t) => ({
    '--is-royal': p.accent,
    '--is-royal-2': darken(p.accent, 0.2),
    '--is-navy': darken(p.accent, 0.6),
    '--is-lime': p.accent2,
    '--is-lime-2': darken(p.accent2, 0.1),
    '--is-grey': p.surface,
    '--is-line': mix(p.surface, p.text, 0.1),
    '--is-text': p.text,
    '--is-muted': p.muted,
    '--is-on-blue': lighten(p.accent, 0.82),
    '--is-font-body': stack(t.body),
    '--is-font-display': stack(t.display),
    // Bebas Neue is a caps-only face at one weight; the other families' condensed or extended sans need both set.
    '--is-display-weight': '700',
    '--is-display-transform': 'uppercase',
    // The headline size was cut for a condensed face; a wider one needs fewer ems to hold the fold.
    '--is-h1-scale': '0.85',
    '--is-h2-scale': '0.85',
    '--is-brand-scale': '0.8',
    '--bc-bg': darken(p.accent, 0.6),
    '--bc-border': darken(p.accent, 0.6),
    '--bc-accent': p.accent2,
  }),
  // Plumbing's accent2 is the concrete grey; for hvac and electrical the
  // family's dark bands are navy, so accent2 is the band colour there and
  // the concrete is mixed from the surface.
  aerial: (p, t) => ({
    '--ws-red': p.accent,
    '--ws-red-2': darken(p.accent, 0.2),
    '--ws-black': p.accent2,
    '--ws-card': lighten(p.accent2, 0.08),
    '--ws-concrete': mix(p.surface, p.text, 0.15),
    '--ws-paper': p.surface,
    '--ws-text': p.text,
    '--ws-muted': p.muted,
    '--ws-font-body': stack(t.body),
    '--ws-font-display': stack(t.display),
    // Rubik at 800 is narrow for a grotesk; the dealer and corporate faces run wider at the same em.
    '--ws-h1-scale': '0.85',
    '--bc-bg': p.accent2,
    '--bc-border': p.accent2,
    '--bc-accent': p.accent,
  }),
  // premium-dark is one object shared by every vertical, so cleanpro never
  // needs an override; the map entry keeps the slug set complete.
  cleanpro: () => ({}),
}

/**
 * Inline style for a variant's root element: the preset's tokens when the
 * vertical renders a preset other than plumbing's, else nothing, so the
 * stylesheet's baked-in plumbing values stand untouched.
 */
export function variantTokens(slug: string, vertical: string): CSSProperties | undefined {
  const preset = presetForVariant(slug, vertical)
  if (preset === presetForVariant(slug, 'plumbing')) return undefined
  const build = TOKENS[slug]
  if (!build) throw new Error(`Variant "${slug}" has no token map`)
  return build(preset.palette, preset.type) as CSSProperties
}
