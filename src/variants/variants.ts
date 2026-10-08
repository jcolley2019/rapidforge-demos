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
      'Established and trustworthy: navy and blue, with your license and awards out front.',
    palette: ['#EFF6FF', '#FFFFFF', '#1E40AF', '#1E3A8A'],
    brick: 'RFD.PRESETS.2c',
    complete: true,
  },
  {
    slug: 'geospatial',
    name: 'Bold Local',
    description:
      'Bold and local: your crew in a big photo, one strong red, and your ratings right on it.',
    palette: ['#FFFFFF', '#F1F5F9', '#EA580C', '#0F172A'],
    brick: 'RFD.PRESETS.2c',
    complete: true,
  },
  {
    slug: 'cleanpro',
    name: 'Premium Dark',
    description:
      'Dark and gold on purpose: none of the 36 contractor sites we studied looks like this, so you will not look like anyone else in town.',
    palette: ['#121212', '#1C1917', '#CA8A04', '#FAFAF9'],
    brick: 'RFD.PRESETS.2c',
    complete: true,
  },
  {
    slug: 'texas',
    name: 'Friendly Family',
    description:
      'Family-owned and friendly: your crew up front, royal blue panels, and coupons right under the photo.',
    palette: ['#F8FAFC', '#FFFFFF', '#2563EB', '#0F172A'],
    brick: 'RFD.PRESETS.2c',
    complete: true,
  },
  {
    slug: 'aerial',
    name: 'Modern Minimal',
    description:
      'Built for the job site: heavy type, black and red, and copy that talks spec and schedule.',
    palette: ['#FFFFFF', '#F8FAFC', '#2563EB', '#1E293B'],
    brick: 'RFD.PRESETS.2c',
    complete: true,
  },
]
