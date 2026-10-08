import { spawn, type ChildProcess } from 'node:child_process'
import { existsSync, mkdirSync, rmSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { presetVerticalOf } from '../presets/presets'
import { variants } from '../variants/variants'

/**
 * The picker's thumbnails for one lead, shot at deploy time. The committed
 * public/previews/<vertical>/*.jpg are screenshots of the Acme fixture, so
 * a lead's picker would show Acme's name on every card. This serves the
 * lead's built output, shoots the top of each variant the way
 * scripts/shots.mjs does, and writes the shots over the copies in the
 * output; public/previews/ is never touched. The build's default brief is
 * already the lead, so the routes carry no ?brief= query.
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const PORT = 4174

/** The variant routes in src/App.tsx, one per registry slug. */
export const PREVIEW_ROUTES = variants.map((v) => v.slug)

/** Same limit and rule as scripts/shots.mjs: a preview at or over 300 KB fails. */
export const PREVIEW_MAX_BYTES = 300 * 1000

export interface PreviewViewport {
  width: number
  height: number
  /** File-name suffix: "" for desktop, "-mobile" for phone. */
  suffix: string
}

export const PREVIEW_VIEWPORTS: PreviewViewport[] = [
  { width: 1280, height: 800, suffix: '' },
  { width: 390, height: 844, suffix: '-mobile' },
]

export interface PreviewShot {
  route: string
  viewport: PreviewViewport
  /** Path under the output's static dir, "/"-separated: previews/plumbing/heritage.jpg. */
  path: string
  /** Where the shot is written. */
  file: string
}

export interface PreviewFile {
  path: string
  bytes: number
}

/** Every shot for a lead: each variant route at each viewport, under previews/<preset vertical>/. */
export function previewShots(outputStatic: string, vertical: string): PreviewShot[] {
  const dir = `previews/${presetVerticalOf(vertical)}`
  return PREVIEW_VIEWPORTS.flatMap((viewport) =>
    PREVIEW_ROUTES.map((route) => {
      const path = `${dir}/${route}${viewport.suffix}.jpg`
      return { route, viewport, path, file: join(outputStatic, ...path.split('/')) }
    }),
  )
}

/** The previews that fail the size gate. */
export function oversized(files: PreviewFile[]): PreviewFile[] {
  return files.filter((f) => f.bytes >= PREVIEW_MAX_BYTES)
}

export function kb(bytes: number): number {
  return Math.round(bytes / 1000)
}

export interface PreviewServer {
  base: string
  stop(): Promise<void>
}

/** Shoots each shot from the server at `base` into shot.file. */
export type Capture = (base: string, shots: PreviewShot[]) => Promise<void>

/** Serves a built static dir: files as they are, index.html for any other path. */
export type Serve = (dir: string) => Promise<PreviewServer>

async function waitForServer(url: string, child: ChildProcess, ms = 20000) {
  const start = Date.now()
  while (Date.now() - start < ms) {
    if (child.exitCode !== null) throw new Error(`vite preview exited with code ${child.exitCode} before answering on ${url}`)
    try {
      const r = await fetch(url)
      if (r.ok) return
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 200))
  }
  throw new Error(`vite preview did not answer on ${url} within ${ms}ms`)
}

function stopChild(child: ChildProcess): Promise<void> {
  if (child.exitCode !== null || child.signalCode !== null) return Promise.resolve()
  return new Promise((done) => {
    child.once('exit', () => done())
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' })
    } else {
      child.kill('SIGTERM')
    }
  })
}

/**
 * `vite preview --outDir <dir>`, run through node like scripts/shots.mjs so
 * no shell is involved; its SPA fallback answers /<variant> with index.html.
 */
export const servePreview: Serve = async (dir) => {
  const base = `http://127.0.0.1:${PORT}`
  const viteBin = join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js')
  const child = spawn(
    process.execPath,
    [viteBin, 'preview', '--outDir', dir, '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'],
    { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] },
  )
  child.stderr?.on('data', (d: Buffer) => process.stderr.write(d))
  const stop = () => stopChild(child)
  try {
    await waitForServer(base, child)
  } catch (err) {
    await stop()
    throw err
  }
  return { base, stop }
}

/**
 * The top of the page, viewport only, at 1x with reduced motion, without
 * the fixed "All concepts" chip and "I like this one" button (picker
 * chrome, not the prospect's site): JPEG q80, as scripts/shots.mjs shoots.
 * Playwright is imported here, not at the top, so tests never load it.
 */
export const captureWithPlaywright: Capture = async (base, shots) => {
  const { chromium } = await import('playwright')
  const browser = await chromium.launch()
  try {
    for (const viewport of PREVIEW_VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        deviceScaleFactor: 1,
        reducedMotion: 'reduce',
      })
      const page = await context.newPage()
      for (const shot of shots.filter((s) => s.viewport.width === viewport.width && s.viewport.height === viewport.height)) {
        const url = `${base}/${shot.route}`
        const res = await page.goto(url, { waitUntil: 'networkidle' })
        if (!res || !res.ok()) throw new Error(`${url} @${viewport.width}: HTTP ${res ? res.status() : 'no response'}`)
        await page.evaluate(() => document.fonts.ready)
        await page.addStyleTag({ content: '.bc-back, .pick-fab { display: none !important; }' })
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
        await page.screenshot({ path: shot.file, type: 'jpeg', quality: 80 })
      }
      await context.close()
    }
  } finally {
    await browser.close()
  }
}

export interface RenderOptions {
  /** The build output's static dir: .vercel/output/static. */
  outputStatic: string
  /** The lead brief's vertical ("plumber"); its preset vertical names the folder. */
  vertical: string
  capture?: Capture
  serve?: Serve
  /** Gets one line per file written, with its size. */
  log?: (line: string) => void
}

/**
 * Writes the lead's ten previews over the Acme ones in `outputStatic` and
 * returns them with their sizes. Throws if a shot is missing or any file
 * is at or over PREVIEW_MAX_BYTES; either way the server is stopped.
 */
export async function renderLeadPreviews(opts: RenderOptions): Promise<PreviewFile[]> {
  const { outputStatic, vertical, capture = captureWithPlaywright, serve = servePreview, log = () => {} } = opts
  if (!existsSync(join(outputStatic, 'index.html'))) throw new Error(`${join(outputStatic, 'index.html')} not found; build first`)
  const shots = previewShots(outputStatic, vertical)
  for (const shot of shots) {
    mkdirSync(dirname(shot.file), { recursive: true })
    // Removed first, so a shot that never lands cannot leave the Acme file in place.
    rmSync(shot.file, { force: true })
  }
  const server = await serve(outputStatic)
  try {
    await capture(server.base, shots)
  } finally {
    await server.stop()
  }
  const files = shots.map((shot) => {
    if (!existsSync(shot.file)) throw new Error(`${shot.path} was not written`)
    return { path: shot.path, bytes: statSync(shot.file).size }
  })
  for (const f of files) log(`${f.path}  ${kb(f.bytes)} KB`)
  const big = oversized(files)
  if (big.length > 0) {
    throw new Error(`${big.map((f) => `${f.path} (${kb(f.bytes)} KB)`).join(', ')} at or over the ${kb(PREVIEW_MAX_BYTES)} KB limit`)
  }
  return files
}
