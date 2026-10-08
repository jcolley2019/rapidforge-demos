import { describe, expect, it } from 'vitest'
import { photoSrcSet, sizedPhotoName } from './photo-sizes'

describe('sizedPhotoName', () => {
  it('names the smaller copies beside the 1600 one', () => {
    expect(sizedPhotoName('photos/01.jpg', 800)).toBe('photos/01-800.jpg')
    expect(sizedPhotoName('photos/01.jpg', 1200)).toBe('photos/01-1200.jpg')
    expect(sizedPhotoName('photos/01.jpg', 1600)).toBe('photos/01.jpg')
  })
})

describe('photoSrcSet', () => {
  it("lists an intake photo's three files", () => {
    expect(photoSrcSet('/leads/goodson-plumbing/photos/03.jpg')).toBe(
      '/leads/goodson-plumbing/photos/03-800.jpg 800w, /leads/goodson-plumbing/photos/03-1200.jpg 1200w, /leads/goodson-plumbing/photos/03.jpg 1600w',
    )
  })

  it('asks Unsplash for the same widths, keeping the rest of the query', () => {
    expect(photoSrcSet('https://images.unsplash.com/photo-1676210134188-4c05dd172f89?w=1600&q=80')).toBe(
      [800, 1200, 1600].map((w) => `https://images.unsplash.com/photo-1676210134188-4c05dd172f89?w=${w}&q=80 ${w}w`).join(', '),
    )
  })

  it('gives any other photo none', () => {
    expect(photoSrcSet('https://acme-plumbing.example/images/crew.jpg')).toBeUndefined()
    expect(photoSrcSet('/leads/goodson-plumbing/logo.png')).toBeUndefined()
    expect(photoSrcSet('/leads/goodson-plumbing/current-desktop.jpg')).toBeUndefined()
  })
})
