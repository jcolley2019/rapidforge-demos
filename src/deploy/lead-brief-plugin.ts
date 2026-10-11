import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Plugin } from 'vite'
import { isIntakePhoto, type PhotoDims } from '../brief/photo-sizes.ts'

/**
 * `virtual:lead-brief` — the one lead brief a build carries, or null.
 *
 * Lead fixtures (src/brief/fixtures/lead-*.json) are gitignored and hold a
 * prospect's data, so they must never be globbed into a bundle wholesale:
 * a deploy for one prospect would ship every other prospect's brief. This
 * module resolves to exactly the lead named by VITE_BRIEF (when it names
 * a lead) and to null for Acme and sparse builds, which keep the glob.
 *
 * It also exports `photoSizes`, the pixel size of each of the lead's intake
 * photos, so the page can tell which one is big enough to fill a screen.
 */

export const LEAD_PREFIX = 'lead-'

export const VIRTUAL_ID = 'virtual:lead-brief'
const RESOLVED_ID = '\0' + VIRTUAL_ID

export interface LeadBriefSource {
  stem: string | null
  code: string
}

export function isLeadStem(stem: string | null | undefined): stem is string {
  return typeof stem === 'string' && stem.startsWith(LEAD_PREFIX) && stem.length > LEAD_PREFIX.length
}

const strings = (value: unknown): string[] => (Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [])

/**
 * The pixel size of each intake photo the brief lists (crew_photo_urls and
 * photo_urls), read from public/, where the build serves them from. A
 * missing or unreadable file is left out.
 */
export async function measureLeadPhotos(brief: unknown, root: string): Promise<Record<string, PhotoDims>> {
  const fields = (brief ?? {}) as { crew_photo_urls?: unknown; photo_urls?: unknown }
  const urls = [...new Set([...strings(fields.crew_photo_urls), ...strings(fields.photo_urls)].map((u) => u.trim()))].filter(isIntakePhoto)
  if (urls.length === 0) return {}
  const { default: sharp } = await import('sharp')
  const sizes: Record<string, PhotoDims> = {}
  for (const url of urls) {
    try {
      const { width, height } = await sharp(join(root, 'public', url)).metadata()
      if (width && height) sizes[url] = { width, height }
    } catch {
      // Not on disk or not an image; this photo just never leads a full-bleed hero.
    }
  }
  return sizes
}

/** The module source for VITE_BRIEF: the named lead's JSON and photo sizes, or a null export. */
export async function leadBriefSource(viteBrief: string | undefined, root: string): Promise<LeadBriefSource> {
  const stem = viteBrief?.trim() || ''
  if (!isLeadStem(stem)) return { stem: null, code: 'export const stem = null\nexport const photoSizes = {}\nexport default null\n' }
  const file = join(root, 'src', 'brief', 'fixtures', `${stem}.json`)
  if (!existsSync(file)) {
    throw new Error(`VITE_BRIEF="${stem}" has no fixture at ${file}. Run \`npm run intake\` for that lead first.`)
  }
  // Re-serialised so a malformed file fails the build here, not in the browser.
  const brief: unknown = JSON.parse(readFileSync(file, 'utf8'))
  const sizes = await measureLeadPhotos(brief, root)
  return {
    stem,
    code: `export const stem = ${JSON.stringify(stem)}\nexport const photoSizes = ${JSON.stringify(sizes)}\nexport default ${JSON.stringify(brief)}\n`,
  }
}

export function leadBriefPlugin(viteBrief: string | undefined, root: string): Plugin {
  return {
    name: 'rfd-lead-brief',
    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : null
    },
    async load(id) {
      return id === RESOLVED_ID ? (await leadBriefSource(viteBrief, root)).code : null
    },
  }
}
