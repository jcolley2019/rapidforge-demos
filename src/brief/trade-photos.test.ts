import { describe, expect, it } from 'vitest'
import { TRADE_PHOTOS, allTradePhotoUrls } from './trade-photos'
import { hoursSummary } from './site-helpers'

describe('TRADE_PHOTOS', () => {
  it('holds four hero and four detail Unsplash URLs per family at 1600px', () => {
    for (const [family, set] of Object.entries(TRADE_PHOTOS)) {
      expect(set.hero, family).toHaveLength(4)
      expect(set.detail, family).toHaveLength(4)
      for (const url of [...set.hero, ...set.detail]) {
        expect(url).toMatch(/^https:\/\/images\.unsplash\.com\/photo-[0-9]+-[a-f0-9]+\?w=1600&q=80$/)
      }
    }
    const all = allTradePhotoUrls()
    expect(all).toHaveLength(32)
    expect(new Set(all).size).toBe(32)
  })
})

describe('hoursSummary', () => {
  it('folds consecutive days with the same hours', () => {
    const row = (day: string, open: string | null, close: string | null) => ({ day, open, close })
    const hours = [
      row('Monday', '7:00 AM', '6:00 PM'),
      row('Tuesday', '7:00 AM', '6:00 PM'),
      row('Wednesday', '7:00 AM', '6:00 PM'),
      row('Thursday', '7:00 AM', '6:00 PM'),
      row('Friday', '7:00 AM', '6:00 PM'),
      row('Saturday', '8:00 AM', '2:00 PM'),
      row('Sunday', null, null),
    ]
    expect(hoursSummary(hours)).toBe('Mon–Fri 7:00 AM – 6:00 PM · Sat 8:00 AM – 2:00 PM · Sun Closed')
    expect(hoursSummary(null)).toBeNull()
    expect(hoursSummary([])).toBeNull()
  })
})
