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
import { vercel } from './vercel'

/**
 * `npm run deploy -- --slug <intake slug> [--as <subdomain>] [--edit] [--skip-previews] [--check-only]`
 *
 * Builds the five-variant site for one intaken lead on this machine and
 * publishes it at <subdomain>.demos.rapidforge.ai. The lead's files are
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
 * --check-only runs the isolation step alone against the build already in
 * .vercel/output, then stops: no login, link, build, deploy or alias.
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const OUTPUT = join(ROOT, '.vercel', 'output')

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

/** Prunes every other lead from the output and scans it for them; any hit exits non-zero. */
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
    fail(`the output mentions ${leaked.length} other lead(s) (${leaked.map((l) => l.slug).join(', ')}); nothing was deployed`)
  }
  console.log(`  clean: none of ${terms.length} other-lead term(s) from ${others.length} lead(s) appear in the output`)
}

/** Shoots the lead's picker thumbnails over the Acme ones in the output; a missing or oversized shot exits non-zero. */
async function previews(fixture: string) {
  step('Previews')
  const { vertical } = JSON.parse(readFileSync(fixture, 'utf8')) as { vertical?: string }
  if (!vertical) fail(`${fixture} has no vertical`)
  console.log(`  lead vertical "${vertical}"`)
  try {
    await renderLeadPreviews({ outputStatic: join(OUTPUT, 'static'), vertical, log: (line) => console.log(`  ${line}`) })
  } catch (err) {
    fail(`previews failed: ${err instanceof Error ? err.message : String(err)}; nothing was deployed`)
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
  const alias = aliasFor(sub)
  const edit = values.edit === true

  if (values['check-only']) {
    if (!existsSync(OUTPUT)) fail(`${OUTPUT} not found. Build first: a full \`npm run deploy -- --slug ${slug}\` builds before it scans.`)
    console.log(`  --check-only: scanning the existing build in ${OUTPUT} as lead ${slug}`)
    isolation(slug)
    console.log('\nCheck only: stopped after the leak scan; nothing was built or deployed.')
    return
  }

  step('Preflight')
  const who = await vercel(ROOT, ['whoami'], { cwd: ROOT })
  if (who.code !== 0 || !who.stdout.trim()) {
    fail('Not logged in to Vercel. Run `npx vercel login` once, then rerun.')
  }
  console.log(`  logged in as ${who.stdout.trim()}`)
  const leadBrief = join(ROOT, 'leads', slug, 'brief.json')
  const fixture = join(ROOT, 'src', 'brief', 'fixtures', `lead-${slug}.json`)
  for (const file of [leadBrief, fixture]) {
    if (!existsSync(file)) {
      fail(`${file} not found. Intake the lead first:\n  npm run intake -- --url https://<prospect site> --slug ${slug}`)
    }
  }
  console.log(`  lead ${slug} → https://${alias}`)

  step('Link and pull')
  const link = await run(['link', '--yes', '--project', PROJECT, '--scope', SCOPE])
  if (link.code !== 0) fail('vercel link failed')
  const pull = await run(['pull', '--yes', '--environment=preview'])
  if (pull.code !== 0) fail('vercel pull failed')

  step(`Build with VITE_BRIEF=lead-${slug}`)
  const build = await run(['build'], buildEnv(process.env, slug, { edit }))
  if (build.code !== 0) fail('vercel build failed')

  if (values['skip-previews']) {
    step('Previews')
    console.log('  --skip-previews: skipped; the picker keeps the committed Acme thumbnails')
  } else {
    await previews(fixture)
  }

  isolation(slug)

  step('Deploy')
  console.log(edit ? '  edit mode: ON — page accepts webedit from localhost when framed with ?edit' : '  edit mode: OFF')
  const deploy = await run(['deploy', '--prebuilt', '--yes'])
  const url = deploymentUrlFrom(`${deploy.stdout}\n${deploy.stderr}`)
  if (deploy.code !== 0 || !url) fail('vercel deploy failed')

  step('Alias')
  const aliased = await run(['alias', 'set', url, alias])
  if (aliased.code !== 0) fail(`vercel alias set failed; rerun:\n  npx vercel alias set ${url} ${alias}`)

  console.log(`
Deployed.
  Deployment: ${url}
  Alias:      https://${alias}
The alias is public; the vercel.app URL is login-protected (deployment protection: all except custom domains).`)
}

main().catch((err) => fail(err instanceof Error ? err.message : String(err)))
