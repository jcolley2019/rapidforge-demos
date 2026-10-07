// @vitest-environment node
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  aliasFor,
  buildEnv,
  deploymentUrlFrom,
  isDnsLabel,
  leakTerms,
  otherLeads,
  parseDeployArgs,
  pruneOtherLeads,
  scanForLeaks,
} from './deploy'

describe('slug and --as validation', () => {
  it('accepts DNS labels', () => {
    for (const ok of ['goodson', 'robgoodsonplumbing-com', 'a', 'x1-2y', 'a'.repeat(40)]) {
      expect(isDnsLabel(ok), ok).toBe(true)
    }
  })

  it('rejects anything else', () => {
    for (const bad of ['', 'Goodson', 'good son', 'good.son', '-goodson', 'goodson-', 'a'.repeat(41), 'goodson/x']) {
      expect(isDnsLabel(bad), JSON.stringify(bad)).toBe(false)
    }
  })

  it('uses the slug as the subdomain unless --as overrides it', () => {
    expect(parseDeployArgs({ slug: 'robgoodsonplumbing-com' })).toEqual({ slug: 'robgoodsonplumbing-com', sub: 'robgoodsonplumbing-com' })
    expect(parseDeployArgs({ slug: 'robgoodsonplumbing-com', as: 'goodson' })).toEqual({ slug: 'robgoodsonplumbing-com', sub: 'goodson' })
    expect(aliasFor('goodson')).toBe('goodson.demos.rapidforge.ai')
  })

  it('refuses a missing or malformed slug or --as', () => {
    expect(() => parseDeployArgs({})).toThrow(/--slug is required/)
    expect(() => parseDeployArgs({ slug: 'Rob Goodson' })).toThrow(/--slug/)
    expect(() => parseDeployArgs({ slug: 'goodson', as: 'Goodson.Plumbing' })).toThrow(/--as/)
  })
})

describe('build env', () => {
  it('passes VITE_BRIEF=lead-<slug> on top of the parent env', () => {
    const env = buildEnv({ PATH: '/usr/bin', VITE_BRIEF: 'acme-plumbing' }, 'goodson')
    expect(env.VITE_BRIEF).toBe('lead-goodson')
    expect(env.PATH).toBe('/usr/bin')
  })
})

describe('isolation', () => {
  let root: string
  afterEach(() => rmSync(root, { recursive: true, force: true }))

  function lead(slug: string, businessName: string) {
    mkdirSync(join(root, 'leads', slug), { recursive: true })
    writeFileSync(join(root, 'leads', slug, 'brief.json'), JSON.stringify({ business_name: businessName }))
  }

  it('lists every other lead and its search terms', () => {
    root = mkdtempSync(join(tmpdir(), 'rfd-deploy-'))
    lead('goodson', 'Goodson Plumbing Services')
    lead('other-co', 'Other Co Plumbing')
    lead('third', 'Third Trade')
    const others = otherLeads(root, 'goodson')
    expect(others.map((l) => l.slug).sort()).toEqual(['other-co', 'third'])
    expect(leakTerms(others).sort()).toEqual(['Other Co Plumbing', 'Third Trade', 'other-co', 'third'].sort())
  })

  it('prunes every other lead folder from the static output', () => {
    root = mkdtempSync(join(tmpdir(), 'rfd-deploy-'))
    const staticDir = join(root, '.vercel', 'output', 'static')
    for (const s of ['goodson', 'other-co']) {
      mkdirSync(join(staticDir, 'leads', s, 'photos'), { recursive: true })
      writeFileSync(join(staticDir, 'leads', s, 'photos', '01.jpg'), 'x')
    }
    expect(pruneOtherLeads(staticDir, 'goodson')).toEqual(['other-co'])
    expect(scanForLeaks(staticDir, ['other-co'])).toEqual([])
    expect(scanForLeaks(staticDir, ['goodson']).length).toBeGreaterThan(0)
  })

  it('finds a planted other-lead name anywhere in the output, case-insensitively', () => {
    root = mkdtempSync(join(tmpdir(), 'rfd-deploy-'))
    const out = join(root, 'output')
    mkdirSync(join(out, 'static', 'assets'), { recursive: true })
    writeFileSync(join(out, 'static', 'assets', 'index-abc.js'), 'const name = "Goodson Plumbing Services"; const x = "OTHER CO plumbing";')
    writeFileSync(join(out, 'static', 'index.html'), '<title>Goodson</title>')
    const leaks = scanForLeaks(out, ['Other Co Plumbing', 'other-co'])
    expect(leaks).toEqual([{ file: join(out, 'static', 'assets', 'index-abc.js'), term: 'other co plumbing' }])
    expect(scanForLeaks(out, ['Nobody Here'])).toEqual([])
  })
})

describe('deploymentUrlFrom', () => {
  it('takes the last vercel.app URL in the output', () => {
    const out = 'Vercel CLI 62.7.0\nInspect: https://vercel.com/x/y/abc\nhttps://rapidforge-demos-abc123-team.vercel.app\n'
    expect(deploymentUrlFrom(out)).toBe('https://rapidforge-demos-abc123-team.vercel.app')
    expect(deploymentUrlFrom('nothing')).toBeNull()
  })
})
