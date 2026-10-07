import { existsSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

/**
 * The deploy's pure parts: argument validation, the other-lead census, the
 * output prune, and the leak scan that gates `vercel deploy`. The CLI in
 * cli.ts strings them together around the Vercel commands.
 */

export const PROJECT = 'rapidforge-demos'
export const SCOPE = 'jcolley2019-1571s-projects'
export const DOMAIN = 'demos.rapidforge.ai'

/** A DNS label: lowercase a-z, 0-9 and hyphens, 1–40 characters, not starting or ending in a hyphen. */
const DNS_LABEL = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/

export function isDnsLabel(value: string): boolean {
  return DNS_LABEL.test(value)
}

export interface DeployArgs {
  slug: string
  /** The subdomain: `--as` when given, else the slug. */
  sub: string
}

/** `--slug <intake slug> [--as <subdomain>]`, both validated as DNS labels. */
export function parseDeployArgs(values: { slug?: string; as?: string }): DeployArgs {
  const slug = values.slug?.trim() ?? ''
  if (!slug) throw new Error('--slug is required (the intake slug, e.g. --slug robgoodsonplumbing-com)')
  if (!isDnsLabel(slug)) throw new Error(`--slug "${slug}" must be a DNS label: lowercase a-z, 0-9, hyphens, 1–40 characters`)
  const sub = values.as?.trim() || slug
  if (!isDnsLabel(sub)) throw new Error(`--as "${sub}" must be a DNS label: lowercase a-z, 0-9, hyphens, 1–40 characters`)
  return { slug, sub }
}

export function aliasFor(sub: string): string {
  return `${sub}.${DOMAIN}`
}

/** The build env: the parent's, plus the brief this build carries. */
export function buildEnv(base: NodeJS.ProcessEnv, slug: string): NodeJS.ProcessEnv {
  return { ...base, VITE_BRIEF: `lead-${slug}` }
}

export interface LeadIdentity {
  slug: string
  businessName: string
}

/** Every intaken lead under leads/ except `slug`, with the names the leak scan looks for. */
export function otherLeads(root: string, slug: string): LeadIdentity[] {
  const dir = join(root, 'leads')
  if (!existsSync(dir)) return []
  const found: LeadIdentity[] = []
  for (const name of readdirSync(dir)) {
    if (name === slug) continue
    const brief = join(dir, name, 'brief.json')
    if (!statSync(join(dir, name)).isDirectory() || !existsSync(brief)) continue
    const parsed = JSON.parse(readFileSync(brief, 'utf8')) as { business_name?: string }
    found.push({ slug: name, businessName: (parsed.business_name ?? '').trim() })
  }
  return found
}

/** The search terms for a set of leads: each slug and business name, de-duplicated, blanks dropped. */
export function leakTerms(leads: LeadIdentity[]): string[] {
  return [...new Set(leads.flatMap((l) => [l.slug, l.businessName]).filter(Boolean))]
}

/** Removes every static/leads/<other>/ folder from the build output, keeping `slug`'s. Returns what it removed. */
export function pruneOtherLeads(staticDir: string, slug: string): string[] {
  const dir = join(staticDir, 'leads')
  if (!existsSync(dir)) return []
  const removed: string[] = []
  for (const name of readdirSync(dir)) {
    if (name === slug) continue
    rmSync(join(dir, name), { recursive: true, force: true })
    removed.push(name)
  }
  return removed
}

export interface Leak {
  file: string
  term: string
}

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) yield* walk(path)
    else if (entry.isFile()) yield path
  }
}

/** Every file under `dir` whose path or contents contain any term, case-insensitively. Empty means clean. */
export function scanForLeaks(dir: string, terms: string[]): Leak[] {
  const needles = terms.filter(Boolean).map((t) => t.toLowerCase())
  if (needles.length === 0 || !existsSync(dir)) return []
  const leaks: Leak[] = []
  for (const file of walk(dir)) {
    const path = relative(dir, file).toLowerCase()
    const text = readFileSync(file, 'latin1').toLowerCase()
    for (const term of needles) {
      if (path.includes(term) || text.includes(term)) leaks.push({ file, term })
    }
  }
  return leaks
}

/** The deployment URL in `vercel deploy` output: the last https://*.vercel.app line. */
export function deploymentUrlFrom(output: string): string | null {
  const urls = output.match(/https:\/\/[a-z0-9.-]+\.vercel\.app\b/gi)
  return urls ? urls[urls.length - 1] : null
}
