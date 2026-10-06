/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// Written by scripts/vault-distill.mjs (npm run vault); committed research data.
const here = dirname(fileURLToPath(import.meta.url))
const VERTICALS = ['plumbing', 'hvac', 'electrical'] as const

interface Vault {
  meta: Record<string, unknown>
  conventions: Record<string, unknown>
  families: { id: string; brief: string }[]
  entries: unknown[]
}

const load = (vertical: string): Vault => JSON.parse(readFileSync(join(here, `${vertical}.json`), 'utf8')) as Vault

describe.each(VERTICALS)('vaults/%s.json', (vertical) => {
  it('parses into {meta, conventions, families, entries}', () => {
    const vault = load(vertical)
    expect(vault.meta).toBeTypeOf('object')
    expect(vault.conventions).toBeTypeOf('object')
    expect(Array.isArray(vault.families)).toBe(true)
    expect(Array.isArray(vault.entries)).toBe(true)
  })

  it('has at least 10 entries', () => {
    expect(load(vertical).entries.length).toBeGreaterThanOrEqual(10)
  })

  it('has at least 4 families', () => {
    expect(load(vertical).families.length).toBeGreaterThanOrEqual(4)
  })

  it('gives every family a brief with Aesthetic and Never lines', () => {
    for (const family of load(vertical).families) {
      expect(family.brief, family.id).toContain('Aesthetic:')
      expect(family.brief, family.id).toContain('Never:')
    }
  })
})
