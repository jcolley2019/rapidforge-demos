// HEAD-checks every URL in src/brief/trade-photos.ts and prints the ones
// that answer 200 with an image content-type. Exit code 1 if any fail.
//
//   node scripts/verify-photos.mjs

import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const source = readFileSync(join(root, 'src', 'brief', 'trade-photos.ts'), 'utf8')
const ids = [...source.matchAll(/u\('([0-9]+-[a-f0-9]+)'\)/g)].map((m) => m[1])
const urls = ids.map((id) => `https://images.unsplash.com/photo-${id}?w=1600&q=80`)

const results = await Promise.all(
  urls.map(async (url) => {
    try {
      const res = await fetch(url, { method: 'HEAD', redirect: 'follow' })
      const type = res.headers.get('content-type') ?? ''
      return { url, ok: res.status === 200 && type.startsWith('image/'), status: res.status }
    } catch (err) {
      return { url, ok: false, status: String(err) }
    }
  }),
)

const verified = results.filter((r) => r.ok)
const failed = results.filter((r) => !r.ok)

console.log(`verified ${verified.length}/${results.length}`)
for (const r of verified) console.log(`ok   ${r.url}`)
for (const r of failed) console.error(`FAIL ${r.status} ${r.url}`)
if (failed.length > 0) process.exit(1)
