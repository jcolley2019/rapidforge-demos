import presetsJson from './presets.json'
import { copyFamilyFor } from '../brief/copy'

/**
 * Presets: five trade-ready design directions per vertical. Four come from
 * that trade's taste vault (collection = "rfd-vault:<vertical>", entryId =
 * the family, brief = that family's distilled brief from vaults/<vertical>.json);
 * the fifth, premium-dark, keeps its UI/UX Pro Max direction on purpose and
 * is the same object in every vertical. The five ids are fixed across
 * verticals so VARIANT_PRESET and every variant component keep working; a
 * vertical with no presets of its own renders the plumbing set.
 */

export interface PresetPalette {
  bg: string
  surface: string
  text: string
  muted: string
  accent: string
  accent2: string
}

export interface PresetType {
  display: string
  body: string
  source: 'fontsource' | 'system'
}

export interface Preset {
  id: string
  name: string
  /** One line for the picker card, in a business owner's words. */
  description: string
  /**
   * The register this preset leans to: "commercial" speaks in the jobsite
   * register on a residential brief and takes the full commercial switch
   * on a mixed one (see forLean in site-content.ts).
   */
  lean: 'residential' | 'commercial'
  collection: string
  entryId: string
  brief: string
  palette: PresetPalette
  type: PresetType
  heroTreatment: string
  neverList: string[]
}

/** The verticals with a preset set of their own. */
export type PresetVertical = 'plumbing' | 'hvac' | 'electrical'

export const PRESET_VERTICALS: PresetVertical[] = ['plumbing', 'hvac', 'electrical']

const BY_VERTICAL = presetsJson as Record<PresetVertical, Preset[]>

/** The plumbing set, kept under this name for the code and tests that predate per-vertical presets. */
export const presets: Preset[] = BY_VERTICAL.plumbing

// JSON cannot share an object between arrays, so the shared premium-dark is
// one object again here: every vertical renders plumbing's instance.
const sharedDark = presets.find((p) => p.id === 'premium-dark')!
for (const set of Object.values(BY_VERTICAL)) {
  const i = set.findIndex((p) => p.id === 'premium-dark')
  if (i >= 0) set[i] = sharedDark
}

/**
 * The preset vertical a brief's vertical resolves to: its copy family when
 * that family has presets, else plumbing (so a "roofing" brief still renders).
 */
export function presetVerticalOf(vertical: string): PresetVertical {
  const family = copyFamilyFor(vertical)
  return family in BY_VERTICAL ? (family as PresetVertical) : 'plumbing'
}

export function presetsFor(vertical: string): Preset[] {
  return BY_VERTICAL[presetVerticalOf(vertical)]
}

/** Variant slug → preset id. Mirrors the comment block in variants.ts. */
export const VARIANT_PRESET: Record<string, string> = {
  heritage: 'clean-trust',
  geospatial: 'bold-local',
  cleanpro: 'premium-dark',
  texas: 'friendly-family',
  aerial: 'modern-minimal',
}

export function presetById(id: string, vertical = 'plumbing'): Preset {
  const found = presetsFor(vertical).find((p) => p.id === id)
  if (!found) throw new Error(`No preset with id "${id}" for vertical "${vertical}"`)
  return found
}

export function presetForVariant(slug: string, vertical = 'plumbing'): Preset {
  const id = VARIANT_PRESET[slug]
  if (!id) throw new Error(`Variant "${slug}" has no preset mapping`)
  return presetById(id, vertical)
}

/** The text after "Aesthetic:" on the brief's first line, e.g.
 *  "Flat Design (2D, minimalist, bold colors, ...)". */
export function aestheticOf(preset: Preset): string {
  const line = preset.brief.split('\n').find((l) => l.startsWith('Aesthetic:'))
  return line ? line.slice('Aesthetic:'.length).trim() : ''
}

/** Four swatches for a picker card: ground, surface, accent, text. */
export function swatchesOf(preset: Preset): string[] {
  const { bg, surface, accent, text } = preset.palette
  return [bg, surface, accent, text]
}
