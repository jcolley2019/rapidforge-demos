// @vitest-environment node
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import {
  PREVIEW_MAX_BYTES,
  PREVIEW_ROUTES,
  oversized,
  previewShots,
  renderLeadPreviews,
  type Capture,
  type Serve,
} from './previews'
import { variants } from '../variants/variants'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')

const dirs: string[] = []
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true })
})

/** A fake build output: index.html plus the Acme plumbing thumbnails it was built with. */
function outputStatic(): string {
  const dir = mkdtempSync(join(tmpdir(), 'rfd-previews-'))
  dirs.push(dir)
  writeFileSync(join(dir, 'index.html'), '<!doctype html>')
  mkdirSync(join(dir, 'previews', 'plumbing'), { recursive: true })
  for (const route of PREVIEW_ROUTES) {
    writeFileSync(join(dir, 'previews', 'plumbing', `${route}.jpg`), 'acme')
    writeFileSync(join(dir, 'previews', 'plumbing', `${route}-mobile.jpg`), 'acme')
  }
  return dir
}

/** A capture that writes `bytes(path)` bytes of "x" per shot, with no browser. */
function fakeCapture(bytes: (path: string) => number): Capture {
  return async (_base, shots) => {
    for (const shot of shots) writeFileSync(shot.file, Buffer.alloc(bytes(shot.path), 'x'))
  }
}

function fakeServer(): { serve: Serve; stopped: () => boolean } {
  let stopped = false
  const serve: Serve = async () => ({
    base: 'http://127.0.0.1:0',
    stop: async () => {
      stopped = true
    },
  })
  return { serve, stopped: () => stopped }
}

describe('previewShots', () => {
  it('maps a lead vertical to its preset vertical folder in the output', () => {
    const dir = join('out', 'static')
    const shots = previewShots(dir, 'plumber')
    expect(shots.map((s) => s.path)).toContain('previews/plumbing/cleanpro.jpg')
    expect(shots.map((s) => s.path)).toContain('previews/plumbing/cleanpro-mobile.jpg')
    const cleanpro = shots.find((s) => s.path === 'previews/plumbing/cleanpro.jpg')!
    expect(cleanpro.file).toBe(join(dir, 'previews', 'plumbing', 'cleanpro.jpg'))
    expect(cleanpro.route).toBe('cleanpro')
    expect(cleanpro.viewport).toMatchObject({ width: 1280, height: 800 })
    expect(shots.find((s) => s.path === 'previews/plumbing/cleanpro-mobile.jpg')!.viewport).toMatchObject({ width: 390, height: 844 })
  })

  it('makes one desktop and one phone shot per variant: ten files', () => {
    const paths = previewShots('out', 'plumber').map((s) => s.path)
    expect(paths).toHaveLength(10)
    expect(new Set(paths).size).toBe(10)
  })

  it('resolves other lead verticals the way the picker does', () => {
    expect(previewShots('out', 'hvac_contractor')[0].path).toBe('previews/hvac/heritage.jpg')
    expect(previewShots('out', 'electrician')[0].path).toBe('previews/electrical/heritage.jpg')
    // No presets of its own: the picker shows the plumbing set, so that is the set replaced.
    expect(previewShots('out', 'roofing')[0].path).toBe('previews/plumbing/heritage.jpg')
  })
})

describe('preview routes', () => {
  it('are the variant registry slugs', () => {
    expect(PREVIEW_ROUTES).toEqual(variants.map((v) => v.slug))
  })

  it('match the variant routes in App.tsx', () => {
    const app = readFileSync(join(root, 'src', 'App.tsx'), 'utf8')
    const routes = [...app.matchAll(/<Route path="\/([a-z0-9-]+)"/g)].map((m) => m[1])
    expect(routes).toEqual(PREVIEW_ROUTES)
  })
})

describe('size gate', () => {
  it('fails a preview at or over 300 KB and passes one under it', () => {
    const files = [
      { path: 'a.jpg', bytes: PREVIEW_MAX_BYTES - 1 },
      { path: 'b.jpg', bytes: PREVIEW_MAX_BYTES },
      { path: 'c.jpg', bytes: PREVIEW_MAX_BYTES + 1 },
    ]
    expect(oversized(files).map((f) => f.path)).toEqual(['b.jpg', 'c.jpg'])
    expect(PREVIEW_MAX_BYTES).toBe(300_000)
  })
})

describe('renderLeadPreviews', () => {
  it('writes all ten shots over the Acme files, logs each with its size, and stops the server', async () => {
    const dir = outputStatic()
    const { serve, stopped } = fakeServer()
    const lines: string[] = []
    const files = await renderLeadPreviews({ outputStatic: dir, vertical: 'plumber', capture: fakeCapture(() => 1234), serve, log: (l) => lines.push(l) })
    expect(files).toHaveLength(10)
    expect(files.every((f) => f.bytes === 1234)).toBe(true)
    expect(readFileSync(join(dir, 'previews', 'plumbing', 'cleanpro.jpg')).length).toBe(1234)
    expect(lines).toHaveLength(10)
    expect(lines).toContain('previews/plumbing/cleanpro.jpg  1 KB')
    expect(stopped()).toBe(true)
  })

  it('throws, naming the file, when a shot is at or over 300 KB', async () => {
    const dir = outputStatic()
    const capture = fakeCapture((path) => (path === 'previews/plumbing/texas-mobile.jpg' ? PREVIEW_MAX_BYTES : 1000))
    await expect(renderLeadPreviews({ outputStatic: dir, vertical: 'plumber', capture, serve: fakeServer().serve })).rejects.toThrow(
      'previews/plumbing/texas-mobile.jpg (300 KB) at or over the 300 KB limit',
    )
  })

  it('throws when a shot is not written, rather than leaving the Acme file', async () => {
    const dir = outputStatic()
    const capture: Capture = async (base, shots) => fakeCapture(() => 1000)(base, shots.filter((s) => s.route !== 'aerial'))
    await expect(renderLeadPreviews({ outputStatic: dir, vertical: 'plumber', capture, serve: fakeServer().serve })).rejects.toThrow(
      'previews/plumbing/aerial.jpg was not written',
    )
  })

  it('stops the server when the capture fails', async () => {
    const dir = outputStatic()
    const { serve, stopped } = fakeServer()
    const capture: Capture = async () => {
      throw new Error('HTTP 404')
    }
    await expect(renderLeadPreviews({ outputStatic: dir, vertical: 'plumber', capture, serve })).rejects.toThrow('HTTP 404')
    expect(stopped()).toBe(true)
  })

  it('refuses an output with no build in it', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'rfd-previews-'))
    dirs.push(dir)
    await expect(renderLeadPreviews({ outputStatic: dir, vertical: 'plumber', capture: fakeCapture(() => 1), serve: fakeServer().serve })).rejects.toThrow(
      'not found; build first',
    )
  })
})
