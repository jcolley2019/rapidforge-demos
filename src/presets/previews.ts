import { presetVerticalOf } from './presets'

/**
 * Picker preview screenshots: the top of each variant at desktop
 * (1280x800) and phone (390x844) size, one set per preset vertical.
 * `npm run shots` writes them to public/previews/<vertical>/ from the built
 * site, and Vite serves public/ at the root, so these are URL paths.
 */

export interface Preview {
  desktop: string
  mobile: string
}

export function previewFor(slug: string, vertical = 'plumbing'): Preview {
  const dir = `/previews/${presetVerticalOf(vertical)}`
  return {
    desktop: `${dir}/${slug}.jpg`,
    mobile: `${dir}/${slug}-mobile.jpg`,
  }
}
