// Screenshot gate: serves the built site with `vite preview`, shoots the
// picker and every variant route at desktop and phone widths into shots/,
// and fails when any page is wider than the phone viewport.
//
//   npm run build && node scripts/shots.mjs
//
// Chromium only. Exit code 1 on any overflow or navigation failure.

import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const PORT = 4173
const BASE = `http://127.0.0.1:${PORT}`
const OUT = join(root, 'shots')
const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'phone', width: 390, height: 844 },
]

if (!existsSync(join(root, 'dist', 'index.html'))) {
  console.error('dist/index.html not found — run `npm run build` first.')
  process.exit(1)
}

// Routes come from the registry so a new variant is shot automatically.
const registry = readFileSync(join(root, 'src', 'variants', 'variants.ts'), 'utf8')
const slugs = [...registry.matchAll(/slug:\s*'([a-z0-9-]+)'/g)].map((m) => m[1])
const routes = ['/', ...slugs.map((s) => `/${s}`)]

// Run vite's own bin through node so no shell is involved on any platform.
const viteBin = join(root, 'node_modules', 'vite', 'bin', 'vite.js')
const preview = spawn(
  process.execPath,
  [viteBin, 'preview', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'],
  { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] },
)
preview.stderr.on('data', (d) => process.stderr.write(d))

async function waitForServer(url, ms = 20000) {
  const start = Date.now()
  while (Date.now() - start < ms) {
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

function stop() {
  if (preview.exitCode === null) {
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', String(preview.pid), '/T', '/F'], { stdio: 'ignore' })
    } else {
      preview.kill('SIGTERM')
    }
  }
}

let failures = 0
const written = []

try {
  await waitForServer(BASE)
  mkdirSync(OUT, { recursive: true })
  const browser = await chromium.launch()
  try {
    for (const vp of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 1,
        reducedMotion: 'reduce',
      })
      const page = await context.newPage()
      for (const route of routes) {
        const name = route === '/' ? 'picker' : route.slice(1)
        const file = join(OUT, `${name}-${vp.width}x${vp.height}.png`)
        const res = await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' })
        if (!res || !res.ok()) {
          console.error(`FAIL ${route} @${vp.width}: HTTP ${res ? res.status() : 'no response'}`)
          failures++
          continue
        }
        await page.evaluate(() => document.fonts.ready)
        await page.screenshot({ path: file, fullPage: true })
        written.push(file)

        const width = await page.evaluate(() =>
          Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
        )
        if (vp.width === 390 && width > vp.width) {
          console.error(`FAIL ${route} @390: scrollWidth ${width} > 390`)
          failures++
        } else {
          console.log(`ok   ${route} @${vp.width}: scrollWidth ${width}`)
        }
      }
      await context.close()
    }
  } finally {
    await browser.close()
  }
} catch (err) {
  console.error(err)
  failures++
} finally {
  stop()
}

console.log(`\n${written.length} screenshots in ${OUT}`)
if (failures > 0) {
  console.error(`${failures} failure(s)`)
  process.exit(1)
}
console.log('width check passed at 390px')
