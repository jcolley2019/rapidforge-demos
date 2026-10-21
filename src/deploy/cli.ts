import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import {
  PROJECT,
  SCOPE,
  aliasFor,
  buildEnv,
  deploymentUrlFrom,
  isVaultName,
  leakTerms,
  otherLeads,
  parseDeployArgs,
  pruneOtherLeads,
  scanForLeaks,
  termsFor,
  vaultMentions,
} from './deploy'
import { renderLeadPreviews } from './previews'
import { SCROLL_CARD, SCROLL_PATH, copyScrollBuild, hasScrollBuild, readScrollCard, scrollBuildDir } from './scroll'
import { vercel } from './vercel'

/**
 * `npm run deploy -- --slug <intake slug> [--as <subdomain>] [--edit] [--skip-previews] [--check-only]`
 *
 * Builds the five-variant site for one intaken lead on this machine and
 * publishes it at <subdomain>.demos.rapidforgeai.com. The lead's files are
 * gitignored, so Vercel's build server never sees them: the build runs
 * here (`vercel build`) and the output ships with `vercel deploy
 * --prebuilt`. Before the deploy, every other lead is pruned from the
 * output and the output is scanned for their names; any hit aborts. A
 * name the taste vaults mention (public research text in every build) is
 * scanned for by that lead's phone, address and /leads/<slug>/ instead.
 *
 * After the build, the picker's thumbnails are shot from the lead's own
 * output and written over the Acme ones in it (src/deploy/previews.ts),
 * before the isolation scan so the scan covers them. --skip-previews
 * leaves the Acme thumbnails in place; it is for debugging.
 *
 * --edit builds with VITE_EDIT=1, so the page mounts webedit-connect.js
 * when a webedit Viewer frames it with ?edit; without it, it never does.
 *
 * RFD.SCROLL.14: when the lead has a scroll-craft build (leads/scrollcraft/
 * builds/<slug>/index.html, see src/deploy/scroll.ts) the build runs with
 * VITE_SCROLL=1 so the picker shows the Scroll Story card, the page and
 * what it references are copied to static/scroll/ after the build, and
 * the Previews step shoots /scroll/ too. The isolation scan covers it
 * like the rest of the output.
 *
 * RFD.SCROLL.14a: when that build also has a card.json, it is checked
 * before the build and passed in as VITE_SCROLL_CARD, so the card shows
 * the build's own blurb and swatches, and it ships at /scroll/card.json.
 * A malformed one stops the deploy; without one the card keeps its
 * defaults.
 *
 * --check-only runs the isolation step alone against the build already in
 * .vercel/output, then stops: no login, link, build, deploy or alias.
 *
 * RFD.LEADS.10c: everything but --check-only is exported as runDeploy(),
 * which `npm run demo` calls in-process; importing this file does not run
 * main().
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const OUTPUT = join(ROOT, '.vercel', 'output')

/** Where a deploy stopped: build (preflight, link, pull, build), previews, deploy (isolation, deploy) or alias. */
export type DeployStage = 'build' | 'previews' | 'deploy' | 'alias'

export class DeployError extends Error {
  readonly stage: DeployStage

  constructor(stage: DeployStage, message: string) {
    super(message)
    this.name = 'DeployError'
    this.stage = stage
  }
}

export interface DeployOptions {
  slug: string
  /** The subdomain; the slug when absent. */
  as?: string
  edit?: boolean
  skipPreviews?: boolean
  /** The env the Vercel commands run with; process.env when absent. */
  env?: NodeJS.ProcessEnv
}

export interface DeployResult {
  slug: string
  sub: string
  /** The vercel.app deployment URL (login-protected). */
  previewUrl: string
  /** https://<sub>.demos.rapidforgeai.com */
  aliasUrl: string
  /** Whether `vercel alias set` pointed the alias at this deployment. */
  aliasOk: boolean
}

function step(name: string) {
  console.log(`\n▸ ${name}`)
}

function fail(message: string): never {
  console.error(`\n✖ ${message}`)
  process.exit(1)
}

async function run(args: string[], env?: NodeJS.ProcessEnv) {
  console.log(`  $ vercel ${args.join(' ')}`)
  return vercel(ROOT, args, { cwd: ROOT, env, echo: true })
}

/** Prunes every other lead from the output and scans it for them; any hit throws. */
function isolation(slug: string) {
  step('Isolation')
  const removed = pruneOtherLeads(join(OUTPUT, 'static'), slug)
  console.log(removed.length ? `  pruned leads/${removed.join(', leads/')} from the output` : '  no other lead folders in the output')
  const others = otherLeads(ROOT, slug)
  const vault = vaultMentions(ROOT)
  for (const lead of others) {
    if (isVaultName(lead.businessName, vault)) {
      console.log(`  ${lead.slug}: the vaults mention "${lead.businessName}", so it is checked by phone, address and /leads/${lead.slug}/, not by name`)
    }
  }
  const terms = leakTerms(others, vault)
  const leaks = scanForLeaks(OUTPUT, terms)
  if (leaks.length > 0) {
    for (const leak of leaks) console.error(`  LEAK "${leak.term}" in ${leak.file}`)
    const hits = new Set(leaks.map((l) => l.term))
    const leaked = others.filter((l) => termsFor(l, vault).some((t) => hits.has(t.toLowerCase())))
    throw new DeployError('deploy', `the output mentions ${leaked.length} other lead(s) (${leaked.map((l) => l.slug).join(', ')}); nothing was deployed`)
  }
  console.log(`  clean: none of ${terms.length} other-lead term(s) from ${others.length} lead(s) appear in the output`)
}

/** The scroll build's card.json, checked, or null without one; a malformed one throws. */
function scrollCard(buildDir: string) {
  try {
    return readScrollCard(buildDir)
  } catch (err) {
    throw new DeployError('build', `scroll build: ${err instanceof Error ? err.message : String(err)}; nothing was deployed`)
  }
}

/** Copies the lead's scroll-craft build to static/scroll/; a reference the copy cannot satisfy throws. */
function scrollStory(buildDir: string) {
  step('Scroll Story')
  try {
    const copied = copyScrollBuild(buildDir, join(OUTPUT, 'static', SCROLL_PATH))
    console.log(`  ${copied.files.length} file(s), ${Math.round(copied.bytes / 1000)} KB from ${buildDir} → /${SCROLL_PATH}/`)
  } catch (err) {
    throw new DeployError('build', `scroll build: ${err instanceof Error ? err.message : String(err)}; nothing was deployed`)
  }
}

/** Shoots the lead's picker thumbnails over the Acme ones in the output; a missing or oversized shot throws. */
async function previews(fixture: string, scroll: boolean) {
  step('Previews')
  const { vertical } = JSON.parse(readFileSync(fixture, 'utf8')) as { vertical?: string }
  if (!vertical) throw new DeployError('previews', `${fixture} has no vertical`)
  console.log(`  lead vertical "${vertical}"`)
  try {
    await renderLeadPreviews({ outputStatic: join(OUTPUT, 'static'), vertical, scroll, log: (line) => console.log(`  ${line}`) })
  } catch (err) {
    throw new DeployError('previews', `previews failed: ${err instanceof Error ? err.message : String(err)}; nothing was deployed`)
  }
}

/**
 * Preflight, link and pull, build, previews, isolation, deploy, alias.
 * A failed alias is not an error: the deployment is live at previewUrl
 * either way, so it comes back as aliasOk false. Anything else that fails
 * throws DeployError with its stage.
 */
export async function runDeploy(opts: DeployOptions): Promise<DeployResult> {
  let stage: DeployStage = 'build'
  try {
    const { slug, sub } = parseDeployArgs({ slug: opts.slug, as: opts.as })
    const alias = aliasFor(sub)
    const env = opts.env ?? process.env

    step('Preflight')
    const who = await vercel(ROOT, ['whoami'], { cwd: ROOT, env })
    if (who.code !== 0 || !who.stdout.trim()) {
      throw new DeployError('build', 'Not logged in to Vercel. Run `npx vercel login` once, then rerun.')
    }
    console.log(`  logged in as ${who.stdout.trim()}`)
    const leadBrief = join(ROOT, 'leads', slug, 'brief.json')
    const fixture = join(ROOT, 'src', 'brief', 'fixtures', `lead-${slug}.json`)
    for (const file of [leadBrief, fixture]) {
      if (!existsSync(file)) {
        throw new DeployError('build', `${file} not found. Intake the lead first:\n  npm run intake -- --url https://<prospect site> --slug ${slug}`)
      }
    }
    console.log(`  lead ${slug} → https://${alias}`)

    step('Link and pull')
    const link = await run(['link', '--yes', '--project', PROJECT, '--scope', SCOPE], env)
    if (link.code !== 0) throw new DeployError('build', 'vercel link failed')
    const pull = await run(['pull', '--yes', '--environment=preview'], env)
    if (pull.code !== 0) throw new DeployError('build', 'vercel pull failed')

    const scrollDir = scrollBuildDir(ROOT, slug)
    const scroll = hasScrollBuild(scrollDir)
    const card = scroll ? scrollCard(scrollDir) : null
    step(`Build with VITE_BRIEF=lead-${slug}${scroll ? ' VITE_SCROLL=1' : ''}${card ? ' VITE_SCROLL_CARD' : ''}`)
    console.log(scroll ? `  scroll build found at ${scrollDir}: six looks` : `  no scroll build at ${scrollDir}: five looks`)
    if (scroll) {
      console.log(
        card
          ? `  ${SCROLL_CARD}: "${card.description}" ${card.swatches.join(' ')}`
          : `  no ${SCROLL_CARD}: the Scroll Story card keeps its default blurb and swatches`,
      )
    }
    const build = await run(['build'], buildEnv(env, slug, { edit: opts.edit === true, scroll, scrollCard: card }))
    if (build.code !== 0) throw new DeployError('build', 'vercel build failed')
    if (scroll) scrollStory(scrollDir)

    stage = 'previews'
    if (opts.skipPreviews) {
      step('Previews')
      console.log('  --skip-previews: skipped; the picker keeps the committed Acme thumbnails')
    } else {
      await previews(fixture, scroll)
    }

    stage = 'deploy'
    isolation(slug)

    step('Deploy')
    console.log(opts.edit ? '  edit mode: ON — page accepts webedit from localhost when framed with ?edit' : '  edit mode: OFF')
    const deploy = await run(['deploy', '--prebuilt', '--yes'], env)
    const url = deploymentUrlFrom(`${deploy.stdout}\n${deploy.stderr}`)
    if (deploy.code !== 0 || !url) throw new DeployError('deploy', 'vercel deploy failed')

    stage = 'alias'
    step('Alias')
    const aliased = await run(['alias', 'set', url, alias], env)
    return { slug, sub, previewUrl: url, aliasUrl: `https://${alias}`, aliasOk: aliased.code === 0 }
  } catch (err) {
    throw err instanceof DeployError ? err : new DeployError(stage, err instanceof Error ? err.message : String(err))
  }
}

async function main() {
  const { values } = parseArgs({
    options: {
      slug: { type: 'string' },
      as: { type: 'string' },
      edit: { type: 'boolean' },
      'skip-previews': { type: 'boolean' },
      'check-only': { type: 'boolean' },
    },
    strict: true,
  })
  const { slug, sub } = parseDeployArgs(values)

  if (values['check-only']) {
    if (!existsSync(OUTPUT)) fail(`${OUTPUT} not found. Build first: a full \`npm run deploy -- --slug ${slug}\` builds before it scans.`)
    console.log(`  --check-only: scanning the existing build in ${OUTPUT} as lead ${slug}`)
    isolation(slug)
    console.log('\nCheck only: stopped after the leak scan; nothing was built or deployed.')
    return
  }

  const deployed = await runDeploy({ slug, as: sub, edit: values.edit === true, skipPreviews: values['skip-previews'] === true })
  if (!deployed.aliasOk) fail(`vercel alias set failed; rerun:\n  npx vercel alias set ${deployed.previewUrl} ${aliasFor(deployed.sub)}`)

  console.log(`
Deployed.
  Deployment: ${deployed.previewUrl}
  Alias:      ${deployed.aliasUrl}
The alias is public; the vercel.app URL is login-protected (deployment protection: all except custom domains).`)
}

/** True when this file is the process entry (`npm run deploy`), not imported (`npm run demo`). */
function isEntry(): boolean {
  const entry = process.argv[1]
  if (!entry) return false
  const same = (p: string) => (process.platform === 'win32' ? p.toLowerCase() : p)
  return same(resolve(entry)) === same(fileURLToPath(import.meta.url))
}

if (isEntry()) main().catch((err) => fail(err instanceof Error ? err.message : String(err)))
