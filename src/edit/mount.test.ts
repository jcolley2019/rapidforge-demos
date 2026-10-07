import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CONNECT_SRC, DEFAULT_WEBEDIT_ORIGINS, mountWebEdit, parseOrigins } from './mount'

const ownParent = Object.getOwnPropertyDescriptor(window, 'parent')

function frame() {
  Object.defineProperty(window, 'parent', { value: {}, configurable: true })
}

function tags() {
  return document.head.querySelectorAll(`script[src="${CONNECT_SRC}"]`)
}

beforeEach(() => {
  window.history.replaceState(null, '', '/cleanpro?edit')
})

afterEach(() => {
  vi.unstubAllEnvs()
  if (ownParent) Object.defineProperty(window, 'parent', ownParent)
  else Reflect.deleteProperty(window, 'parent')
  for (const tag of tags()) tag.remove()
  delete window.__WEBEDIT_ORIGINS
  window.history.replaceState(null, '', '/')
})

describe('mountWebEdit', () => {
  it('adds no script when the page is not framed', () => {
    vi.stubEnv('VITE_EDIT', '1')
    expect(window.parent).toBe(window)
    mountWebEdit()
    expect(tags()).toHaveLength(0)
  })

  it('adds no script when framed with ?edit but VITE_EDIT is unset and not DEV', () => {
    vi.stubEnv('DEV', false)
    vi.stubEnv('VITE_EDIT', undefined)
    frame()
    mountWebEdit()
    expect(tags()).toHaveLength(0)
    expect(window.__WEBEDIT_ORIGINS).toBeUndefined()
  })

  it('adds no script when framed with VITE_EDIT=1 but no ?edit', () => {
    vi.stubEnv('DEV', false)
    vi.stubEnv('VITE_EDIT', '1')
    window.history.replaceState(null, '', '/cleanpro')
    frame()
    mountWebEdit()
    expect(tags()).toHaveLength(0)
  })

  it('adds exactly one script when framed with ?edit and VITE_EDIT=1, even when called twice', () => {
    vi.stubEnv('DEV', false)
    vi.stubEnv('VITE_EDIT', '1')
    frame()
    mountWebEdit()
    mountWebEdit()
    expect(tags()).toHaveLength(1)
    expect(window.__WEBEDIT_ORIGINS).toEqual(DEFAULT_WEBEDIT_ORIGINS)
  })

  it('takes the allowlist from VITE_WEBEDIT_ORIGINS', () => {
    vi.stubEnv('DEV', false)
    vi.stubEnv('VITE_EDIT', '1')
    vi.stubEnv('VITE_WEBEDIT_ORIGINS', 'https://edit.rapidforge.ai, http://localhost:5173/')
    frame()
    mountWebEdit()
    expect(window.__WEBEDIT_ORIGINS).toEqual(['https://edit.rapidforge.ai', 'http://localhost:5173'])
  })
})

describe('parseOrigins', () => {
  it('splits on commas, trims, drops blanks and trailing slashes', () => {
    expect(parseOrigins(' https://a.example/ ,, http://localhost:5174 ')).toEqual(['https://a.example', 'http://localhost:5174'])
  })

  it('falls back to the localhost list when unset or blank', () => {
    expect(parseOrigins(undefined)).toEqual(DEFAULT_WEBEDIT_ORIGINS)
    expect(parseOrigins('')).toEqual(DEFAULT_WEBEDIT_ORIGINS)
    expect(parseOrigins(' , ')).toEqual(DEFAULT_WEBEDIT_ORIGINS)
    expect(DEFAULT_WEBEDIT_ORIGINS).toEqual([
      'http://localhost:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
    ])
  })
})
