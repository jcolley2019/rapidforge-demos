/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { aestheticOf, presetById, presetForVariant, presets, swatchesOf } from './presets'
import { variants } from '../variants/variants'

const HEX = /^#[0-9a-fA-F]{6}$/
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')

interface VaultFamily {
  id: string
  brief: string
  never: string[]
}
const plumbing = JSON.parse(readFileSync(join(root, 'vaults', 'plumbing.json'), 'utf8')) as { families: VaultFamily[] }
const family = (id: string) => plumbing.families.find((f) => f.id === id)!

/** RFD.PRESETS.5: which plumbing family each vault preset is re-derived from. */
const FAMILY_OF: Record<string, string> = {
  'clean-trust': 'F4',
  'bold-local': 'F1',
  'friendly-family': 'F3',
  'modern-minimal': 'F2',
}

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

  it('copies each vault family brief and never-list verbatim from vaults/plumbing.json', () => {
    for (const [id, familyId] of Object.entries(FAMILY_OF)) {
      const p = presetById(id)
      expect(p.collection, id).toBe('rfd-vault:plumbing')
      expect(p.entryId, id).toBe(`plumbing/${familyId}`)
      expect(p.brief, id).toBe(family(familyId).brief)
      expect(p.neverList, id).toEqual(family(familyId).never)
    }
  })

  it('keeps premium-dark on its UI UX Pro Max brief and says it departs on purpose', () => {
    const dark = presetById('premium-dark')
    expect(dark.collection).toBe('ui-ux-pro-max:dark-mode-oled')
    expect(aestheticOf(dark)).toMatch(/^Dark Mode \(OLED\)/)
    expect(dark.palette.bg).toBe('#121212')
    expect(dark.description).toMatch(/on purpose/)
    expect(dark.description).toMatch(/anyone else in town/)
  })

  it('gives every preset a one-line description in plain words', () => {
    for (const p of presets) {
      expect(p.description.length, p.id).toBeGreaterThan(20)
      expect(p.description, p.id).not.toMatch(/\n/)
      expect(p.description, p.id).not.toMatch(/F[1-4]|vault|register|aesthetic/i)
    }
  })

  it('leans modern-minimal commercial and every other preset residential', () => {
    for (const p of presets) expect(p.lean, p.id).toBe(p.id === 'modern-minimal' ? 'commercial' : 'residential')
  })

  it('installs exactly the fonts the presets and the picker name', () => {
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { dependencies: Record<string, string> }
    const installed = Object.keys(pkg.dependencies).filter((d) => d.startsWith('@fontsource')).sort()
    const packageOf = (family: string) => {
      const variable = family.endsWith(' Variable')
      const slug = family.replace(/ Variable$/, '').toLowerCase().replace(/\s+/g, '-')
      return `${variable ? '@fontsource-variable' : '@fontsource'}/${slug}`
    }
    const named = new Set(['Inter Variable', ...presets.flatMap((p) => [p.type.display, p.type.body])])
    expect(installed).toEqual([...named].map(packageOf).sort())
  })
})
