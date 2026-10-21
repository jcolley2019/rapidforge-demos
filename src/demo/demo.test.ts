// @vitest-environment node
import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DeployError, type DeployOptions } from '../deploy/cli'
import { isDnsLabel } from '../deploy/deploy'
import { IntakeError, runIntake } from '../intake/cli'
import { leadBriefFrom, type BusinessDemo, type BusinessDemoPatch } from '../intake/leads'
import nosite from '../test/fixtures/lead-nosite.json'
import { runDemo, type DemoSteps } from './cli'
import { DEMO_ERROR_MAX, demoError, failureLine, resolveSub, subFromName, successLine } from './demo'

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
      dbRecorded: true,
    })
    expect(line).not.toContain('\n')
    expect(Object.keys(JSON.parse(line))).toEqual(['ok', 'businessId', 'slug', 'sub', 'previewUrl', 'aliasUrl', 'aliasOk', 'durationMs', 'dbRecorded'])
    expect(JSON.parse(line)).toMatchObject({ ok: true, aliasOk: false, durationMs: 1234, dbRecorded: true })
  })

  it('writes failure as one JSON line, multi-line errors escaped', () => {
    const line = failureLine('build', 'vercel build failed\nsee above', false)
    expect(line).not.toContain('\n')
    expect(JSON.parse(line)).toEqual({ ok: false, stage: 'build', error: 'vercel build failed\nsee above', dbRecorded: false })
  })
})

describe('resolveSub', () => {
  it('takes demo_sub first, so a rerun keeps the URL in use', () => {
    expect(resolveSub('landers', 'Landers Home Services', 'landershomeservices-com')).toEqual({ sub: 'landers', from: 'demo_sub' })
  })

  it('falls back to the name when demo_sub is absent or not a DNS label', () => {
    expect(resolveSub(null, 'Landers Home Services', 'landershomeservices-com')).toEqual({ sub: 'landershomeservices', from: 'name' })
    expect(resolveSub('Landers Home', 'Landers Home Services', 'landershomeservices-com')).toEqual({ sub: 'landershomeservices', from: 'name' })
    expect(resolveSub('-landers', 'Landers Home Services', 'landershomeservices-com')).toEqual({ sub: 'landershomeservices', from: 'name' })
  })

  it('falls back to the slug when the name gives nothing', () => {
    expect(resolveSub(null, '&&&', 'landershomeservices-com')).toEqual({ sub: 'landershomeservices-com', from: 'slug' })
    expect(resolveSub('NOPE', '', 'landershomeservices-com')).toEqual({ sub: 'landershomeservices-com', from: 'slug' })
  })
})

describe('demoError', () => {
  it('is "<stage>: <message>", cut to 500 characters', () => {
    expect(demoError('deploy', 'vercel deploy failed')).toBe('deploy: vercel deploy failed')
    const long = demoError('build', 'x'.repeat(2000))
    expect(DEMO_ERROR_MAX).toBe(500)
    expect(long).toHaveLength(500)
    expect(long.startsWith('build: xxx')).toBe(true)
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
    const result = JSON.parse(lines[0]) as { ok: boolean; stage: string; error: string; dbRecorded: boolean }
    expect(result.ok).toBe(false)
    expect(result.stage).toBe('brief')
    expect(result.error).toContain(error)
    // Stopped before the business was read: nothing to record on.
    expect(result.dbRecorded).toBe(false)
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
      readBusiness: async (id) => ({ id, name: nosite.business.name, demo_sub: null }),
      recordDemo: async () => {},
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
      dbRecorded: true,
    })
  })
})

describe('demo run records businesses.demo_*', () => {
  const BUSINESS_ID = '47f83fee-0000-4000-8000-000000000001'
  const PREVIEW = 'https://rapidforge-demos-test.vercel.app'

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  /** A demo run with the leads DB, intake and deploy mocked; `events` is the order they ran in. */
  function harness(business: Partial<BusinessDemo> = {}, over: Partial<DemoSteps> = {}) {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('no network in tests')
      }),
    )
    vi.spyOn(console, 'log').mockImplementation(() => {})
    const stderr = vi.spyOn(console, 'error').mockImplementation(() => {})
    const events: string[] = []
    const writes: [string, BusinessDemoPatch][] = []
    const deploys: DeployOptions[] = []
    const lines: string[] = []
    const steps: DemoSteps = {
      readBusiness: async (id) => {
        events.push('read')
        return { id, name: 'Landers Home Services', demo_sub: null, ...business }
      },
      recordDemo: async (id, demo) => {
        events.push(`record ${demo.demo_status}`)
        writes.push([id, demo])
      },
      runIntake: async (opts) => {
        events.push('intake')
        return { businessId: opts.lead, businessName: 'Landers Home Services', slug: 'landershomeservices-com', url: 'https://landershomeservices.com' }
      },
      runDeploy: async (opts) => {
        events.push('deploy')
        deploys.push(opts)
        return { slug: opts.slug, sub: opts.as ?? opts.slug, previewUrl: PREVIEW, aliasUrl: `https://${opts.as}.demos.rapidforgeai.com`, aliasOk: true }
      },
      ...over,
    }
    const run = (...argv: string[]) => runDemo(['--lead', BUSINESS_ID, ...argv], (line) => lines.push(line), steps)
    const result = () => {
      expect(lines).toHaveLength(1)
      return JSON.parse(lines[0]) as Record<string, unknown>
    }
    return { run, result, events, writes, deploys, stderr }
  }

  it('records building once the business is read, then ready with the deploy URLs', async () => {
    const h = harness({ demo_sub: 'landers' })
    const before = Date.now()
    expect(await h.run('--skip-previews')).toBe(0)
    const after = Date.now()

    expect(h.events).toEqual(['read', 'record building', 'intake', 'deploy', 'record ready'])
    expect(h.writes).toEqual([
      [BUSINESS_ID, { demo_status: 'building', demo_error: null }],
      [
        BUSINESS_ID,
        {
          demo_status: 'ready',
          demo_sub: 'landers',
          demo_url: 'https://landers.demos.rapidforgeai.com',
          demo_preview_url: PREVIEW,
          demo_built_at: expect.stringMatching(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/),
          demo_error: null,
        },
      ],
    ])
    const builtAt = Date.parse(h.writes[1][1].demo_built_at!)
    expect(builtAt).toBeGreaterThanOrEqual(before)
    expect(builtAt).toBeLessThanOrEqual(after)
    expect(h.result()).toMatchObject({ ok: true, sub: 'landers', aliasUrl: 'https://landers.demos.rapidforgeai.com', aliasOk: true, dbRecorded: true })
  })

  it('without --as, deploys to demo_sub, else the name, else the slug; --as wins over all', async () => {
    const cases: [Partial<BusinessDemo>, Partial<DemoSteps>, string[], string][] = [
      [{ demo_sub: 'landers' }, {}, [], 'landers'],
      [{ demo_sub: 'Landers Home' }, {}, [], 'landershomeservices'],
      [{ demo_sub: null }, {}, [], 'landershomeservices'],
      [
        { demo_sub: null },
        { runIntake: async (opts) => ({ businessId: opts.lead, businessName: '&&&', slug: 'landershomeservices-com', url: null }) },
        [],
        'landershomeservices-com',
      ],
      [{ demo_sub: 'landers' }, {}, ['--as', 'landers-home'], 'landers-home'],
    ]
    for (const [business, over, argv, sub] of cases) {
      const h = harness(business, over)
      expect(await h.run(...argv)).toBe(0)
      expect(h.deploys.map((d) => d.as)).toEqual([sub])
      expect(h.writes.at(-1)?.[1].demo_sub).toBe(sub)
      vi.restoreAllMocks()
    }
  })

  it('records failed with "<stage>: <message>" on a failure and still exits 1 with the failure line', async () => {
    const h = harness({}, {
      runDeploy: async () => {
        throw new DeployError('deploy', 'vercel deploy failed')
      },
    })
    expect(await h.run()).toBe(1)
    expect(h.writes).toEqual([
      [BUSINESS_ID, { demo_status: 'building', demo_error: null }],
      [BUSINESS_ID, { demo_status: 'failed', demo_error: 'deploy: vercel deploy failed' }],
    ])
    expect(h.result()).toEqual({ ok: false, stage: 'deploy', error: 'vercel deploy failed', dbRecorded: true })
  })

  it('records an intake failure at its stage, demo_error cut to 500 characters', async () => {
    const h = harness({}, {
      runIntake: async () => {
        throw new IntakeError('intake', `intake failed: ${'x'.repeat(1000)}`)
      },
    })
    expect(await h.run()).toBe(1)
    const failed = h.writes.at(-1)![1]
    expect(failed.demo_status).toBe('failed')
    expect(failed.demo_error).toHaveLength(500)
    expect(failed.demo_error!.startsWith('intake: intake failed: xxx')).toBe(true)
    expect(h.result()).toMatchObject({ ok: false, stage: 'intake', dbRecorded: true })
    expect((h.result().error as string).length).toBeGreaterThan(1000)
  })

  it('records nothing when the business cannot be read, and does not run the intake', async () => {
    const h = harness({}, {
      readBusiness: async (id) => {
        throw new Error(`leads Supabase: business ${id} not found`)
      },
    })
    expect(await h.run()).toBe(1)
    expect(h.events).toEqual([])
    expect(h.writes).toEqual([])
    expect(h.result()).toEqual({ ok: false, stage: 'brief', error: `leads Supabase: business ${BUSINESS_ID} not found`, dbRecorded: false })
  })

  it('a failed DB write is logged and reported as dbRecorded false; ok and aliasOk stand', async () => {
    const h = harness({}, {
      recordDemo: async () => {
        throw new Error('leads Supabase: updating businesses failed (HTTP 503)')
      },
    })
    expect(await h.run()).toBe(0)
    expect(h.result()).toMatchObject({ ok: true, aliasOk: true, sub: 'landershomeservices', dbRecorded: false })
    expect(h.stderr).toHaveBeenCalledWith(expect.stringContaining('leads DB: recording demo_status ready failed: leads Supabase: updating businesses failed (HTTP 503)'))
  })

  it('a failed DB write on a failed run keeps the failure as it was', async () => {
    const h = harness({}, {
      recordDemo: async () => {
        throw new Error('could not reach the leads Supabase')
      },
      runDeploy: async () => {
        throw new DeployError('alias', 'vercel alias set failed')
      },
    })
    expect(await h.run()).toBe(1)
    expect(h.result()).toEqual({ ok: false, stage: 'alias', error: 'vercel alias set failed', dbRecorded: false })
  })

  it('dbRecorded is false when building landed but ready did not', async () => {
    const h = harness({}, {
      recordDemo: async (_id, demo) => {
        if (demo.demo_status === 'ready') throw new Error('HTTP 500')
      },
    })
    expect(await h.run()).toBe(0)
    expect(h.result()).toMatchObject({ ok: true, dbRecorded: false })
  })
})
