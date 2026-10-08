import { isDnsLabel } from '../deploy/deploy'

/**
 * `npm run demo`'s pure parts: the default subdomain and the one JSON line
 * the leads worker reads from stdout. cli.ts runs intake then deploy.
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
}

export interface DemoFailure {
  ok: false
  stage: DemoStage
  error: string
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
  }
  return JSON.stringify(line)
}

export function failureLine(stage: DemoStage, error: string): string {
  const line: DemoFailure = { ok: false, stage, error }
  return JSON.stringify(line)
}
