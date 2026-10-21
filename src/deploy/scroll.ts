import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, posix } from 'node:path'
import { parseScrollCard, type ScrollCard } from '../scroll/card'

/**
 * RFD.SCROLL.14: the Scroll Story look. A scroll-craft build (Nate Herk's
 * scroll-craft skill) is a standalone folder, index.html + scrollcraft.js +
 * scrollcraft.css + assets/, under <workspace>/builds/<slug>/, where the
 * workspace comes from .scrollcraft.json at the repo root. When a lead has
 * one, the deploy ships it at /scroll next to the five React looks and the
 * picker shows a sixth card. Only the page and what it references ship:
 * the brief, verify sheets and the like stay behind.
 *
 * RFD.SCROLL.14a: a build may also carry card.json, the blurb and four
 * swatches its picker card shows (src/scroll/card.ts). It ships too, as
 * /scroll/card.json, and the deploy builds the picker with it.
 */

export const SCROLL_PATH = 'scroll'

/** What a build folder may ship besides index.html: the engine, and the asset folders. */
export const SCROLL_ENGINE = ['scrollcraft.js', 'scrollcraft.css']
export const SCROLL_DIRS = ['assets', 'fonts']

/** The build's optional picker card, beside index.html in the build and in the output. */
export const SCROLL_CARD = 'card.json'

/** Never shipped, wherever a reference points: notes, verify artifacts, dependencies. */
const NEVER = [/(^|\/)[^/]*\.md$/i, /(^|\/)sheet[^/]*\.png$/i, /(^|\/)verify\//i, /(^|\/)node_modules\//i]

/** The workspace named by <root>/.scrollcraft.json, else the skill's default, <root>/scrollcraft. */
export function scrollWorkspace(root: string): string {
  const file = join(root, '.scrollcraft.json')
  if (existsSync(file)) {
    const { workspace } = JSON.parse(readFileSync(file, 'utf8')) as { workspace?: string }
    if (workspace?.trim()) return join(root, workspace.trim())
  }
  return join(root, 'scrollcraft')
}

export function scrollBuildDir(root: string, slug: string): string {
  return join(scrollWorkspace(root), 'builds', slug)
}

/** A build is there when its folder has an index.html. */
export function hasScrollBuild(buildDir: string): boolean {
  return existsSync(join(buildDir, 'index.html'))
}

/**
 * The build's card.json, checked, or null when the build has none. A
 * card.json that is not JSON or not the right shape throws, naming the
 * problem, so a deploy stops instead of showing the default card.
 */
export function readScrollCard(buildDir: string): ScrollCard | null {
  const file = join(buildDir, SCROLL_CARD)
  if (!existsSync(file)) return null
  let value: unknown
  try {
    value = JSON.parse(readFileSync(file, 'utf8'))
  } catch (err) {
    throw new Error(`${SCROLL_CARD} is not valid JSON (${err instanceof Error ? err.message : String(err)})`)
  }
  return parseScrollCard(value)
}

/** Attributes and url() values that name a file the page loads. */
const REFERENCE = /(?:\b(?:src|href|poster|data-sc-src(?:-mobile)?)\s*=\s*(["'])(.*?)\1)|(?:\bsrcset\s*=\s*(["'])(.*?)\3)|(?:url\(\s*(["']?)(.*?)\5\s*\))/gi

/**
 * The local files index.html references, as "/"-separated paths relative to
 * the build folder: every src, href, poster, data-sc-src and srcset, and
 * every url() in inline styles. Absolute URLs, data:, mailto:, tel: and
 * in-page #links are not files; queries and hashes are dropped.
 */
export function referencedPaths(html: string): string[] {
  const found = new Set<string>()
  const add = (raw: string) => {
    const value = raw.trim()
    if (!value || /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(value)) return
    const path = decodeURIComponent(value.replace(/[?#].*$/, ''))
    if (!path || path.endsWith('/')) return
    found.add(posix.normalize(path.replace(/^\.\//, '')))
  }
  for (const m of html.matchAll(REFERENCE)) {
    if (m[2] !== undefined) add(m[2])
    else if (m[4] !== undefined) for (const candidate of m[4].split(',')) add(candidate.trim().split(/\s+/)[0] ?? '')
    else if (m[6] !== undefined) add(m[6])
  }
  return [...found].sort()
}

function shippable(rel: string): boolean {
  if (NEVER.some((re) => re.test(rel))) return false
  if (rel === 'index.html' || SCROLL_ENGINE.includes(rel)) return true
  return SCROLL_DIRS.some((dir) => rel.startsWith(`${dir}/`)) && !rel.startsWith('..')
}

export interface ScrollCopy {
  /** What shipped, "/"-separated, sorted. */
  files: string[]
  bytes: number
}

/**
 * The page is served at /scroll as well as /scroll/ (vercel.json rewrites
 * the first to the file), and at /scroll its relative references would
 * resolve against the site root, where the React catch-all answers them
 * with index.html. A <base> pins them to the folder. A page that sets its
 * own base keeps it.
 */
export function withBase(html: string, base = `/${SCROLL_PATH}/`): string {
  if (/<base\b/i.test(html)) return html
  return html.replace(/<head(\s[^>]*)?>/i, (head) => `${head}\n    <base href="${base}" />`)
}

/**
 * Copies a build into `dest` (emptied first): index.html (with a <base>, see
 * withBase), the engine, under assets/ and fonts/ only what index.html
 * references, and card.json when the build has one (checked, and written
 * with only its two fields). Throws, naming them, when the page references
 * files that did not ship: missing from the build, outside those folders,
 * or on the never list; and throws on a malformed card.json.
 */
export function copyScrollBuild(buildDir: string, dest: string): ScrollCopy {
  const index = join(buildDir, 'index.html')
  if (!existsSync(index)) throw new Error(`${index} not found`)
  const html = readFileSync(index, 'utf8')
  const refs = referencedPaths(html)
  const wanted = [...new Set(['index.html', ...SCROLL_ENGINE.filter((f) => existsSync(join(buildDir, f))), ...refs])]
  const missing = wanted.filter((rel) => !shippable(rel) || !existsSync(join(buildDir, ...rel.split('/'))))
  if (missing.length > 0) {
    throw new Error(`index.html references ${missing.length} file(s) that cannot ship: ${missing.join(', ')}`)
  }
  const card = readScrollCard(buildDir)
  rmSync(dest, { recursive: true, force: true })
  let bytes = 0
  for (const rel of wanted) {
    const from = join(buildDir, ...rel.split('/'))
    const to = join(dest, ...rel.split('/'))
    mkdirSync(dirname(to), { recursive: true })
    if (rel === 'index.html') writeFileSync(to, withBase(html))
    else copyFileSync(from, to)
    bytes += statSync(to).size
  }
  if (card) {
    const to = join(dest, SCROLL_CARD)
    writeFileSync(to, `${JSON.stringify(card, null, 2)}\n`)
    bytes += statSync(to).size
    wanted.push(SCROLL_CARD)
  }
  return { files: wanted.sort(), bytes }
}
