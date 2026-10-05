import presetsJson from './presets.json'

/**
 * Presets — five trade-ready design directions lifted from the taste-vault.
 * `presets.json` is the data (brief text verbatim from the vault's
 * briefFor()); this module types it and maps each visual variant to the
 * preset it renders.
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
  collection: string
  entryId: string
  brief: string
  palette: PresetPalette
  type: PresetType
  heroTreatment: string
  neverList: string[]
}

export const presets: Preset[] = presetsJson as Preset[]

/** Variant slug → preset id. Mirrors the comment block in variants.ts. */
export const VARIANT_PRESET: Record<string, string> = {
  heritage: 'paper-press',
  geospatial: 'dusk-horizon',
  cleanpro: 'classic-light',
  texas: 'ink-split',
  aerial: 'warm-story',
}

export function presetById(id: string): Preset {
  const found = presets.find((p) => p.id === id)
  if (!found) throw new Error(`No preset with id "${id}"`)
  return found
}

export function presetForVariant(slug: string): Preset {
  const id = VARIANT_PRESET[slug]
  if (!id) throw new Error(`Variant "${slug}" has no preset mapping`)
  return presetById(id)
}

/** The text after "Aesthetic:" on the brief's first line, e.g.
 *  "print-tech paper (warm editorial x print DNA)". */
export function aestheticOf(preset: Preset): string {
  const line = preset.brief.split('\n').find((l) => l.startsWith('Aesthetic:'))
  return line ? line.slice('Aesthetic:'.length).trim() : ''
}

/** Four swatches for a picker card: ground, surface, accent, text. */
export function swatchesOf(preset: Preset): string[] {
  const { bg, surface, accent, text } = preset.palette
  return [bg, surface, accent, text]
}
