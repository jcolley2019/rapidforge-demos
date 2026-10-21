// @vitest-environment node
import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { DeployOptions } from '../deploy/cli'
import { isDnsLabel } from '../deploy/deploy'
import { runIntake } from '../intake/cli'
import { leadBriefFrom } from '../intake/leads'
import nosite from '../test/fixtures/lead-nosite.json'
import { runDemo } from './cli'
import { failureLine, subFromName, successLine } from './demo'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const TSX = join(ROOT, 'node_modules', 'tsx', 'dist', 'cli.mjs')

describe('subFromName', () => {
  it('takes the name up to its first symbol, spaces out', () => {
    expect(subFromName('All Plumbing & Sewer')).toBe('allplumbing')
    expect(subFromName('Rob Goodson Plumbing')).toBe('robgoodsonplumbing')
    expect(subFromName('Treasure Valley Heating, Inc.')).toBe('treasurevalleyheating')
    expect(subFromName('A-1 Plumbing & Drain')).toBe('a-1plumbing')
  })

  it('drops apostrophes and accents instead of cutting at them', () => {
    expect(subFromName("Bob's Plumbing & Heating")).toBe('bobsplumbing')
    expect(subFromName('José’s Electric')).toBe('joseselectric')
  })

  it('returns a DNS label of at most 40 characters, or null when nothing is left', () => {
    const long = subFromName('Southwest Idaho Residential and Commercial Plumbing Services')
    expect(long).toHaveLength(40)
    expect(isDnsLabel(long!)).toBe(true)
    expect(subFromName('&&&')).toBeNull()
    expect(subFromName('  ')).toBeNull()
    expect(subFromName('-- & --')).toBeNull()
  })
})

describe('result lines', () => {
  it('writes success as one JSON line with the documented keys in order', () => {
    const line = successLine({
      businessId: 'dff84968',
      slug: 'allplumbingsewer-com',
      sub: 'allplumbing',
      previewUrl: 'https://rapidforge-demos-abc.vercel.app',
      aliasUrl: 'https://allplumbing.demos.rapidforgeai.com',
      aliasOk: false,
      durationMs: 1234,
    })
    expect(line).not.toContain('\n')
    expect(Object.keys(JSON.parse(line))).toEqual(['ok', 'businessId', 'slug', 'sub', 'previewUrl', 'aliasUrl', 'aliasOk', 'durationMs'])
    expect(JSON.parse(line)).toMatchObject({ ok: true, aliasOk: false, durationMs: 1234 })
  })

  it('writes failure as one JSON line, multi-line errors escaped', () => {
    const line = failureLine('build', 'vercel build failed\nsee above')
    expect(line).not.toContain('\n')
    expect(JSON.parse(line)).toEqual({ ok: false, stage: 'build', error: 'vercel build failed\nsee above' })
  })
})

/** The real demo CLI; these runs fail before any network, file or Vercel call. */
function demo(...args: string[]) {
  return spawnSync(process.execPath, [TSX, 'src/demo/cli.ts', ...args], { cwd: ROOT, encoding: 'utf8', timeout: 60_000 })
}

describe('demo CLI', () => {
  it.each([
    [[], '--lead <businessId> is required'],
    [['--lead', 'biz-1', '--as', 'Not A Label'], '--as "Not A Label" must be a DNS label'],
    [['--lead', 'biz-1', '--bogus'], "Unknown option '--bogus'"],
  ])('fails %j at stage brief: one JSON line on stdout, exit 1, the rest on stderr', (args, error) => {
    const run = demo(...args)
    expect(run.status).toBe(1)
    const lines = run.stdout.trim().split('\n')
    expect(lines).toHaveLength(1)
    const result = JSON.parse(lines[0]) as { ok: boolean; stage: string; error: string }
    expect(result.ok).toBe(false)
    expect(result.stage).toBe('brief')
    expect(result.error).toContain(error)
    expect(run.stderr).toContain(error)
  }, 60_000)
})

describe('demo for a lead with no website', () => {
  const roots: string[] = []

  afterEach(() => {
    for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('needs no extra flag: brief-only intake, the deploy of its slug, then one ok:true line', async () => {
    const root = mkdtempSync(join(tmpdir(), 'rfd-demo-nosite-'))
    roots.push(root)
    const fetchMock = vi.fn(async () => {
      throw new Error('no network in tests')
    })
    vi.stubGlobal('fetch', fetchMock)
    vi.spyOn(console, 'log').mockImplementation(() => {})
    const deploys: DeployOptions[] = []
    const lines: string[] = []

    const code = await runDemo(['--lead', nosite.business.id], (line) => lines.push(line), {
      runIntake: (opts) =>
        runIntake({
          ...opts,
          root,
          fetchLead: async () => leadBriefFrom(nosite.business, nosite.audit),
          // The refine call fails, so the lead's own services and tone stand.
          ai: { complete: async () => Promise.reject(new Error('no model in tests')) },
        }),
      runDeploy: async (opts) => {
        deploys.push(opts)
        expect(existsSync(join(root, 'src', 'brief', 'fixtures', `lead-${opts.slug}.json`))).toBe(true)
        return {
          slug: opts.slug,
          sub: opts.as ?? opts.slug,
          previewUrl: 'https://rapidforge-demos-test.vercel.app',
          aliasUrl: `https://${opts.as}.demos.rapidforgeai.com`,
          aliasOk: true,
        }
      },
    })

    expect(code).toBe(0)
    expect(fetchMock).not.toHaveBeenCalled()
    expect(deploys).toEqual([expect.objectContaining({ slug: 'summit-and-sage-plumbing-llc', as: 'summitandsageplumbingllc' })])
    expect(lines).toHaveLength(1)
    expect(JSON.parse(lines[0])).toMatchObject({
      ok: true,
      businessId: nosite.business.id,
      slug: 'summit-and-sage-plumbing-llc',
      sub: 'summitandsageplumbingllc',
      aliasUrl: 'https://summitandsageplumbingllc.demos.rapidforgeai.com',
      aliasOk: true,
    })
  })
})
