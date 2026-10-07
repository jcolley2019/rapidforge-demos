// @vitest-environment node
import { spawnSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const TSX = join(ROOT, 'node_modules', 'tsx', 'dist', 'cli.mjs')

/** The real intake CLI; usage errors return before any network, file or model call. */
function intake(...args: string[]) {
  return spawnSync(process.execPath, [TSX, 'src/intake/cli.ts', ...args], { cwd: ROOT, encoding: 'utf8', timeout: 60_000 })
}

describe('intake CLI usage', () => {
  it('refuses --lead with --brief', () => {
    const run = intake('--lead', 'biz-1', '--brief', 'lead.json')
    expect(run.status).toBe(2)
    expect(run.stderr).toContain('--lead and --brief cannot be used together')
    expect(run.stderr).toContain('--lead <businessId>')
  }, 60_000)

  it('refuses --dry and --force without --lead', () => {
    const run = intake('--url', 'https://acme-plumbing.example', '--dry')
    expect(run.status).toBe(2)
    expect(run.stderr).toContain('--force and --dry only apply with --lead')
  }, 60_000)
})
