import type { ComponentType } from 'react'
import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { DesignBriefSchema } from '../brief/design-brief'
import acme from '../brief/fixtures/acme-plumbing.json'
import { SiteContext } from '../brief/site-context'
import { toSiteContent, type SiteContent } from '../brief/site-content'
import WsNav from './aerial/WsNav'
import ClNav from './cleanpro/ClNav'
import DhNav from './geospatial/DhNav'
import PpNav from './heritage/PpNav'
import IsNav from './texas/IsNav'

const NAVS: Array<[name: string, Nav: ComponentType]> = [
  ['heritage', PpNav],
  ['geospatial', DhNav],
  ['cleanpro', ClNav],
  ['texas', IsNav],
  ['aerial', WsNav],
]

const acmeBrief = DesignBriefSchema.parse(acme)
const PHONE = acmeBrief.phone!
const TEL = 'tel:2085550142'
const booking = toSiteContent(acmeBrief)
/** All Plumbing & Sewer's shape: the brief's one action is "Call <phone>". */
const callFirst = toSiteContent({ ...acmeBrief, primary_cta: { label: `Call ${PHONE}`, kind: 'phone', href: TEL } })

function navOf(site: SiteContent, Nav: ComponentType): Element {
  render(
    <SiteContext.Provider value={site}>
      <Nav />
    </SiteContext.Provider>,
  )
  return document.querySelector('header')!
}

describe('variant nav phone', () => {
  for (const [name, Nav] of NAVS) {
    it(`${name}: shows the phone once, on the button, when the action is the call`, () => {
      const nav = navOf(callFirst, Nav)
      expect(nav.textContent?.split(PHONE).length).toBe(2)
      const calls = [...nav.querySelectorAll(`a[href="${TEL}"]`)]
      expect(calls.map((a) => a.textContent)).toEqual([`Call ${PHONE}`])
    })

    it(`${name}: keeps the number beside a booking button`, () => {
      const nav = navOf(booking, Nav)
      expect(nav.querySelector(`a[href="${TEL}"]`)?.textContent).toContain(PHONE)
      expect([...nav.querySelectorAll('a')].some((a) => a.textContent === booking.navCtaLabel)).toBe(true)
    })
  }
})
