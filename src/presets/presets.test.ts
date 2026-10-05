import { describe, expect, it } from 'vitest'
import { aestheticOf, presetForVariant, presets, swatchesOf } from './presets'
import { variants } from '../variants/variants'

const HEX = /^#[0-9a-fA-F]{6}$/

describe('presets.json', () => {
  it('holds exactly five presets', () => {
    expect(presets).toHaveLength(5)
  })

  it('has unique kebab-case ids', () => {
    const ids = presets.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  })

  it('has a valid six-digit hex for every palette slot', () => {
    for (const p of presets) {
      for (const [slot, hex] of Object.entries(p.palette)) {
        expect(hex, `${p.id}.palette.${slot}`).toMatch(HEX)
      }
    }
  })

  it('carries a verbatim brief with Aesthetic and Never lines', () => {
    for (const p of presets) {
      expect(p.brief).toContain('Aesthetic:')
      expect(p.brief).toContain('Never:')
      expect(aestheticOf(p).length).toBeGreaterThan(0)
    }
  })

  it('fills in a two-word name, a font source, a hero treatment and a never-list', () => {
    for (const p of presets) {
      expect(p.name.trim().split(/\s+/)).toHaveLength(2)
      expect(['fontsource', 'system']).toContain(p.type.source)
      expect(p.heroTreatment.length).toBeGreaterThan(0)
      expect(p.neverList.length).toBeGreaterThan(0)
    }
  })

  it('maps every registered variant to a distinct preset with four swatches', () => {
    const seen = new Set<string>()
    for (const v of variants) {
      const p = presetForVariant(v.slug)
      expect(v.name).toBe(p.name)
      expect(seen.has(p.id)).toBe(false)
      seen.add(p.id)
      expect(swatchesOf(p)).toHaveLength(4)
    }
  })
})
