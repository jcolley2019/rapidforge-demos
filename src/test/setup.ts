import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// jsdom has no IntersectionObserver; the variants' Reveal components
// construct one on mount, so provide an inert stand-in.
if (typeof globalThis.IntersectionObserver === 'undefined') {
  class InertIntersectionObserver {
    readonly root = null
    readonly rootMargin = ''
    readonly thresholds: ReadonlyArray<number> = []
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] {
      return []
    }
  }
  globalThis.IntersectionObserver =
    InertIntersectionObserver as unknown as typeof IntersectionObserver
}

afterEach(() => {
  cleanup()
})
