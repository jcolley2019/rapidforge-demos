import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import {
  PROJECT,
  SCOPE,
  aliasFor,
  buildEnv,
  deploymentUrlFrom,
  leakTerms,
  otherLeads,
  parseDeployArgs,
  pruneOtherLeads,
  scanForLeaks,
} from './deploy'
import { vercel } from './vercel'

/**
 * `npm run deploy -- --slug <intake slug> [--as <subdomain>]`
 *
 * Builds the five-variant site for one intaken lead on this machine and
 * publishes it at <subdomain>.demos.rapidforge.ai. The lead's files are
 * gitignored, so Vercel's build server never sees them: the build runs
 * here (`vercel build`) and the output ships with `vercel deploy
 * --prebuilt`. Before the deploy, every other lead is pruned from the
 * output and the output is scanned for their names; any hit aborts.
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

async function main() {
  const { values } = parseArgs({
    options: { slug: { type: 'string' }, as: { type: 'string' } },
    strict: true,
  })
  const { slug, sub } = parseDeployArgs(values)
  const alias = aliasFor(sub)

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
  const build = await run(['build'], buildEnv(process.env, slug))
  if (build.code !== 0) fail('vercel build failed')

  step('Isolation')
  const removed = pruneOtherLeads(join(OUTPUT, 'static'), slug)
  console.log(removed.length ? `  pruned leads/${removed.join(', leads/')} from the output` : '  no other lead folders in the output')
  const others = otherLeads(ROOT, slug)
  const terms = leakTerms(others)
  const leaks = scanForLeaks(OUTPUT, terms)
  if (leaks.length > 0) {
    for (const leak of leaks) console.error(`  LEAK "${leak.term}" in ${leak.file}`)
    fail(`the output mentions ${new Set(leaks.map((l) => l.term)).size} other lead(s); nothing was deployed`)
  }
  console.log(`  clean: none of ${terms.length} other-lead term(s) from ${others.length} lead(s) appear in the output`)

  step('Deploy')
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
