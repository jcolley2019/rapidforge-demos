// Screenshot gate: serves the built site with `vite preview`, shoots the
// picker and every variant route at desktop and phone widths into shots/
// for each residential fixture, fails when any page is wider than the phone
// viewport, fails when the picker's cards are unequal or do not stack at
// phone width, and fails when a variant's services heading starts below the
// fold at either size.
//
// It also writes the picker's preview images: the top of each variant as
// public/previews/<vertical>/<slug>.jpg (1280x800) and <slug>-mobile.jpg
// (390x844), JPEG q80, each under 300 KB, one set per fixture's vertical.
// They are committed; the picker loads the set for the brief's vertical.
//
//   npm run shots    (npm run build && node scripts/shots.mjs)
//
// Chromium only. Exit code 1 on any overflow, layout, size, or navigation failure.

import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const PORT = 4173
const BASE = `http://127.0.0.1:${PORT}`
const OUT = join(root, 'shots')
const PREVIEWS = join(root, 'public', 'previews')
const PREVIEW_MAX_BYTES = 300 * 1000
const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 800, previewSuffix: '' },
  { name: 'phone', width: 390, height: 844, previewSuffix: '-mobile' },
]

// The build's own brief (DEFAULT_BRIEF in src/brief/current.ts) needs no
// query; every other fixture is picked at run time with ?brief=, the way
// the picker's toggle does it. Each fixture's vertical names its preview
// folder, so it must be a preset vertical key (plumbing, hvac, electrical).
const DEFAULT_BRIEF = 'acme-plumbing'
const FIXTURES = ['acme-plumbing', 'acme-hvac', 'acme-electric'].map((stem) => {
  const brief = JSON.parse(readFileSync(join(root, 'src', 'brief', 'fixtures', `${stem}.json`), 'utf8'))
  return { stem, vertical: brief.vertical, query: stem === DEFAULT_BRIEF ? '' : `?brief=${stem}` }
})

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
let previews = 0
const written = []

try {
  await waitForServer(BASE)
  mkdirSync(OUT, { recursive: true })
  const browser = await chromium.launch()
  try {
    for (const fixture of FIXTURES) {
      const previewDir = join(PREVIEWS, fixture.vertical)
      mkdirSync(previewDir, { recursive: true })
      for (const vp of VIEWPORTS) {
        const context = await browser.newContext({
          viewport: { width: vp.width, height: vp.height },
          deviceScaleFactor: 1,
          reducedMotion: 'reduce',
        })
        const page = await context.newPage()
        for (const route of routes) {
          const name = route === '/' ? 'picker' : route.slice(1)
          const tag = `${fixture.stem} ${route}`
          const file = join(OUT, `${fixture.stem}-${name}-${vp.width}x${vp.height}.png`)
          const res = await page.goto(`${BASE}${route}${fixture.query}`, { waitUntil: 'networkidle' })
          if (!res || !res.ok()) {
            console.error(`FAIL ${tag} @${vp.width}: HTTP ${res ? res.status() : 'no response'}`)
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
            console.error(`FAIL ${tag} @390: scrollWidth ${width} > 390`)
            failures++
          } else {
            console.log(`ok   ${tag} @${vp.width}: scrollWidth ${width}`)
          }

          // Picker cards: one per variant, all the same width at every size,
          // and a single column at phone width (same left edge, each card
          // below the one before).
          if (route === '/') {
            const cards = await page.evaluate(() =>
              [...document.querySelectorAll('.pk-card')].map((el) => {
                const r = el.getBoundingClientRect()
                return {
                  left: Math.round(r.left),
                  top: Math.round(r.top),
                  bottom: Math.round(r.bottom),
                  width: Math.round(r.width),
                }
              }),
            )
            const sameWidth = cards.every((c) => Math.abs(c.width - cards[0].width) <= 1)
            const stacked = cards.every(
              (c, i) => i === 0 || (Math.abs(c.left - cards[0].left) <= 1 && c.top >= cards[i - 1].bottom),
            )
            if (cards.length !== slugs.length || !sameWidth) {
              console.error(`FAIL ${tag} @${vp.width}: ${cards.length} cards, widths ${cards.map((c) => c.width).join('/')}`)
              failures++
            } else if (vp.width === 390 && !stacked) {
              console.error(`FAIL ${tag} @390: cards do not stack (${cards.map((c) => `${c.left},${c.top}`).join(' ')})`)
              failures++
            } else {
              const how = vp.width === 390 ? 'stacked' : 'equal'
              console.log(`ok   ${tag} @${vp.width}: ${cards.length} cards ${cards[0].width}px wide, ${how}`)
            }
          }

          // Fold check: on a variant, the services heading must begin inside
          // the first viewport, so headline, CTA, phone, and trust strip all
          // sit above it.
          if (route !== '/') {
            const top = await page.evaluate(() => {
              window.scrollTo(0, 0)
              const h = document.querySelector('#services h2')
              return h ? Math.round(h.getBoundingClientRect().top) : null
            })
            if (top === null) {
              console.error(`FAIL ${tag} @${vp.width}: no #services h2 found`)
              failures++
            } else if (top >= vp.height) {
              console.error(`FAIL ${tag} @${vp.width}x${vp.height}: services heading top ${top} >= ${vp.height}`)
              failures++
            } else {
              console.log(`ok   ${tag} @${vp.width}x${vp.height}: services heading top ${top}`)
            }

            // Picker preview: the top of the page, viewport only, without the
            // fixed "All concepts" chip (picker chrome, not the prospect's site).
            const previewName = `${route.slice(1)}${vp.previewSuffix}.jpg`
            const preview = join(previewDir, previewName)
            await page.addStyleTag({ content: '.bc-back { display: none !important; }' })
            await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
            await page.screenshot({ path: preview, type: 'jpeg', quality: 80 })
            written.push(preview)
            previews++
            const bytes = statSync(preview).size
            if (bytes >= PREVIEW_MAX_BYTES) {
              console.error(`FAIL ${tag} @${vp.width}: ${fixture.vertical}/${previewName} is ${Math.round(bytes / 1000)} KB, limit 300 KB`)
              failures++
            } else {
              console.log(`ok   ${tag} @${vp.width}: ${fixture.vertical}/${previewName} ${Math.round(bytes / 1000)} KB`)
            }
          }
        }
        await context.close()
      }
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

console.log(`\n${written.length - previews} screenshots in ${OUT}; ${previews} previews in ${PREVIEWS}`)
if (failures > 0) {
  console.error(`${failures} failure(s)`)
  process.exit(1)
}
console.log(
  `width check passed at 390px; picker cards equal and stacked at 390px; fold check passed at both sizes; previews under 300 KB; ${FIXTURES.length} fixtures`,
)
