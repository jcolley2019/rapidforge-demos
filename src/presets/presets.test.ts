/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  PRESET_VERTICALS,
  aestheticOf,
  presetById,
  presetForVariant,
  presetVerticalOf,
  presets,
  presetsFor,
  swatchesOf,
} from './presets'
import { variantTokens } from './tokens'
import { variants } from '../variants/variants'

const HEX = /^#[0-9a-fA-F]{6}$/
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')

interface VaultFamily {
  id: string
  brief: string
  never: string[]
}
const vault = (vertical: string) =>
  JSON.parse(readFileSync(join(root, 'vaults', `${vertical}.json`), 'utf8')) as { families: VaultFamily[] }
const family = (vertical: string, id: string) => vault(vertical).families.find((f) => f.id === id)!

const IDS = ['clean-trust', 'bold-local', 'premium-dark', 'friendly-family', 'modern-minimal']

/** Which vault family each vault preset is re-derived from, per vertical (RFD.PRESETS.5, RFD.VERTICALS.7). */
const FAMILY_OF: Record<string, Record<string, string>> = {
  plumbing: { 'clean-trust': 'F4', 'bold-local': 'F1', 'friendly-family': 'F3', 'modern-minimal': 'F2' },
  hvac: { 'clean-trust': 'F1', 'bold-local': 'F3', 'friendly-family': 'F2', 'modern-minimal': 'F4' },
  electrical: { 'clean-trust': 'F2', 'bold-local': 'F3', 'friendly-family': 'F1', 'modern-minimal': 'F4' },
}

describe('presets.json', () => {
  it('keeps `presets` as the plumbing set', () => {
    expect(presets).toBe(presetsFor('plumbing'))
    expect(PRESET_VERTICALS).toEqual(['plumbing', 'hvac', 'electrical'])
  })

  for (const vertical of PRESET_VERTICALS) {
    describe(vertical, () => {
      const set = presetsFor(vertical)

      it('holds exactly the five preset ids, in order', () => {
        expect(set.map((p) => p.id)).toEqual(IDS)
      })

      it('has a valid six-digit hex for every palette slot', () => {
        for (const p of set) {
          for (const [slot, hex] of Object.entries(p.palette)) {
            expect(hex, `${p.id}.palette.${slot}`).toMatch(HEX)
          }
        }
      })

      it('carries a verbatim brief with Aesthetic and Never lines and a non-empty type', () => {
        for (const p of set) {
          expect(p.brief).toContain('Aesthetic:')
          expect(p.brief).toContain('Never:')
          expect(aestheticOf(p).length).toBeGreaterThan(0)
          expect(p.type.display.length).toBeGreaterThan(0)
          expect(p.type.body.length).toBeGreaterThan(0)
        }
      })

      it('fills in a two-word name, a font source, a hero treatment and a never-list', () => {
        for (const p of set) {
          expect(p.name.trim().split(/\s+/)).toHaveLength(2)
          expect(['fontsource', 'system']).toContain(p.type.source)
          expect(p.heroTreatment.length).toBeGreaterThan(0)
          expect(p.neverList.length).toBeGreaterThan(0)
        }
      })

      it('maps every registered variant to a distinct preset with four swatches', () => {
        const seen = new Set<string>()
        for (const v of variants) {
          const p = presetForVariant(v.slug, vertical)
          expect(v.name).toBe(p.name)
          expect(seen.has(p.id)).toBe(false)
          seen.add(p.id)
          expect(swatchesOf(p)).toHaveLength(4)
        }
      })

      it(`copies each vault family brief and never-list verbatim from vaults/${vertical}.json`, () => {
        for (const [id, familyId] of Object.entries(FAMILY_OF[vertical])) {
          const p = presetById(id, vertical)
          expect(p.collection, id).toBe(`rfd-vault:${vertical}`)
          expect(p.entryId, id).toBe(`${vertical}/${familyId}`)
          expect(p.brief, id).toBe(family(vertical, familyId).brief)
          expect(p.neverList, id).toEqual(family(vertical, familyId).never)
        }
      })

      it('gives every preset a one-line description in plain words', () => {
        for (const p of set) {
          expect(p.description.length, p.id).toBeGreaterThan(20)
          expect(p.description, p.id).not.toMatch(/\n/)
          expect(p.description, p.id).not.toMatch(/F[1-4]|vault|register|aesthetic/i)
        }
      })

      it('leans modern-minimal commercial and every other preset residential', () => {
        for (const p of set) expect(p.lean, p.id).toBe(p.id === 'modern-minimal' ? 'commercial' : 'residential')
      })
    })
  }

  it('shares one premium-dark across verticals, on its UI UX Pro Max brief, departing on purpose', () => {
    const dark = presetById('premium-dark')
    for (const vertical of PRESET_VERTICALS) {
      expect(presetById('premium-dark', vertical)).toEqual(dark)
      expect(presetById('premium-dark', vertical)).toBe(dark)
    }
    expect(dark.collection).toBe('ui-ux-pro-max:dark-mode-oled')
    expect(aestheticOf(dark)).toMatch(/^Dark Mode \(OLED\)/)
    expect(dark.palette.bg).toBe('#121212')
    expect(dark.description).toMatch(/on purpose/)
    expect(dark.description).toMatch(/anyone else in town/)
  })

  it('gives hvac and electrical their own vault presets, different from plumbing', () => {
    for (const vertical of ['hvac', 'electrical']) {
      for (const id of Object.keys(FAMILY_OF[vertical])) {
        expect(presetById(id, vertical)).not.toEqual(presetById(id, 'plumbing'))
      }
    }
  })

  it('resolves a vertical through its copy family and falls back to plumbing', () => {
    expect(presetVerticalOf('electrician')).toBe('electrical')
    expect(presetVerticalOf('hvac_contractor')).toBe('hvac')
    expect(presetVerticalOf('plumber')).toBe('plumbing')
    expect(presetVerticalOf('roofing')).toBe('plumbing')
    expect(presetsFor('roofing')).toBe(presets)
    expect(presetForVariant('heritage', 'roofing')).toBe(presetForVariant('heritage'))
    expect(presetForVariant('heritage', 'electrician')).toBe(presetForVariant('heritage', 'electrical'))
  })

  it('installs exactly the fonts the presets and the picker name', () => {
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { dependencies: Record<string, string> }
    const installed = Object.keys(pkg.dependencies).filter((d) => d.startsWith('@fontsource')).sort()
    const packageOf = (family: string) => {
      const variable = family.endsWith(' Variable')
      const slug = family.replace(/ Variable$/, '').toLowerCase().replace(/\s+/g, '-')
      return `${variable ? '@fontsource-variable' : '@fontsource'}/${slug}`
    }
    const all = PRESET_VERTICALS.flatMap((v) => presetsFor(v))
    const named = new Set(['Inter Variable', ...all.flatMap((p) => [p.type.display, p.type.body])])
    expect(installed).toEqual([...new Set([...named].map(packageOf))].sort())
  })
})

describe('variantTokens', () => {
  it('leaves plumbing (and any vertical that falls back to it) on the stylesheet defaults', () => {
    for (const v of variants) {
      expect(variantTokens(v.slug, 'plumbing')).toBeUndefined()
      expect(variantTokens(v.slug, 'roofing')).toBeUndefined()
    }
  })

  it('sets the preset palette and fonts on every vault-driven variant for hvac and electrical', () => {
    for (const vertical of ['hvac', 'electrical']) {
      for (const v of variants) {
        const tokens = variantTokens(v.slug, vertical) as Record<string, string> | undefined
        if (v.slug === 'cleanpro') {
          expect(tokens, vertical).toBeUndefined()
          continue
        }
        const preset = presetForVariant(v.slug, vertical)
        expect(tokens, `${vertical}/${v.slug}`).toBeDefined()
        const values = Object.values(tokens!)
        expect(values).toContain(preset.palette.accent)
        expect(values.some((t) => t.includes(`'${preset.type.display}'`))).toBe(true)
        expect(values.some((t) => t.includes(`'${preset.type.body}'`))).toBe(true)
        for (const [name, value] of Object.entries(tokens!)) {
          expect(name).toMatch(/^--/)
          if (value.startsWith('#')) expect(value, name).toMatch(HEX)
        }
      }
    }
  })
})
