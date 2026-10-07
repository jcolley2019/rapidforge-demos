import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Plugin } from 'vite'

/**
 * `virtual:lead-brief` — the one lead brief a build carries, or null.
 *
 * Lead fixtures (src/brief/fixtures/lead-*.json) are gitignored and hold a
 * prospect's data, so they must never be globbed into a bundle wholesale:
 * a deploy for one prospect would ship every other prospect's brief. This
 * module resolves to exactly the lead named by VITE_BRIEF (when it names
 * a lead) and to null for Acme and sparse builds, which keep the glob.
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

/** The module source for VITE_BRIEF: the named lead's JSON, or a null export. */
export function leadBriefSource(viteBrief: string | undefined, root: string): LeadBriefSource {
  const stem = viteBrief?.trim() || ''
  if (!isLeadStem(stem)) return { stem: null, code: 'export const stem = null\nexport default null\n' }
  const file = join(root, 'src', 'brief', 'fixtures', `${stem}.json`)
  if (!existsSync(file)) {
    throw new Error(`VITE_BRIEF="${stem}" has no fixture at ${file}. Run \`npm run intake\` for that lead first.`)
  }
  // Re-serialised so a malformed file fails the build here, not in the browser.
  const json = JSON.stringify(JSON.parse(readFileSync(file, 'utf8')))
  return { stem, code: `export const stem = ${JSON.stringify(stem)}\nexport default ${json}\n` }
}

export function leadBriefPlugin(viteBrief: string | undefined, root: string): Plugin {
  return {
    name: 'rfd-lead-brief',
    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : null
    },
    load(id) {
      return id === RESOLVED_ID ? leadBriefSource(viteBrief, root).code : null
    },
  }
}
