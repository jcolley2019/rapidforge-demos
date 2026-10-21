import { useRef } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render } from '@testing-library/react'
import OverlayHeader from './OverlayHeader'

/** A stand-in IntersectionObserver the test drives by hand. */
let observed: Element[] = []
let disconnected = 0
let notify: (...entries: Pick<IntersectionObserverEntry, 'isIntersecting' | 'boundingClientRect'>[]) => void = () => {}

class ManualIntersectionObserver {
  constructor(callback: IntersectionObserverCallback) {
    notify = (...entries) => callback(entries as IntersectionObserverEntry[], this as unknown as IntersectionObserver)
  }
  observe(el: Element) {
    observed.push(el)
  }
  unobserve() {}
  disconnect() {
    disconnected++
  }
  takeRecords() {
    return []
  }
}

const rect = (bottom: number) => ({ bottom }) as DOMRectReadOnly

function Page() {
  const hero = useRef<HTMLElement>(null)
  return (
    <>
      <OverlayHeader hero={hero}>
        <header>nav</header>
      </OverlayHeader>
      <section ref={hero}>hero</section>
    </>
  )
}

/** jsdom has no AnimationEvent, so React listens for the prefixed name there. */
function animationEnd(el: Element) {
  fireEvent(el, new Event('webkitAnimationEnd', { bubbles: true }))
}

function mode() {
  return document.querySelector('[data-overlay-header]')!.getAttribute('data-overlay-header')
}

describe('OverlayHeader', () => {
  beforeEach(() => {
    observed = []
    disconnected = 0
    vi.stubGlobal('IntersectionObserver', ManualIntersectionObserver)
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('floats over the hero it watches, until the hero has scrolled away', () => {
    render(<Page />)
    expect(observed).toEqual([document.querySelector('section')])
    expect(mode()).toBe('over')
    expect(document.querySelector('.oh')!.classList.contains('oh-over')).toBe(true)

    act(() => notify({ isIntersecting: true, boundingClientRect: rect(400) }))
    expect(mode()).toBe('over')
    act(() => notify({ isIntersecting: false, boundingClientRect: rect(-1) }))
    expect(mode()).toBe('solid')
  })

  it('fades out when the hero comes back, then floats again', () => {
    render(<Page />)
    act(() => notify({ isIntersecting: false, boundingClientRect: rect(-1) }))
    act(() => notify({ isIntersecting: true, boundingClientRect: rect(20) }))
    expect(mode()).toBe('leaving')

    // A child's animation ending is not the header's fade.
    animationEnd(document.querySelector('header')!)
    expect(mode()).toBe('leaving')
    animationEnd(document.querySelector('.oh')!)
    expect(mode()).toBe('over')
  })

  it('goes by the latest entry when several arrive in one callback', () => {
    render(<Page />)
    const gone = { isIntersecting: false, boundingClientRect: rect(-1) }
    const back = { isIntersecting: true, boundingClientRect: rect(20) }
    act(() => notify(gone, back))
    expect(mode()).toBe('over')
    act(() => notify(back, gone))
    expect(mode()).toBe('solid')
  })

  it('turns solid again if the hero leaves while the header is still fading out', () => {
    render(<Page />)
    act(() => notify({ isIntersecting: false, boundingClientRect: rect(-1) }))
    act(() => notify({ isIntersecting: true, boundingClientRect: rect(20) }))
    act(() => notify({ isIntersecting: false, boundingClientRect: rect(-1) }))
    expect(mode()).toBe('solid')
  })

  it('listens to no scroll events and lets go of the observer on unmount', () => {
    const onWindow = vi.spyOn(window, 'addEventListener')
    const onDocument = vi.spyOn(document, 'addEventListener')
    const { unmount } = render(<Page />)
    expect(onWindow.mock.calls.map(([type]) => type)).not.toContain('scroll')
    expect(onDocument.mock.calls.map(([type]) => type)).not.toContain('scroll')
    unmount()
    expect(disconnected).toBe(1)
  })
})
