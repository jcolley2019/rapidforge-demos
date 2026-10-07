// @vitest-environment node
import { readFileSync } from 'node:fs'
import * as cheerio from 'cheerio'
import { describe, expect, it } from 'vitest'
import { extractBrandColors, extractLogo, extractSite, isNeutral, normalizeColor, to12h } from './extract'

const HOME = 'https://acme-plumbing.example/'
const html = readFileSync(new URL('../../tests/fixtures/intake/acme-site.html', import.meta.url), 'utf8')
const ex = extractSite({ homeUrl: HOME, pages: [{ url: HOME, html }], stylesheets: [], failures: [] }, new Date('2026-10-06'))

describe('extractSite on the synthetic Acme homepage', () => {
  it('reads the phone from the tel: link', () => {
    expect(ex.phone).toEqual({ value: '(208) 555-0142', how: 'tel: link' })
  })

  it('reads the hours from JSON-LD openingHours, Sunday closed', () => {
    expect(ex.hours?.how).toBe('JSON-LD openingHours')
    expect(ex.hours?.value).toEqual([
      { day: 'Monday', open: '7:00 AM', close: '6:00 PM' },
      { day: 'Tuesday', open: '7:00 AM', close: '6:00 PM' },
      { day: 'Wednesday', open: '7:00 AM', close: '6:00 PM' },
      { day: 'Thursday', open: '7:00 AM', close: '6:00 PM' },
      { day: 'Friday', open: '7:00 AM', close: '6:00 PM' },
      { day: 'Saturday', open: '8:00 AM', close: '2:00 PM' },
      { day: 'Sunday', open: null, close: null },
    ])
  })

  it('reads the license number, not "Licensed"', () => {
    expect(ex.license?.value).toBe('PL-12345')
  })

  it('reads the founding year', () => {
    expect(ex.foundedYear?.value).toBe(1998)
  })

  it('reads both JSON-LD reviews and the aggregate rating', () => {
    expect(ex.reviews?.value).toEqual([
      { text: 'Showed up within the hour and had our water heater back on before dinner.', rating: 5, author: 'Dana R.' },
      { text: 'Found a slab leak two other companies missed and explained every step.', rating: 4, author: 'Marcus T.' },
    ])
    expect(ex.rating?.value).toEqual({ value: '4.9', count: 312 })
  })

  it('reads the service areas from the "Serving …" sentence', () => {
    expect(ex.serviceAreas?.value).toEqual(['Boise', 'Meridian', 'Nampa'])
  })

  it('offers the nav services and h3 headings as candidates, without site chrome', () => {
    expect(ex.serviceCandidates).toEqual(
      expect.arrayContaining([
        'Drain Cleaning',
        'Water Heater Repair',
        'Leak Detection',
        'Sewer Line Repair',
        'Water Heater Installation',
        'Emergency Plumbing',
      ]),
    )
    for (const chrome of ['Home', 'About Us', 'Reviews', 'Contact', 'Our Services', '(208) 555-0142']) {
      expect(ex.serviceCandidates).not.toContain(chrome)
    }
  })

  it('picks the img marked "logo", resolved against the page', () => {
    expect(ex.logoUrl).toEqual({ value: 'https://acme-plumbing.example/images/acme-mark.png', how: 'img marked "logo"' })
  })

  it('ranks the --brand color first and leaves out white, black and grays', () => {
    expect(ex.brandColors?.value).toEqual(['#1d4ed8', '#f97316'])
  })

  it('reads name, address, vertical, booking link, 24/7 note and signals', () => {
    expect(ex.businessName).toEqual({ value: 'Acme Plumbing', how: 'JSON-LD name' })
    expect(ex.address?.value).toBe('1480 Caldwell Blvd, Nampa, ID 83651')
    expect(ex.vertical?.value).toBe('plumbing')
    expect(ex.cta?.value).toEqual({ label: 'Book Online', kind: 'booking', href: 'https://acme-plumbing.example/book' })
    expect(ex.hoursNote?.value).toBe('24/7 emergency service')
    expect(ex.signals).toEqual({
      hasTelLink: true,
      hasViewport: true,
      isHttps: true,
      hasHours: true,
      hasBooking: true,
    })
  })
})

describe('extractLogo pick order', () => {
  const page = (head: string, body = '') => cheerio.load(`<html><head>${head}</head><body>${body}</body></html>`)
  const icons =
    '<link rel="icon" href="/favicon-32.png" sizes="32x32"><link rel="apple-touch-icon" href="/apple.png"><link rel="icon" href="/icon-192.png" sizes="192x192">'
  const og = '<meta property="og:image" content="/share.jpg">'

  it('takes an img whose src, alt or class says logo first', () => {
    const $ = page(og + icons, '<img src="/hero.jpg"><img src="/brand.png" alt="Company logo">')
    expect(extractLogo($, HOME)?.value).toBe('https://acme-plumbing.example/brand.png')
  })

  it('falls back to og:image', () => {
    const $ = page(og + icons, '<img src="/hero.jpg" alt="A kitchen">')
    expect(extractLogo($, HOME)).toEqual({ value: 'https://acme-plumbing.example/share.jpg', how: 'og:image' })
  })

  it('then to the largest icon', () => {
    expect(extractLogo(page(icons), HOME)).toEqual({
      value: 'https://acme-plumbing.example/icon-192.png',
      how: 'largest icon (192px)',
    })
  })

  it('returns null when the page has none of them', () => {
    expect(extractLogo(page(''), HOME)).toBeNull()
  })
})

describe('brand colors', () => {
  it('excludes white, black and grays, including tinted grays', () => {
    const css = '.a{color:#fff}.b{color:#000}.c{color:#777}.d{color:#f5f5f5}.e{color:#111827}.f{color:#374151}.g{color:#ea580c}'
    expect(extractBrandColors([css])).toEqual(['#ea580c'])
    for (const gray of ['#ffffff', '#000000', '#777777', '#111827', '#374151', '#6b7280']) expect(isNeutral(gray), gray).toBe(true)
    for (const hue of ['#1d4ed8', '#ea580c', '#0b3d91']) expect(isNeutral(hue), hue).toBe(false)
  })

  it('counts var() references to a custom property, keeps four, ignores selectors and WP presets', () => {
    const css = [
      ':root{--brand:#0b3d91;--wp--preset--color--vivid-red:#cf2e2e}',
      '.x{color:var(--brand)}.y{background:var(--brand)}.z{border-color:var(--brand)}',
      '.has-red{color:var(--wp--preset--color--vivid-red)}',
      '#face .q{color:#16a34a}.r{color:#16a34a}.s{color:#9333ea}.t{color:#db2777}.u{color:#ca8a04}',
    ].join('')
    expect(extractBrandColors([css])).toEqual(['#0b3d91', '#16a34a', '#9333ea', '#db2777'])
  })

  it('ignores default link colors', () => {
    expect(extractBrandColors(['a{color:#0000ee}a:visited{color:#551a8b}p a{color:rgba(0,0,255,1)}.btn{background:#c12726}'])).toEqual(['#c12726'])
  })

  it('normalizes hex, rgb and hsl, and drops mostly transparent colors', () => {
    expect(normalizeColor('#1D4ED8')).toBe('#1d4ed8')
    expect(normalizeColor('#abc')).toBe('#aabbcc')
    expect(normalizeColor('rgb(29, 78, 216)')).toBe('#1d4ed8')
    expect(normalizeColor('rgba(29 78 216 / 20%)')).toBeNull()
    expect(normalizeColor('hsl(0, 100%, 50%)')).toBe('#ff0000')
    expect(normalizeColor('red')).toBeNull()
  })
})

describe('to12h', () => {
  it('reads 24-hour and am/pm times', () => {
    expect(to12h('07:00')).toBe('7:00 AM')
    expect(to12h('18:30')).toBe('6:30 PM')
    expect(to12h('00:00')).toBe('12:00 AM')
    expect(to12h('12:00')).toBe('12:00 PM')
    expect(to12h('7am')).toBe('7:00 AM')
    expect(to12h('5:30 p.m.')).toBe('5:30 PM')
    expect(to12h('closed')).toBeNull()
  })
})
