import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { DeployError, runDeploy } from '../deploy/cli'
import { isDnsLabel } from '../deploy/deploy'
import { IntakeError, runIntake } from '../intake/cli'
import { failureLine, subFromName, successLine, type DemoStage } from './demo'

/**
 * `npm run demo -- --lead <businessId> [--as <subdomain>] [--edit] [--skip-previews]`
 *
 * One command from a leads-app business to a deployed demo: the --lead
 * intake (runIntake), then the deploy of that slug (runDeploy), in this
 * process. --as defaults to the business name's first DNS-safe word
 * (see subFromName). The deploy runs with the env this process started
 * with, as a separate `npm run deploy` would, not the .env intake loads.
 *
 * Built for the leads worker: every log line goes to stderr, and stdout
 * carries one line, last, the result as JSON (see demo.ts). A failure is
 * {"ok":false,"stage",...} with exit 1. A failed alias is still ok, with
 * aliasOk false: the deployment is live at previewUrl either way.
 *
 * RFD.INTAKE.16: a business with no website needs no extra flag; runIntake
 * does a brief-only intake for it. The run is exported as runDemo(), with
 * the intake and deploy passed in, so a test can drive it without the
 * network; importing this file does not run main().
 */

const USAGE = `Usage: npm run demo -- --lead <businessId> [--as <subdomain>] [--edit] [--skip-previews]

  --lead           the business id in the leads app
  --as             the subdomain under demos.rapidforgeai.com; default: the business
                   name's first DNS-safe word ("allplumbing" for "All Plumbing & Sewer")
  --edit           build with the webedit hook (see npm run deploy)
  --skip-previews  keep the Acme picker thumbnails

stdout is one JSON line with the result; everything else goes to stderr.`

/**
 * Points process.stdout.write at stderr, so every log line (console.log,
 * the vercel echo) lands there; returns the one writer left on the real
 * stdout, which restores it.
 */
function stdoutToStderr(): (line: string) => void {
  const stdout = process.stdout.write.bind(process.stdout)
  process.stdout.write = process.stderr.write.bind(process.stderr) as typeof process.stdout.write
  return (line) => {
    process.stdout.write = stdout
    stdout(`${line}\n`)
  }
}

export interface DemoSteps {
  runIntake: typeof runIntake
  runDeploy: typeof runDeploy
}

/** The demo run: `result` gets the one JSON line; returns the exit code. */
export async function runDemo(argv: string[], result: (line: string) => void, steps: DemoSteps = { runIntake, runDeploy }): Promise<number> {
  const started = Date.now()
  let stage: DemoStage = 'brief'
  try {
    const { values } = parseArgs({
      args: argv,
      options: {
        lead: { type: 'string' },
        as: { type: 'string' },
        edit: { type: 'boolean' },
        'skip-previews': { type: 'boolean' },
      },
      strict: true,
    })
    const lead = values.lead?.trim() ?? ''
    if (!lead) {
      console.error(USAGE)
      throw new Error('--lead <businessId> is required')
    }
    const as = values.as?.trim() || undefined
    if (as !== undefined && !isDnsLabel(as)) throw new Error(`--as "${as}" must be a DNS label: lowercase a-z, 0-9, hyphens, 1–40 characters`)
    const env = { ...process.env }

    const intaken = await steps.runIntake({ lead })
    stage = 'build'
    const sub = as ?? subFromName(intaken.businessName) ?? intaken.slug
    console.log(`\n▸ Demo: ${intaken.businessName} (${intaken.slug}) → ${sub}`)
    const deployed = await steps.runDeploy({ slug: intaken.slug, as: sub, edit: values.edit === true, skipPreviews: values['skip-previews'] === true, env })

    console.log(`\nDemo deployed.\n  Preview: ${deployed.previewUrl}\n  Alias:   ${deployed.aliasUrl}${deployed.aliasOk ? '' : ' (alias not set; DNS/domain access pending)'}`)
    result(
      successLine({
        businessId: intaken.businessId,
        slug: deployed.slug,
        sub: deployed.sub,
        previewUrl: deployed.previewUrl,
        aliasUrl: deployed.aliasUrl,
        aliasOk: deployed.aliasOk,
        durationMs: Date.now() - started,
      }),
    )
    return 0
  } catch (error) {
    const failedAt = error instanceof IntakeError || error instanceof DeployError ? error.stage : stage
    const message = error instanceof Error ? error.message : String(error)
    console.error(`\n✖ ${message}`)
    result(failureLine(failedAt, message))
    return 1
  }
}

/** True when this file is the process entry (`npm run demo`), not imported by a test. */
function isEntry(): boolean {
  const entry = process.argv[1]
  if (!entry) return false
  const same = (p: string) => (process.platform === 'win32' ? p.toLowerCase() : p)
  return same(resolve(entry)) === same(fileURLToPath(import.meta.url))
}

if (isEntry()) {
  runDemo(process.argv.slice(2), stdoutToStderr()).then((code) => {
    process.exitCode = code
  })
}
