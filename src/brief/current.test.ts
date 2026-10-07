import { describe, expect, it } from 'vitest'
import { briefRegistry, resolveBriefName, resolveStem, siteContentFor } from './current'

const globbed = {
  './fixtures/acme-plumbing.json': { default: { business_name: 'Acme' } },
  './fixtures/acme-hvac.json': { default: { business_name: 'Acme HVAC' } },
}

describe('briefRegistry', () => {
  it('keys globbed fixtures by stem and carries no lead when none was built', () => {
    const registry = briefRegistry(globbed, null)
    expect([...registry.keys()].sort()).toEqual(['acme-hvac', 'acme-plumbing'])
    expect(registry.has('lead-goodson')).toBe(false)
  })

  it('adds exactly the built lead', () => {
    const registry = briefRegistry(globbed, { stem: 'lead-goodson', brief: { business_name: 'Goodson' } })
    expect(registry.get('lead-goodson')).toEqual({ business_name: 'Goodson' })
    expect(registry.size).toBe(3)
  })
})

describe('resolveStem', () => {
  const registry = briefRegistry(globbed, { stem: 'lead-goodson', brief: {} })

  it('resolves a fixture it has, including the built lead', () => {
    expect(resolveStem(registry, 'acme-hvac', 'acme-plumbing')).toBe('acme-hvac')
    expect(resolveStem(registry, ' lead-goodson ', 'acme-plumbing')).toBe('lead-goodson')
  })

  it('falls back for any other lead, a blank, or nothing', () => {
    expect(resolveStem(registry, 'lead-other', 'acme-plumbing')).toBe('acme-plumbing')
    expect(resolveStem(registry, '', 'acme-plumbing')).toBe('acme-plumbing')
    expect(resolveStem(registry, null, 'acme-plumbing')).toBe('acme-plumbing')
  })
})

describe('this build (no VITE_BRIEF)', () => {
  it('still resolves the Acme and sparse fixtures', () => {
    for (const stem of ['acme-plumbing', 'acme-commercial', 'acme-hvac', 'acme-electric', 'sparse-electric']) {
      expect(siteContentFor(stem)?.name, stem).toBeTruthy()
    }
  })

  it('carries no lead, so ?brief=lead-x falls back to the default', () => {
    expect(siteContentFor('lead-robgoodsonplumbing-com')).toBeNull()
    expect(resolveBriefName('lead-robgoodsonplumbing-com')).toBe('acme-plumbing')
  })
})
