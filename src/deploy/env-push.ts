import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { vercel } from './vercel'

/**
 * `npm run env:push` — copies /api/pick's server-side settings from .env to
 * the Vercel project's preview and production environments: the leads
 * Supabase keys (required; picks are saved to demo_picks) and the Resend
 * email keys (optional; a blank one is skipped and left as it is on
 * Vercel). None is VITE_-prefixed, so none reaches the client bundle. Each
 * key is removed first so a rerun replaces the value instead of failing.
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
export const REQUIRED_KEYS = ['LEADS_SUPABASE_URL', 'LEADS_SUPABASE_SERVICE_ROLE_KEY'] as const
export const OPTIONAL_KEYS = ['RESEND_API_KEY', 'PICK_TO_EMAIL', 'PICK_FROM_EMAIL'] as const
const TARGETS = ['preview', 'production'] as const

/** Which keys to push, which blank optional ones to skip, and which required ones are missing. */
export function pushPlan(env: Record<string, string>): { push: string[]; skip: string[]; missing: string[] } {
  const set = (k: string) => Boolean(env[k]?.trim())
  return {
    push: [...REQUIRED_KEYS, ...OPTIONAL_KEYS].filter(set),
    skip: OPTIONAL_KEYS.filter((k) => !set(k)),
    missing: REQUIRED_KEYS.filter((k) => !set(k)),
  }
}

/** KEY=value lines; `#` comments and blanks skipped; surrounding quotes dropped. */
export function parseDotenv(text: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq < 0) continue
    const key = line.slice(0, eq).trim()
    let value = line.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    out[key] = value
  }
  return out
}

async function main() {
  const file = join(ROOT, '.env')
  if (!existsSync(file)) {
    console.error('.env not found')
    process.exit(1)
  }
  const env = parseDotenv(readFileSync(file, 'utf8'))
  const { push, skip, missing } = pushPlan(env)
  if (missing.length > 0) {
    console.error(`Fill ${missing.join(', ')} in .env first.`)
    process.exit(1)
  }
  for (const key of skip) console.log(`– ${key} skipped (blank in .env)`)
  let failed = false
  for (const key of push) {
    for (const target of TARGETS) {
      // Remove-then-add: `env add` refuses an existing key.
      await vercel(ROOT, ['env', 'rm', key, target, '--yes'], { cwd: ROOT })
      const added = await vercel(ROOT, ['env', 'add', key, target], { cwd: ROOT, input: env[key] })
      if (added.code === 0) {
        console.log(`✓ ${key} → ${target}`)
      } else {
        failed = true
        console.error(`✖ ${key} → ${target}\n${added.stderr || added.stdout}`)
      }
    }
  }
  if (failed) process.exit(1)
}

// tsx runs this file directly; the test imports parseDotenv without running it.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err)
    process.exit(1)
  })
}
