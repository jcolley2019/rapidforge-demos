// @vitest-environment node
import { readFileSync } from 'node:fs'
import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import { PHOTO_WIDTHS } from '../brief/photo-sizes'
import { collectPhotoUrls, isSameHostOrCdn, selectPhotos } from './photos'

const HOME = 'https://acme-plumbing.example/'

function image(width: number, height: number, color: string, format: 'jpeg' | 'png' = 'jpeg'): Promise<Buffer> {
  const channels = format === 'png' ? 4 : 3
  const base = sharp({ create: { width, height, channels, background: color } })
  return (format === 'png' ? base.png() : base.jpeg()).toBuffer()
}

describe('selectPhotos', () => {
  it('keeps photos at least 600px on the long edge, deduped by URL and by bytes, re-encoded as JPEG ≤ 1600px', async () => {
    const big = await image(1200, 800, '#336699')
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="2000" height="2000"><rect width="2000" height="2000"/></svg>')
    const kept = await selectPhotos([
      { url: 'https://acme-plumbing.example/a.jpg', buffer: big },
      { url: 'https://acme-plumbing.example/small.jpg', buffer: await image(500, 400, '#996633') },
      { url: 'https://acme-plumbing.example/tall.jpg', buffer: await image(1000, 2400, '#669933') },
      { url: 'https://acme-plumbing.example/a.jpg', buffer: await image(1300, 900, '#123456') },
      { url: 'https://acme-plumbing.example/a-copy.jpg', buffer: big },
      { url: 'https://acme-plumbing.example/vector.svg', buffer: svg },
      { url: 'https://acme-plumbing.example/broken.jpg', buffer: Buffer.from('not an image') },
      { url: 'https://acme-plumbing.example/cutout.png', buffer: await image(800, 600, '#cc000080', 'png') },
      { url: 'https://acme-plumbing.example/edge.jpg', buffer: await image(600, 450, '#445566') },
    ])

    expect(kept.map((p) => p.url.replace(HOME, ''))).toEqual(['a.jpg', 'tall.jpg', 'cutout.png', 'edge.jpg'])
    for (const photo of kept) {
      expect(photo.jpeg.subarray(0, 2).toString('hex')).toBe('ffd8')
      expect(Math.max(photo.width, photo.height)).toBeLessThanOrEqual(1600)
      expect(Math.max(photo.width, photo.height)).toBeGreaterThanOrEqual(600)
    }
    const tall = kept.find((p) => p.url.endsWith('tall.jpg'))!
    expect([tall.width, tall.height]).toEqual([667, 1600])
    const original = kept.find((p) => p.url.endsWith('a.jpg'))!
    expect([original.width, original.height]).toEqual([1200, 800])
  })

  it("makes the srcset's 800 and 1200px-wide copies of each kept photo, never wider than the 1600 one", async () => {
    const [wide, tall, edge] = await selectPhotos([
      { url: `${HOME}wide.jpg`, buffer: await image(2400, 1600, '#336699') },
      { url: `${HOME}tall.jpg`, buffer: await image(1000, 2400, '#669933') },
      { url: `${HOME}edge.jpg`, buffer: await image(900, 600, '#445566') },
    ])
    const sizesOf = async (photo: typeof wide) =>
      Promise.all(
        [...photo.smaller.map((s) => s.jpeg), photo.jpeg].map(async (jpeg) => {
          const { width, height, format } = await sharp(jpeg).metadata()
          return { width, height, format }
        }),
      )

    expect(wide.smaller.map((s) => s.cap)).toEqual(PHOTO_WIDTHS.filter((w) => w < 1600))
    expect(await sizesOf(wide)).toEqual([
      { width: 800, height: 533, format: 'jpeg' },
      { width: 1200, height: 800, format: 'jpeg' },
      { width: 1600, height: 1067, format: 'jpeg' },
    ])
    // A portrait photo's 1600 is 667 wide, so its copies are too: no blurry 333px tile.
    expect((await sizesOf(tall)).map((s) => s.width)).toEqual([667, 667, 667])
    // A 900px photo is not enlarged: its 1200 and 1600 copies stay 900 wide.
    expect((await sizesOf(edge)).map((s) => s.width)).toEqual([800, 900, 900])
  })
})

describe('collectPhotoUrls', () => {
  it('takes the fixture homepage photos, logo excluded, og:image deduped', () => {
    const html = readFileSync(new URL('../../tests/fixtures/intake/acme-site.html', import.meta.url), 'utf8')
    expect(collectPhotoUrls([{ url: HOME, html }], HOME)).toEqual([
      'https://acme-plumbing.example/images/crew.jpg',
      'https://acme-plumbing.example/images/van.jpg',
      'https://cdn.acme-plumbing.example/uploads/job-repipe.jpg',
    ])
  })

  it('drops svg, gif and icons, other hosts and tiny images; takes the largest srcset source', () => {
    const html = `
      <img src="/img/hero-800.jpg" srcset="/img/hero-800.jpg 800w, /img/hero-1600.jpg 1600w">
      <img src="/img/shape.svg"><img src="/img/spinner.gif"><img src="/img/phone-icon.png">
      <img src="/img/check.png" class="feature-icon"><img src="/img/thumb.jpg" width="48" height="48">
      <img src="https://other-business.example/photo.jpg">
      <img src="data:image/gif;base64,R0lGOD" data-src="/img/lazy.jpg">
      <img src="https://d123.cloudfront.net/team.jpg">
      <img src="/img/hero-1600.jpg">`
    expect(collectPhotoUrls([{ url: HOME, html }], HOME)).toEqual([
      'https://acme-plumbing.example/img/hero-1600.jpg',
      'https://acme-plumbing.example/img/lazy.jpg',
      'https://d123.cloudfront.net/team.jpg',
    ])
  })

  it('takes CSS background photos from style attributes, data-background-image and <style> blocks', () => {
    const html = `
      <style>.hero{background-image:url('/img/hero-crew.jpg')}.tex{background:url(data:image/png;base64,AAA)}.ico{background:url(/img/arrow-icon.png)}</style>
      <section style="background-image: url(&quot;/img/section.jpg&quot;)"></section>
      <div data-background-image="https://le-cdn.example-cdn.net/img/water.jpg"></div>
      <img src="/img/inline.jpg">`
    expect(collectPhotoUrls([{ url: HOME, html }], HOME)).toEqual([
      'https://acme-plumbing.example/img/section.jpg',
      'https://le-cdn.example-cdn.net/img/water.jpg',
      'https://acme-plumbing.example/img/inline.jpg',
      'https://acme-plumbing.example/img/hero-crew.jpg',
    ])
  })

  it('treats the site host, its subdomains and image CDNs as the site', () => {
    expect(isSameHostOrCdn('https://www.acme-plumbing.example/x.jpg', HOME)).toBe(true)
    expect(isSameHostOrCdn('https://images.acme-plumbing.example/x.jpg', HOME)).toBe(true)
    expect(isSameHostOrCdn('https://static.wixstatic.com/media/x.jpg', HOME)).toBe(true)
    expect(isSameHostOrCdn('https://images.unsplash.com/x.jpg', HOME)).toBe(false)
  })
})
