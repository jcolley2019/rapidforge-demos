// @vitest-environment node
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import {
  aliasFor,
  buildEnv,
  deploymentUrlFrom,
  isDnsLabel,
  isVaultName,
  leakTerms,
  otherLeads,
  parseDeployArgs,
  phoneForms,
  pruneOtherLeads,
  referencesIn,
  scanForLeaks,
  vaultMentions,
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

  it('sets VITE_EDIT=1 with --edit', () => {
    expect(buildEnv({ PATH: '/usr/bin' }, 'goodson', { edit: true }).VITE_EDIT).toBe('1')
  })

  it('keeps edit off without --edit, even when the shell has VITE_EDIT=1', () => {
    expect(buildEnv({ PATH: '/usr/bin' }, 'goodson').VITE_EDIT).toBe('0')
    expect(buildEnv({ VITE_EDIT: '1' }, 'goodson', { edit: false }).VITE_EDIT).toBe('0')
  })
})

describe('isolation', () => {
  let root: string
  afterEach(() => rmSync(root, { recursive: true, force: true }))

  function lead(slug: string, businessName: string, phone = '', address = '') {
    mkdirSync(join(root, 'leads', slug), { recursive: true })
    writeFileSync(join(root, 'leads', slug, 'brief.json'), JSON.stringify({ business_name: businessName, phone, address }))
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

describe('vault-mentioned names', () => {
  let root: string
  afterEach(() => rmSync(root, { recursive: true, force: true }))

  const GOODSON = { name: 'Goodson Plumbing Services', phone: '(208) 629-4278', address: '5103 W Bethel St, Boise, ID 83706' }

  /** A repo root whose plumbing preset brief names Goodson, as the real vault does, plus Goodson as a lead. */
  function setup() {
    root = mkdtempSync(join(tmpdir(), 'rfd-deploy-vault-'))
    mkdirSync(join(root, 'src', 'presets'), { recursive: true })
    const brief = 'Aesthetic: x\nReference feel: S & K Plumbing of Fort Worth, Fort Worth (skplumbinginc.com), Goodson Plumbing Services, Boise (robgoodsonplumbing.com)\nNever: y'
    writeFileSync(join(root, 'src', 'presets', 'presets.json'), JSON.stringify({ plumbing: [{ id: 'bold-local', brief }] }))
    mkdirSync(join(root, 'leads', 'goodson'), { recursive: true })
    writeFileSync(join(root, 'leads', 'goodson', 'brief.json'), JSON.stringify({ business_name: GOODSON.name, phone: GOODSON.phone, address: GOODSON.address }))
    mkdirSync(join(root, 'leads', 'other-co'), { recursive: true })
    writeFileSync(join(root, 'leads', 'other-co', 'brief.json'), JSON.stringify({ business_name: 'Other Co Plumbing', phone: '(555) 010-0199', address: '1 Test Way, Nowhere, ID 00000' }))
    mkdirSync(join(root, 'output', 'static', 'assets'), { recursive: true })
  }

  /** Scans a build for lead `slug` whose bundle holds `bundle`, as the deploy CLI would. */
  function scanAs(slug: string, bundle: string) {
    writeFileSync(join(root, 'output', 'static', 'assets', 'index-abc.js'), bundle)
    return scanForLeaks(join(root, 'output'), leakTerms(otherLeads(root, slug), vaultMentions(root)))
  }

  it('reads names and domains from preset "Reference feel" lines and vault entries', () => {
    setup()
    mkdirSync(join(root, 'vaults'))
    writeFileSync(join(root, 'vaults', 'hvac.json'), JSON.stringify({ entries: [{ company: 'Temperature Control, Inc.', url: 'https://www.temp-con.com/' }] }))
    expect([...vaultMentions(root)].sort()).toEqual(
      ['goodson plumbing services', 'robgoodsonplumbing.com', 's & k plumbing of fort worth', 'skplumbinginc.com', 'temp-con.com', 'temperature control, inc.'].sort(),
    )
    expect(referencesIn('Reference feel: Temperature Control, Inc., Tucson (temp-con.com), DIVCO, Spokane (divcoec.com)')).toEqual([
      { name: 'Temperature Control, Inc.', domain: 'temp-con.com' },
      { name: 'DIVCO', domain: 'divcoec.com' },
    ])
  })

  it('counts a name as vault-mentioned when it is, or is part of, a vault name or domain', () => {
    const vault = new Set(['goodson plumbing services', 'robgoodsonplumbing.com'])
    expect(isVaultName('Goodson Plumbing Services', vault)).toBe(true)
    expect(isVaultName('  goodson   PLUMBING ', vault)).toBe(true)
    expect(isVaultName('robgoodsonplumbing.com', vault)).toBe(true)
    expect(isVaultName('Other Co Plumbing', vault)).toBe(false)
    expect(isVaultName('', vault)).toBe(false)
  })

  it('passes a planted vault-mentioned name alone', () => {
    setup()
    expect(scanAs('other-co', `const ref = "Reference feel: Goodson Plumbing Services, Boise (robgoodsonplumbing.com)";`)).toEqual([])
  })

  it('fails the same name plus its phone number', () => {
    setup()
    const leaks = scanAs('other-co', `const ref = "Goodson Plumbing Services"; const phone = "${GOODSON.phone}";`)
    expect(leaks.map((l) => l.term)).toEqual([GOODSON.phone])
  })

  it('fails its address, its tel: digits and its /leads/<slug>/ folder too', () => {
    setup()
    expect(scanAs('other-co', `const a = "${GOODSON.address}";`).map((l) => l.term)).toEqual([GOODSON.address.toLowerCase()])
    expect(scanAs('other-co', 'href="tel:2086294278"').map((l) => l.term)).toEqual(['2086294278'])
    expect(scanAs('other-co', 'src="/leads/goodson/photos/05.jpg"').map((l) => l.term)).toEqual(['/leads/goodson/'])
    mkdirSync(join(root, 'output', 'static', 'leads', 'goodson'), { recursive: true })
    writeFileSync(join(root, 'output', 'static', 'leads', 'goodson', 'logo.png'), 'x')
    expect(scanAs('other-co', '').map((l) => l.term)).toEqual(['/leads/goodson/'])
  })

  it('still fails a non-vault name alone', () => {
    setup()
    expect(scanAs('goodson', 'const name = "Other Co Plumbing";').map((l) => l.term)).toEqual(['other co plumbing'])
  })

  it('writes a ten-digit phone the common US ways', () => {
    expect(phoneForms('(208) 629-4278')).toEqual(['(208) 629-4278', '2086294278', '208-629-4278', '208.629.4278'])
    expect(phoneForms('+1 208 629 4278')).toContain('2086294278')
    expect(phoneForms('ext 12')).toEqual(['ext 12'])
  })

  it('finds Goodson among the real vault mentions', () => {
    const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
    const vault = vaultMentions(repo)
    expect(vault.has('goodson plumbing services')).toBe(true)
    expect(vault.has('robgoodsonplumbing.com')).toBe(true)
  })
})

describe('deploymentUrlFrom', () => {
  it('takes the last vercel.app URL in the output', () => {
    const out = 'Vercel CLI 62.7.0\nInspect: https://vercel.com/x/y/abc\nhttps://rapidforge-demos-abc123-team.vercel.app\n'
    expect(deploymentUrlFrom(out)).toBe('https://rapidforge-demos-abc123-team.vercel.app')
    expect(deploymentUrlFrom('nothing')).toBeNull()
  })
})
