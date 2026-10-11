// @vitest-environment node
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import sharp from 'sharp'
import { afterEach, describe, expect, it } from 'vitest'
import { leadBriefSource, measureLeadPhotos } from './lead-brief-plugin'

const roots: string[] = []

function tempRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'rfd-lead-brief-'))
  roots.push(root)
  return root
}

async function writePhoto(root: string, url: string, width: number, height: number): Promise<void> {
  const file = join(root, 'public', url)
  mkdirSync(join(file, '..'), { recursive: true })
  writeFileSync(file, await sharp({ create: { width, height, channels: 3, background: '#336699' } }).jpeg().toBuffer())
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

describe('measureLeadPhotos', () => {
  it("sizes the brief's intake photos from public/ and skips anything else", async () => {
    const root = tempRoot()
    await writePhoto(root, '/leads/acme/photos/01.jpg', 1600, 1067)
    await writePhoto(root, '/leads/acme/photos/02.jpg', 900, 1350)
    const sizes = await measureLeadPhotos(
      {
        crew_photo_urls: ['/leads/acme/photos/02.jpg'],
        photo_urls: ['/leads/acme/photos/01.jpg', '/leads/acme/photos/03.jpg', 'https://images.unsplash.com/photo-1?w=1600', 7],
      },
      root,
    )
    expect(sizes).toEqual({
      '/leads/acme/photos/01.jpg': { width: 1600, height: 1067 },
      '/leads/acme/photos/02.jpg': { width: 900, height: 1350 },
    })
  })

  it('measures nothing for a brief without intake photos', async () => {
    expect(await measureLeadPhotos({ photo_urls: [], crew_photo_urls: [] }, tempRoot())).toEqual({})
    expect(await measureLeadPhotos(null, tempRoot())).toEqual({})
  })
})

describe('leadBriefSource', () => {
  it('exports a null brief and no photo sizes for a non-lead build', async () => {
    const source = await leadBriefSource('acme-plumbing', tempRoot())
    expect(source.stem).toBeNull()
    expect(source.code).toContain('export default null')
    expect(source.code).toContain('export const photoSizes = {}')
  })

  it("exports the lead's brief with its photo sizes", async () => {
    const root = tempRoot()
    const brief = { business_name: 'Acme', photo_urls: ['/leads/acme/photos/01.jpg'], crew_photo_urls: [] }
    mkdirSync(join(root, 'src', 'brief', 'fixtures'), { recursive: true })
    writeFileSync(join(root, 'src', 'brief', 'fixtures', 'lead-acme.json'), JSON.stringify(brief))
    await writePhoto(root, '/leads/acme/photos/01.jpg', 1600, 900)
    const source = await leadBriefSource('lead-acme', root)
    expect(source.stem).toBe('lead-acme')
    expect(source.code).toContain(`export default ${JSON.stringify(brief)}`)
    expect(source.code).toContain('export const photoSizes = {"/leads/acme/photos/01.jpg":{"width":1600,"height":900}}')
  })

  it('fails the build for a lead with no fixture', async () => {
    await expect(leadBriefSource('lead-missing', tempRoot())).rejects.toThrow(/no fixture/)
  })
})
