import { isAbsolute, relative, resolve } from 'node:path'

/**
 * The only three places a lead's files may go: leads/<slug>/,
 * public/leads/<slug>/ and src/brief/fixtures/lead-<slug>.json. Every
 * write in the CLI goes through `assertLeadPath`, so one prospect's run can
 * never touch another's files or anything else in the repo.
 */

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** Lowercase kebab-case, ASCII only, at most 60 characters. */
export function slugify(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '')
}

/** The lead brief's business name in kebab case, else the site's hostname (minus "www."). */
export function defaultSlug(businessName: string | null | undefined, url: string): string {
  return slugify(businessName ?? '') || slugify(new URL(url).hostname.replace(/^www\./, ''))
}

export interface LeadPaths {
  slug: string
  /** VITE_BRIEF / ?brief= value, e.g. "lead-acme-plumbing". */
  briefName: string
  leadDir: string
  publicDir: string
  fixture: string
  /** URL prefix the app serves publicDir under. */
  publicBase: string
}

export function leadPaths(root: string, slug: string): LeadPaths {
  if (!SLUG.test(slug)) throw new Error(`slug "${slug}" must be lowercase kebab-case (a-z, 0-9, single hyphens)`)
  return {
    slug,
    briefName: `lead-${slug}`,
    leadDir: resolve(root, 'leads', slug),
    publicDir: resolve(root, 'public', 'leads', slug),
    fixture: resolve(root, 'src', 'brief', 'fixtures', `lead-${slug}.json`),
    publicBase: `/leads/${slug}`,
  }
}

function inside(dir: string, target: string): boolean {
  const rel = relative(dir, target)
  return rel !== '' && !rel.startsWith('..') && !isAbsolute(rel)
}

/** Throws unless `target` is the lead's fixture or lies inside its lead or public folder. */
export function assertLeadPath(paths: LeadPaths, target: string): string {
  const abs = resolve(target)
  if (abs === paths.fixture || inside(paths.leadDir, abs) || inside(paths.publicDir, abs)) return abs
  throw new Error(`refusing to write ${abs}: outside this lead's folders`)
}
