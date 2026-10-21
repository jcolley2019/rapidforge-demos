// @vitest-environment node
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { copyScrollBuild, hasScrollBuild, referencedPaths, scrollBuildDir, scrollWorkspace, withBase } from './scroll'

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
