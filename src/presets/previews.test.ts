/// <reference types="node" />
import { existsSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { PRESET_VERTICALS } from './presets'
import { previewFor } from './previews'
import { variants } from '../variants/variants'

const publicDir = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public')

describe('previews', () => {
  it('maps a slug to its desktop and phone screenshot paths under the vertical', () => {
    expect(previewFor('heritage')).toEqual({
      desktop: '/previews/plumbing/heritage.jpg',
      mobile: '/previews/plumbing/heritage-mobile.jpg',
    })
    expect(previewFor('texas', 'hvac')).toEqual({
      desktop: '/previews/hvac/texas.jpg',
      mobile: '/previews/hvac/texas-mobile.jpg',
    })
    expect(previewFor('aerial', 'electrician')).toEqual({
      desktop: '/previews/electrical/aerial.jpg',
      mobile: '/previews/electrical/aerial-mobile.jpg',
    })
  })

  it('keeps the plumbing paths as they were, with the vertical segment inserted', () => {
    for (const v of variants) {
      const before = { desktop: `/previews/${v.slug}.jpg`, mobile: `/previews/${v.slug}-mobile.jpg` }
      const insert = (p: string) => p.replace('/previews/', '/previews/plumbing/')
      expect(previewFor(v.slug, 'plumbing')).toEqual({ desktop: insert(before.desktop), mobile: insert(before.mobile) })
      // A vertical without presets of its own shows the plumbing shots.
      expect(previewFor(v.slug, 'roofing')).toEqual(previewFor(v.slug, 'plumbing'))
    }
  })

  // The JPGs are committed build artifacts from `npm run shots`; a new
  // variant or vertical without them would render an empty frame on the picker.
  for (const vertical of PRESET_VERTICALS) {
    for (const variant of variants) {
      it(`has both ${vertical}/${variant.slug} screenshots on disk`, () => {
        const { desktop, mobile } = previewFor(variant.slug, vertical)
        for (const path of [desktop, mobile]) {
          const file = join(publicDir, path)
          expect(existsSync(file), file).toBe(true)
          expect(statSync(file).size, file).toBeGreaterThan(0)
        }
      })
    }
  }
})
