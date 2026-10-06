/// <reference types="node" />
import { existsSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { previewFor } from './previews'
import { variants } from '../variants/variants'

const publicDir = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public')

describe('previews', () => {
  it('maps a slug to its desktop and phone screenshot paths', () => {
    expect(previewFor('heritage')).toEqual({
      desktop: '/previews/heritage.jpg',
      mobile: '/previews/heritage-mobile.jpg',
    })
  })

  // The JPGs are committed build artifacts from `npm run shots`; a new
  // variant without them would render an empty frame on the picker.
  for (const variant of variants) {
    it(`has both /${variant.slug} screenshots on disk`, () => {
      const { desktop, mobile } = previewFor(variant.slug)
      for (const path of [desktop, mobile]) {
        const file = join(publicDir, path)
        expect(existsSync(file), file).toBe(true)
        expect(statSync(file).size, file).toBeGreaterThan(0)
      }
    })
  }
})
