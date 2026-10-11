// Uploads the demos in private-demos/ to your Cloudflare R2 bucket.
//
//   npm run demos:upload
//
// - Uploads each song in demos.json (the compressed copy) and its cover.
// - Skips files that are already in the bucket with the same size, so it's
//   safe to run again after adding songs.
// - Reads the R2_* keys from .env.local.

import { readFileSync, statSync } from 'node:fs'
import { dirname, extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { objectKey, r2Config, r2Url } from '../server/r2.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dir = join(root, 'private-demos')

const env = { ...process.env }
try {
  for (const line of readFileSync(join(root, '.env.local'), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
    if (m && !env[m[1]]) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
} catch {}

const cfg = r2Config(env)
if (!cfg) {
  console.error('Add R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY and R2_BUCKET to .env.local first.')
  process.exit(1)
}

const TYPES = { '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.aac': 'audio/aac', '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.flac': 'audio/flac', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' }
const demos = JSON.parse(readFileSync(join(dir, 'demos.json'), 'utf8'))
const files = [...new Set(demos.flatMap((d) => [d.file, d.cover]).filter(Boolean))]

let uploaded = 0
let skipped = 0
for (const file of files) {
  const path = join(dir, file)
  let size
  try {
    size = statSync(path).size
  } catch {
    console.warn(`  missing  ${file}`)
    continue
  }
  const key = objectKey(file)
  const head = await fetch(r2Url(cfg, 'HEAD', key, 300), { method: 'HEAD' })
  if (head.ok && Number(head.headers.get('content-length')) === size) {
    skipped++
    continue
  }
  const res = await fetch(r2Url(cfg, 'PUT', key, 900), {
    method: 'PUT',
    headers: { 'Content-Type': TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream' },
    body: readFileSync(path),
  })
  if (!res.ok) {
    console.error(`  failed   ${file}: ${res.status} ${await res.text()}`)
    process.exitCode = 1
    continue
  }
  uploaded++
  console.log(`  uploaded ${file} (${(size / 1e6).toFixed(1)} MB)`)
}
console.log(`\nDone: ${uploaded} uploaded, ${skipped} already there.`)
