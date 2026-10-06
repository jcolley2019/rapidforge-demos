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
 * RFD.PRESETS.2c: each slug renders one UI/UX Pro Max direction
 * (src/presets/presets.json). The slug set is fixed.
 *
 *   heritage   -> clean-trust      (pale blue ground, blue and orange, Lexend)
 *   geospatial -> bold-local       (navy blocks, safety orange, condensed Barlow)
 *   cleanpro   -> premium-dark     (black ground, gold accent, Cormorant)
 *   texas      -> friendly-family  (near-white, rounded, family blue and amber)
 *   aerial     -> modern-minimal   (white, hairlines, one blue accent, Outfit)
 *
 * Palettes are the preset's bg / surface / accent / text.
 */
export const variants: VariantMeta[] = [
  {
    slug: 'heritage',
    name: 'Clean Trust',
    description:
      'Clean and modern: pale blue ground, orange call button, easy to scan.',
    palette: ['#EFF6FF', '#FFFFFF', '#1E40AF', '#1E3A8A'],
    brick: 'RFD.PRESETS.2c',
    complete: true,
  },
  {
    slug: 'geospatial',
    name: 'Bold Local',
    description:
      'Bold and direct: big photo, navy blocks, safety-orange call button, condensed headlines.',
    palette: ['#FFFFFF', '#F1F5F9', '#EA580C', '#0F172A'],
    brick: 'RFD.PRESETS.2c',
    complete: true,
  },
  {
    slug: 'cleanpro',
    name: 'Premium Dark',
    description:
      'Premium and calm: dark background, gold call button, elegant serif headlines.',
    palette: ['#121212', '#1C1917', '#CA8A04', '#FAFAF9'],
    brick: 'RFD.PRESETS.2c',
    complete: true,
  },
  {
    slug: 'texas',
    name: 'Friendly Family',
    description:
      'Friendly and local: rounded corners, soft shadows, family blue with an amber call button.',
    palette: ['#F8FAFC', '#FFFFFF', '#2563EB', '#0F172A'],
    brick: 'RFD.PRESETS.2c',
    complete: true,
  },
  {
    slug: 'aerial',
    name: 'Modern Minimal',
    description:
      'Modern and minimal: white space, thin lines, one blue accent, nothing extra.',
    palette: ['#FFFFFF', '#F8FAFC', '#2563EB', '#1E293B'],
    brick: 'RFD.PRESETS.2c',
    complete: true,
  },
]
