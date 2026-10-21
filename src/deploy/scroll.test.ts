// @vitest-environment node
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { copyScrollBuild, hasScrollBuild, readScrollCard, referencedPaths, scrollBuildDir, scrollWorkspace, withBase } from './scroll'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const FIXTURE = join(ROOT, 'src', 'test', 'fixtures', 'scroll-min')

let tmp: string[] = []
function scratch(): string {
  const dir = mkdtempSync(join(tmpdir(), 'rfd-scroll-'))
  tmp.push(dir)
  return dir
}
function put(dir: string, rel: string, text = 'x') {
  const file = join(dir, ...rel.split('/'))
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, text)
}
afterEach(() => {
  for (const dir of tmp) rmSync(dir, { recursive: true, force: true })
  tmp = []
})

describe('workspace', () => {
  it('reads .scrollcraft.json at the repo root: builds live in leads/scrollcraft/builds/<slug>/', () => {
    expect(JSON.parse(readFileSync(join(ROOT, '.scrollcraft.json'), 'utf8'))).toEqual({ workspace: 'leads/scrollcraft' })
    expect(scrollWorkspace(ROOT)).toBe(join(ROOT, 'leads', 'scrollcraft'))
    expect(scrollBuildDir(ROOT, 'allplumbingsewer-com')).toBe(join(ROOT, 'leads', 'scrollcraft', 'builds', 'allplumbingsewer-com'))
  })

  it('falls back to <root>/scrollcraft without the file, and a build is one with an index.html', () => {
    const root = scratch()
    expect(scrollWorkspace(root)).toBe(join(root, 'scrollcraft'))
    expect(hasScrollBuild(join(root, 'nope'))).toBe(false)
    put(root, 'scrollcraft/builds/x/index.html', '<!doctype html>')
    expect(hasScrollBuild(scrollBuildDir(root, 'x'))).toBe(true)
  })
})

describe('referencedPaths', () => {
  it('collects src, href, poster, data-sc-src, srcset and url() as build-relative paths; skips URLs, data:, tel: and #', () => {
    const html = `
      <link rel="stylesheet" href="./scrollcraft.css">
      <link rel="preload" href="fonts/Geist.woff2?v=2" as="font">
      <style>.a{background:url('assets/open.svg#x')} .b{background:url(assets/b.webp)}</style>
      <img src="assets/01.webp" srcset="assets/01-800.webp 800w, assets/01-1600.webp 1600w">
      <video poster="assets/01-poster.jpg" data-sc-src="assets/01.mp4" data-sc-src-mobile="assets/01-m.mp4"></video>
      <a href="tel:+15555550100">Call</a> <a href="#top">Top</a> <a href="https://x.test/p">x</a>
      <img src="data:image/gif;base64,R0lGOD">
      <script src="scrollcraft.js"></script>`
    expect(referencedPaths(html)).toEqual([
      'assets/01-1600.webp',
      'assets/01-800.webp',
      'assets/01-m.mp4',
      'assets/01-poster.jpg',
      'assets/01.mp4',
      'assets/01.webp',
      'assets/b.webp',
      'assets/open.svg',
      'fonts/Geist.woff2',
      'scrollcraft.css',
      'scrollcraft.js',
    ])
  })
})

describe('copyScrollBuild', () => {
  it('ships the fixture: index.html, the engine and the referenced asset, nothing else', () => {
    const dest = join(scratch(), 'scroll')
    const copied = copyScrollBuild(FIXTURE, dest)
    expect(copied.files).toEqual(['assets/open.svg', 'index.html', 'scrollcraft.css', 'scrollcraft.js'])
    expect(copied.bytes).toBeGreaterThan(80_000)
    for (const f of copied.files) expect(existsSync(join(dest, ...f.split('/')))).toBe(true)
    expect(existsSync(join(dest, 'LICENSE'))).toBe(false)
    // Served at /scroll (no slash) too, so the shipped page pins its relative paths to /scroll/.
    const shipped = readFileSync(join(dest, 'index.html'), 'utf8')
    expect(shipped).toMatch(/<head>\s*<base href="\/scroll\/" \/>/)
    expect(readFileSync(join(FIXTURE, 'index.html'), 'utf8')).not.toContain('<base')
  })

  it('adds a <base> only when the page has none', () => {
    expect(withBase('<html><head lang="en"><title>x</title></head></html>')).toBe('<html><head lang="en">\n    <base href="/scroll/" /><title>x</title></head></html>')
    const own = '<html><head><base href="/elsewhere/"></head></html>'
    expect(withBase(own)).toBe(own)
  })

  it('leaves notes, verify artifacts, dependencies and unreferenced assets behind, and empties the destination first', () => {
    const build = scratch()
    put(build, 'index.html', '<link href="scrollcraft.css"><img src="assets/a.webp"><script src="scrollcraft.js"></script>')
    put(build, 'scrollcraft.js')
    put(build, 'scrollcraft.css')
    put(build, 'assets/a.webp')
    put(build, 'assets/unused.webp')
    put(build, 'assets/notes.md')
    put(build, 'BRIEF.md')
    put(build, 'sheet.png')
    put(build, 'sheet-2.png')
    put(build, 'verify/01.png')
    put(build, 'node_modules/x/index.js')
    const dest = join(scratch(), 'scroll')
    put(dest, 'stale.txt')
    const copied = copyScrollBuild(build, dest)
    expect(copied.files).toEqual(['assets/a.webp', 'index.html', 'scrollcraft.css', 'scrollcraft.js'])
    expect(existsSync(join(dest, 'stale.txt'))).toBe(false)
    for (const gone of ['assets/unused.webp', 'assets/notes.md', 'BRIEF.md', 'sheet.png', 'verify/01.png', 'node_modules/x/index.js']) {
      expect(existsSync(join(dest, ...gone.split('/'))), gone).toBe(false)
    }
  })

  it('fails, naming them, when the page references a missing file, a file outside assets/ and fonts/, or one on the never list', () => {
    const build = scratch()
    put(build, 'index.html', '<img src="assets/missing.webp"><img src="logo.png"><a href="BRIEF.md">brief</a><img src="../outside.png">')
    put(build, 'logo.png')
    put(build, 'BRIEF.md')
    const dest = join(scratch(), 'scroll')
    expect(() => copyScrollBuild(build, dest)).toThrow(/4 file\(s\) that cannot ship: \.\.\/outside\.png, BRIEF\.md, assets\/missing\.webp, logo\.png/)
    expect(existsSync(dest)).toBe(false)
  })

  it('refuses a folder with no index.html', () => {
    const build = scratch()
    expect(() => copyScrollBuild(build, join(scratch(), 'scroll'))).toThrow(/index\.html not found/)
  })
})

describe('card.json', () => {
  const swatches = ['#13110E', '#EFE9DD', '#4DA3FF', '#a79f90']

  function build(card?: string): string {
    const dir = scratch()
    put(dir, 'index.html', '<link href="scrollcraft.css"><script src="scrollcraft.js"></script>')
    put(dir, 'scrollcraft.js')
    put(dir, 'scrollcraft.css')
    if (card !== undefined) put(dir, 'card.json', card)
    return dir
  }

  it('is optional: no card.json reads as null and ships nothing', () => {
    const dir = build()
    expect(readScrollCard(dir)).toBeNull()
    const dest = join(scratch(), 'scroll')
    expect(copyScrollBuild(dir, dest).files).toEqual(['index.html', 'scrollcraft.css', 'scrollcraft.js'])
    expect(existsSync(join(dest, 'card.json'))).toBe(false)
  })

  it('reads the description, trimmed, and the four swatches, and nothing else', () => {
    const dir = build(JSON.stringify({ description: '  Drawn like a cross-section.  ', swatches, notes: 'stays behind' }))
    expect(readScrollCard(dir)).toEqual({ description: 'Drawn like a cross-section.', swatches })
  })

  it('ships at card.json next to index.html, as read', () => {
    const dir = build(JSON.stringify({ description: 'Drawn like a cross-section.', swatches, notes: 'stays behind' }))
    const dest = join(scratch(), 'scroll')
    const copied = copyScrollBuild(dir, dest)
    expect(copied.files).toEqual(['card.json', 'index.html', 'scrollcraft.css', 'scrollcraft.js'])
    expect(JSON.parse(readFileSync(join(dest, 'card.json'), 'utf8'))).toEqual({ description: 'Drawn like a cross-section.', swatches })
  })

  it('takes a description of up to 140 characters, and #rgb or #rrggbb swatches', () => {
    expect(readScrollCard(build(JSON.stringify({ description: 'x'.repeat(140), swatches: ['#000', '#fff', '#0b1f3a', '#FF6A1A'] })))?.description).toHaveLength(140)
  })

  it.each([
    ['not JSON', '{ description: nope', /card\.json is not valid JSON/],
    ['not an object', '["#000"]', /must be an object/],
    ['no description', JSON.stringify({ swatches }), /"description" must be a non-empty string/],
    ['a blank description', JSON.stringify({ description: '   ', swatches }), /"description" must be a non-empty string/],
    ['a 141-character description', JSON.stringify({ description: 'x'.repeat(141), swatches }), /"description" is 141 characters; the most is 140/],
    ['three swatches', JSON.stringify({ description: 'x', swatches: swatches.slice(0, 3) }), /"swatches" must be 4 hex colours/],
    ['a swatch that is not hex', JSON.stringify({ description: 'x', swatches: ['#13110E', 'navy', '#4DA3FF', 7] }), /not "navy", 7/],
  ])('fails, and the copy leaves the destination alone, on %s', (_name, text, error) => {
    const dir = build(text)
    expect(() => readScrollCard(dir)).toThrow(error)
    const dest = join(scratch(), 'scroll')
    put(dest, 'stale.txt')
    expect(() => copyScrollBuild(dir, dest)).toThrow(error)
    expect(existsSync(join(dest, 'stale.txt'))).toBe(true)
  })
})
