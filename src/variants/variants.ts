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
 * RFD.PRESETS.2 mapped each slug to one taste-vault preset
 * (src/presets/presets.json); RFD.PRESETS.2b rewrote the descriptions for a
 * business owner. The slug set is fixed.
 *
 *   heritage   -> paper-press    (warm cream, serif headlines, one orange accent)
 *   geospatial -> dusk-horizon   (dark teal, quiet type, orange button)
 *   cleanpro   -> classic-light  (white, serif headlines, blue accent)
 *   texas      -> ink-split      (black and white, split hero, one red mark)
 *   aerial     -> warm-story     (cream and white, deep green type, terracotta)
 *
 * Palettes are the preset's bg / surface / accent / text.
 */
export const variants: VariantMeta[] = [
  {
    slug: 'heritage',
    name: 'Paper Press',
    description:
      'Warm and established: cream paper tones, classic serif headlines, one orange accent.',
    palette: ['#F3EADB', '#FBF6EC', '#C15F3C', '#1E1A14'],
    brick: 'RFD.PRESETS.2',
    complete: true,
  },
  {
    slug: 'geospatial',
    name: 'Dusk Horizon',
    description:
      'Dark and premium: deep teal background, big photo, lots of breathing room, orange call button.',
    palette: ['#0F2A2C', '#163B3D', '#E8743A', '#F2F4F0'],
    brick: 'RFD.PRESETS.2',
    complete: true,
  },
  {
    slug: 'cleanpro',
    name: 'Classic Light',
    description:
      'Clean and modern: white space, blue accents, serif headlines, easy to scan.',
    palette: ['#FFFFFF', '#F4F6FA', '#2B5BD7', '#1C2230'],
    brick: 'RFD.PRESETS.2',
    complete: true,
  },
  {
    slug: 'texas',
    name: 'Ink Split',
    description:
      'Bold and direct: black and white, hard edges, big headline, one red mark.',
    palette: ['#FFFFFF', '#F2F2F0', '#D8432F', '#141414'],
    brick: 'RFD.PRESETS.2',
    complete: true,
  },
  {
    slug: 'aerial',
    name: 'Warm Story',
    description:
      'Friendly and local: cream and white, chunky green type, warm terracotta touches.',
    palette: ['#F6EFE4', '#FFFFFF', '#2F5233', '#1E2A22'],
    brick: 'RFD.PRESETS.2',
    complete: true,
  },
]
