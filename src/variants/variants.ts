export interface VariantMeta {
  slug: string
  name: string
  description: string
  /** Color swatches shown on the picker card, in display order. */
  palette: string[]
  /** Brick that builds this variant out. */
  brick: string
  /** True once the variant's brick has shipped the full page. */
  complete?: boolean
}

/*
 * RFD.PRESETS.2 — variant → preset mapping (src/presets/presets.json).
 * The slug set is fixed; each slug now renders one taste-vault preset.
 *
 *   heritage   → paper-press    (print-tech paper: warm paper ground, halftone, serif display)
 *   geospatial → dusk-horizon   (vast quiet cinematic: dark teal dusk, mono marginalia, ticker)
 *   cleanpro   → classic-light  (classical remix: white ground, blue accent, serif italic)
 *   texas      → ink-split      (dither mono: stark B&W split screen, giant serif, hard edges)
 *   aerial     → warm-story     (illustrated storybook: pale panel + painted panel, chunky display)
 *
 * Names and descriptions below are the prospect-facing preset name and a
 * line written from the preset's "Aesthetic:" line. Palettes are the
 * preset's bg / surface / accent / text.
 */
export const variants: VariantMeta[] = [
  {
    slug: 'heritage',
    name: 'Paper Press',
    description:
      'Print-tech paper — a warm editorial page with print DNA: cream ground, halftone image, serif headline, one ember accent.',
    palette: ['#F3EADB', '#FBF6EC', '#C15F3C', '#1E1A14'],
    brick: 'RFD.PRESETS.2',
    complete: true,
  },
  {
    slug: 'geospatial',
    name: 'Dusk Horizon',
    description:
      'Vast quiet cinematic — editorial minimalism meets cinema: deep teal dusk, extreme negative space, a quiet ember call to action.',
    palette: ['#0F2A2C', '#163B3D', '#E8743A', '#F2F4F0'],
    brick: 'RFD.PRESETS.2',
    complete: true,
  },
  {
    slug: 'cleanpro',
    name: 'Classic Light',
    description:
      'Classical remix — classical weight with soft-futurist light: white ground, serif italic emphasis, gold and blue accents.',
    palette: ['#FFFFFF', '#F4F6FA', '#2B5BD7', '#1C2230'],
    brick: 'RFD.PRESETS.2',
    complete: true,
  },
  {
    slug: 'texas',
    name: 'Ink Split',
    description:
      'Dither mono — brutalist-editorial black and white: split-screen hero, giant serif headline, a single red mark.',
    palette: ['#FFFFFF', '#F2F2F0', '#D8432F', '#141414'],
    brick: 'RFD.PRESETS.2',
    complete: true,
  },
  {
    slug: 'aerial',
    name: 'Warm Story',
    description:
      'Illustrated storybook — playful cinematic illustration: pale panel, painted scene, chunky deep-green display type.',
    palette: ['#F6EFE4', '#FFFFFF', '#2F5233', '#1E2A22'],
    brick: 'RFD.PRESETS.2',
    complete: true,
  },
]
