/**
 * Picker preview screenshots: the top of each variant at desktop
 * (1280x800) and phone (390x844) size. `npm run shots` writes them to
 * public/previews/ from the built site, and Vite serves public/ at the
 * root, so these are URL paths.
 */

export interface Preview {
  desktop: string
  mobile: string
}

export function previewFor(slug: string): Preview {
  return {
    desktop: `/previews/${slug}.jpg`,
    mobile: `/previews/${slug}-mobile.jpg`,
  }
}
