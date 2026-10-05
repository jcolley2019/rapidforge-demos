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

export const variants: VariantMeta[] = [
  {
    slug: 'heritage',
    name: 'Heritage',
    description: 'Established, old-guard professionalism — parchment and ink, serif typography, brass rules, 50 years of authority.',
    palette: ['#f7f3ea', '#a67c3d', '#2b2119', '#efe6d3'],
    brick: 'BC.1',
    complete: true,
  },
  {
    slug: 'geospatial',
    name: 'Geospatial',
    description: 'Dark technical instrument — laser-green contours on near-black, monospace data accents, LiDAR-grade aesthetic.',
    palette: ['#0a0f0d', '#3ddc97', '#f5a524', '#0f1714'],
    brick: 'BC.2',
    complete: true,
  },
  {
    slug: 'cleanpro',
    name: 'Clean Pro',
    description: 'Bright, minimal, corporate — generous whitespace, confident blue accents, engineering-firm clarity.',
    palette: ['#ffffff', '#1d6fe0', '#16243d', '#f5f7fa'],
    brick: 'BC.3',
    complete: true,
  },
  {
    slug: 'texas',
    name: 'Texas Modern',
    description: 'Bold construction-industry confidence — charcoal and off-white, safety-orange accent, huge condensed type, hard edges.',
    palette: ['#141414', '#f66b0e', '#f4f1ec', '#6b6963'],
    brick: 'BC.4',
    complete: true,
  },
  {
    slug: 'aerial',
    name: 'Aerial',
    description: 'Cinematic altitude — a drone flight over North Texas at dusk, slate-blue sky, horizon amber, imagery-first calm.',
    palette: ['#131c2b', '#223350', '#e8a552', '#0b1120'],
    brick: 'BC.5',
    complete: true,
  },
]
