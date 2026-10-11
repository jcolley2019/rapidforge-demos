import { describe, expect, it } from 'vitest'
import { bestLandscapePhoto, isIntakePhoto, photoSrcSet, sizedPhotoName } from './photo-sizes'

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

describe('isIntakePhoto', () => {
  it('knows the plain files intake wrote and nothing else', () => {
    expect(isIntakePhoto('/leads/goodson-plumbing/photos/03.jpg')).toBe(true)
    expect(isIntakePhoto('/leads/goodson-plumbing/photos/03-800.jpg')).toBe(false)
    expect(isIntakePhoto('/leads/goodson-plumbing/logo.png')).toBe(false)
    expect(isIntakePhoto('https://images.unsplash.com/photo-1?w=1600')).toBe(false)
  })
})

describe('bestLandscapePhoto', () => {
  const a = '/leads/x/photos/01.jpg'
  const b = '/leads/x/photos/02.jpg'
  const c = '/leads/x/photos/03.jpg'

  it('takes the widest landscape photo at least 1200px wide', () => {
    const sizes = { [a]: { width: 1200, height: 800 }, [b]: { width: 1600, height: 1067 }, [c]: { width: 1400, height: 900 } }
    expect(bestLandscapePhoto([a, b, c], sizes)).toBe(b)
  })

  it('keeps rank order on a tie, so a crew photo listed first wins', () => {
    const sizes = { [a]: { width: 1600, height: 900 }, [b]: { width: 1600, height: 1067 } }
    expect(bestLandscapePhoto([a, b], sizes)).toBe(a)
    expect(bestLandscapePhoto([b, a], sizes)).toBe(b)
  })

  it('skips portrait, square, narrow and unmeasured photos', () => {
    const sizes = { [a]: { width: 1067, height: 1600 }, [b]: { width: 1400, height: 1400 }, [c]: { width: 1199, height: 700 } }
    expect(bestLandscapePhoto([a, b, c, '/leads/x/photos/04.jpg'], sizes)).toBeUndefined()
    expect(bestLandscapePhoto([a], {})).toBeUndefined()
  })
})
