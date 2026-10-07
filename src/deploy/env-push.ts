import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { vercel } from './vercel'

/**
 * `npm run env:push` — copies the pick-email settings from .env to the
 * Vercel project's preview and production environments. Each key is
 * removed first so a rerun replaces the value instead of failing.
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const KEYS = ['RESEND_API_KEY', 'PICK_TO_EMAIL', 'PICK_FROM_EMAIL'] as const
const TARGETS = ['preview', 'production'] as const

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
  const missing = KEYS.filter((k) => !env[k])
  if (missing.length > 0) {
    console.error(`Fill ${missing.join(', ')} in .env first.`)
    process.exit(1)
  }
  let failed = false
  for (const key of KEYS) {
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
