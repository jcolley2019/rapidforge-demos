import { isDnsLabel } from '../deploy/deploy'

/**
 * `npm run demo`'s pure parts: the default subdomain, the demo_error it
 * records, and the one JSON line the leads worker reads from stdout.
 * cli.ts runs intake then deploy.
 */

/** Where a demo run stopped: brief (arguments and the lead read), intake, then the deploy's stages. */
export type DemoStage = 'brief' | 'intake' | 'build' | 'previews' | 'deploy' | 'alias'

export interface DemoSuccess {
  ok: true
  businessId: string
  slug: string
  sub: string
  previewUrl: string
  aliasUrl: string
  aliasOk: boolean
  durationMs: number
  /** Whether the outcome landed on the business row's demo_* columns (RFD.DEMO.17). */
  dbRecorded: boolean
}

export interface DemoFailure {
  ok: false
  stage: DemoStage
  error: string
  dbRecorded: boolean
}

/**
 * The default --as: the business name up to its first character a DNS
 * label cannot hold, lowercased with the spaces taken out, so "All
 * Plumbing & Sewer" gives "allplumbing". Apostrophes and accents drop
 * rather than cut the name ("Bob's" gives "bobs"). Null when nothing
 * usable is left; the caller then uses the slug.
 */
export function subFromName(name: string): string | null {
  const head = name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['’]/g, '')
    .toLowerCase()
    .split(/[^a-z0-9 -]/)
    .map((part) => part.replace(/\s+/g, '').replace(/-+/g, '-').replace(/^-+|-+$/g, ''))
    .find(Boolean)
  if (!head) return null
  const sub = head.slice(0, 40).replace(/-+$/, '')
  return isDnsLabel(sub) ? sub : null
}

/** Where the default --as came from. */
export type SubSource = 'demo_sub' | 'name' | 'slug'

/**
 * The subdomain when --as is omitted: the business's demo_sub, so a rerun
 * keeps the URL already in use, when it is a DNS label; else
 * subFromName(name); else the slug.
 */
export function resolveSub(demoSub: string | null, name: string, slug: string): { sub: string; from: SubSource } {
  if (demoSub !== null && isDnsLabel(demoSub)) return { sub: demoSub, from: 'demo_sub' }
  const fromName = subFromName(name)
  return fromName ? { sub: fromName, from: 'name' } : { sub: slug, from: 'slug' }
}

/** The longest demo_error recorded on the business row. */
export const DEMO_ERROR_MAX = 500

/** businesses.demo_error for a failed run: "<stage>: <message>", cut to DEMO_ERROR_MAX characters. */
export function demoError(stage: DemoStage, message: string): string {
  const text = `${stage}: ${message}`
  return text.length > DEMO_ERROR_MAX ? `${text.slice(0, DEMO_ERROR_MAX - 1)}…` : text
}

/** The success line, keys in the order the leads worker documents. */
export function successLine(r: Omit<DemoSuccess, 'ok'>): string {
  const line: DemoSuccess = {
    ok: true,
    businessId: r.businessId,
    slug: r.slug,
    sub: r.sub,
    previewUrl: r.previewUrl,
    aliasUrl: r.aliasUrl,
    aliasOk: r.aliasOk,
    durationMs: r.durationMs,
    dbRecorded: r.dbRecorded,
  }
  return JSON.stringify(line)
}

export function failureLine(stage: DemoStage, error: string, dbRecorded: boolean): string {
  const line: DemoFailure = { ok: false, stage, error, dbRecorded }
  return JSON.stringify(line)
}
