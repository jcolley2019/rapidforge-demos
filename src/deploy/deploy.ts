import { existsSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

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

export interface BuildOptions {
  /** Let the build mount webedit-connect.js when framed with ?edit (see src/edit/mount.ts). */
  edit?: boolean
}

/**
 * The build env: the parent's, plus the brief this build carries, plus
 * VITE_EDIT='1' only with --edit. Without it VITE_EDIT is pinned to '0',
 * because a value in the shell or a .env file would otherwise switch it on.
 */
export function buildEnv(base: NodeJS.ProcessEnv, slug: string, opts: BuildOptions = {}): NodeJS.ProcessEnv {
  return { ...base, VITE_BRIEF: `lead-${slug}`, VITE_EDIT: opts.edit ? '1' : '0' }
}

export interface LeadIdentity {
  slug: string
  businessName: string
  phone: string
  address: string
}

/** Every intaken lead under leads/ except `slug`, with the names and signatures the leak scan looks for. */
export function otherLeads(root: string, slug: string): LeadIdentity[] {
  const dir = join(root, 'leads')
  if (!existsSync(dir)) return []
  const found: LeadIdentity[] = []
  for (const name of readdirSync(dir)) {
    if (name === slug) continue
    const brief = join(dir, name, 'brief.json')
    if (!statSync(join(dir, name)).isDirectory() || !existsSync(brief)) continue
    const parsed = JSON.parse(readFileSync(brief, 'utf8')) as { business_name?: string; phone?: string | null; address?: string | null }
    found.push({
      slug: name,
      businessName: (parsed.business_name ?? '').trim(),
      phone: (parsed.phone ?? '').trim(),
      address: (parsed.address ?? '').trim(),
    })
  }
  return found
}

function normalized(value: string | undefined): string {
  return (value ?? '').trim().replace(/\s+/g, ' ').toLowerCase()
}

function hostOf(url: string | undefined): string {
  try {
    return new URL(url ?? '').hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

/** "Name, Metro (domain)" items, comma-separated; a name may itself hold commas ("Temperature Control, Inc."). */
const REFERENCE = /(.+?), ([^,]+?) \(([a-z0-9.-]+\.[a-z]{2,})\)(?:, |$)/gi

/** The businesses on a preset brief's "Reference feel:" line. */
export function referencesIn(brief: string): { name: string; domain: string }[] {
  const line = brief.split('\n').find((l) => l.startsWith('Reference feel:'))
  if (!line) return []
  return [...line.slice('Reference feel:'.length).trim().matchAll(REFERENCE)].map((m) => ({ name: m[1], domain: m[3] }))
}

/**
 * The business names and domains the taste vaults studied, lowercased: the
 * "Reference feel:" businesses in src/presets/presets.json briefs, and the
 * company and URL host of every vaults/*.json entry. Preset briefs ship in
 * the bundle, so these are public research text in every build, not leaks.
 */
export function vaultMentions(root: string): Set<string> {
  const mentions = new Set<string>()
  const add = (value: string | undefined) => {
    const v = normalized(value)
    if (v) mentions.add(v)
  }
  const presetsFile = join(root, 'src', 'presets', 'presets.json')
  if (existsSync(presetsFile)) {
    const sets = JSON.parse(readFileSync(presetsFile, 'utf8')) as Record<string, { brief?: string }[]>
    for (const preset of Object.values(sets).flat()) {
      for (const ref of referencesIn(preset.brief ?? '')) {
        add(ref.name)
        add(ref.domain)
      }
    }
  }
  const vaultDir = join(root, 'vaults')
  if (existsSync(vaultDir)) {
    for (const file of readdirSync(vaultDir)) {
      if (!file.endsWith('.json')) continue
      const vault = JSON.parse(readFileSync(join(vaultDir, file), 'utf8')) as { entries?: { company?: string; url?: string }[] }
      for (const entry of vault.entries ?? []) {
        add(entry.company)
        add(hostOf(entry.url))
      }
    }
  }
  return mentions
}

/** Whether a business name would hit vault text: it is, or is part of, a vault-mentioned name or domain. */
export function isVaultName(businessName: string, vault: Set<string>): boolean {
  const name = normalized(businessName)
  return name !== '' && [...vault].some((m) => m.includes(name))
}

/** A phone as written, plus the common US forms of its ten digits (tel: links use the bare digits). */
export function phoneForms(phone: string): string[] {
  const digits = phone.replace(/\D/g, '')
  const ten = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits
  if (ten.length !== 10) return [phone]
  const [a, b, c] = [ten.slice(0, 3), ten.slice(3, 6), ten.slice(6)]
  return [...new Set([phone, ten, `${a}-${b}-${c}`, `${a}.${b}.${c}`, `(${a}) ${b}-${c}`])]
}

/** What only this lead's own data puts in a build: its phone, its address, its /leads/<slug>/ folder. */
export function leadSignatures(lead: LeadIdentity): string[] {
  return [...phoneForms(lead.phone), lead.address, `/leads/${lead.slug}/`]
}

/**
 * The search terms for one lead: its slug and business name, or, when the
 * vaults mention that name, its signatures instead and never the bare name.
 */
export function termsFor(lead: LeadIdentity, vault: Set<string>): string[] {
  return isVaultName(lead.businessName, vault) ? leadSignatures(lead) : [lead.slug, lead.businessName]
}

/** The search terms for a set of leads, de-duplicated, blanks dropped. */
export function leakTerms(leads: LeadIdentity[], vault: Set<string> = new Set()): string[] {
  return [...new Set(leads.flatMap((l) => termsFor(l, vault)).filter(Boolean))]
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

/**
 * Every file under `dir` whose path or contents contain any term,
 * case-insensitively. Paths are matched as "/a/b/c" whatever the OS, so a
 * "/leads/<slug>/" term finds that folder on Windows too. Empty means clean.
 */
export function scanForLeaks(dir: string, terms: string[]): Leak[] {
  const needles = terms.filter(Boolean).map((t) => t.toLowerCase())
  if (needles.length === 0 || !existsSync(dir)) return []
  const leaks: Leak[] = []
  for (const file of walk(dir)) {
    const path = `/${relative(dir, file).split(sep).join('/')}`.toLowerCase()
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
