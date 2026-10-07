/**
 * Opt-in webedit hook. public/webedit-connect.js lets a webedit Viewer that
 * frames this page live-edit it over postMessage; this mounts it only when
 * the build allows it (dev, or VITE_EDIT=1 at build time), the page is
 * framed, and the URL carries ?edit. Anywhere else it does nothing, so a
 * normal visit to a deployed demo never loads the script.
 */

declare global {
  interface Window {
    /** The origins webedit-connect.js accepts messages from and posts to. */
    __WEBEDIT_ORIGINS?: string[]
  }
}

/** webedit's local dev servers: the allowlist when VITE_WEBEDIT_ORIGINS is unset. */
export const DEFAULT_WEBEDIT_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
]

export const CONNECT_SRC = '/webedit-connect.js'

/** Comma-separated origins, trimmed, trailing slashes dropped; blank or empty means the defaults. */
export function parseOrigins(value: string | undefined): string[] {
  const list = (value ?? '')
    .split(',')
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter(Boolean)
  return list.length > 0 ? list : DEFAULT_WEBEDIT_ORIGINS
}

export function mountWebEdit(): void {
  const env = import.meta.env
  if (!(env.DEV || env.VITE_EDIT === '1')) return
  if (window.parent === window) return
  if (!new URLSearchParams(location.search).has('edit')) return
  if (document.head.querySelector('script[data-webedit-connect]')) return
  window.__WEBEDIT_ORIGINS = parseOrigins(env.VITE_WEBEDIT_ORIGINS)
  const script = document.createElement('script')
  script.src = CONNECT_SRC
  script.dataset.webeditConnect = ''
  document.head.appendChild(script)
}
