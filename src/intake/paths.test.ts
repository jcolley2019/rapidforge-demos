// @vitest-environment node
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { pickLinkedPages } from './fetch'
import { assertLeadPath, defaultSlug, leadPaths, slugify } from './paths'

const root = resolve('/repo')

describe('lead paths', () => {
  it('slugs a business name, else the hostname', () => {
    expect(slugify('Goodson Plumbing & Drain, LLC')).toBe('goodson-plumbing-and-drain-llc')
    expect(defaultSlug('Señor Rooter', 'https://x.example/')).toBe('senor-rooter')
    expect(defaultSlug(undefined, 'https://www.acme-plumbing.example/')).toBe('acme-plumbing-example')
  })

  it('rejects a slug that could leave the lead folders', () => {
    for (const bad of ['../acme', 'acme/../../x', 'Acme', 'acme--x', '']) expect(() => leadPaths(root, bad)).toThrow()
  })

  it('allows writes only inside this lead’s three places', () => {
    const paths = leadPaths(root, 'acme')
    expect(paths.briefName).toBe('lead-acme')
    expect(() => assertLeadPath(paths, join(root, 'leads', 'acme', 'photos', '01.jpg'))).not.toThrow()
    expect(() => assertLeadPath(paths, join(root, 'public', 'leads', 'acme', 'logo.png'))).not.toThrow()
    expect(() => assertLeadPath(paths, join(root, 'src', 'brief', 'fixtures', 'lead-acme.json'))).not.toThrow()
    for (const outside of [
      join(root, 'leads', 'other', 'brief.json'),
      join(root, 'leads', 'acme-2', 'brief.json'),
      join(root, 'public', 'leads', 'acme'),
      join(root, 'leads', 'acme', '..', 'other', 'x.jpg'),
      join(root, 'src', 'brief', 'fixtures', 'acme-plumbing.json'),
    ]) {
      expect(() => assertLeadPath(paths, outside), outside).toThrow(/refusing/)
    }
  })
})

describe('pickLinkedPages', () => {
  it('takes one same-host link per hint first, then the rest, at most five', () => {
    const html = `
      <a href="/contact">Contact</a><a href="/services/drains">Drains</a><a href="/services/heaters">Heaters</a>
      <a href="https://other.example/about">About them</a><a href="/about-us#team">Our story (about)</a>
      <a href="/service-areas/">Areas we serve</a><a href="/reviews">Reviews</a><a href="/blog">Blog</a>
      <a href="/coupon.pdf">Services price list</a><a href="tel:2085550142">Call</a><a href="/services/sewer">Sewer</a>`
    expect(pickLinkedPages(html, 'https://www.acme.example/')).toEqual([
      'https://www.acme.example/services/drains',
      'https://www.acme.example/about-us',
      'https://www.acme.example/reviews',
      'https://www.acme.example/service-areas/',
      'https://www.acme.example/contact',
    ])
  })
})
