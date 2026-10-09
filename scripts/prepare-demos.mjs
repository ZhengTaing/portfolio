// Rebuilds private-demos/demos.json from the audio files in private-demos/.
//
//   npm run demos
//
// - WAV files are converted to compact AAC (.m4a) copies in private-demos/web/
//   so they stream quickly; your original WAVs are left untouched.
// - Titles come from the file name: "Song Name (ai demo).mp3" becomes
//   title "Song Name" with the tag "AI demo"; "(v1)" or " V1" becomes "v1".
// - If you edited a title or note in demos.json, that edit is kept.
// - Requires ffmpeg (brew install ffmpeg).

import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'private-demos')
const jsonPath = join(dir, 'demos.json')
const previous = existsSync(jsonPath) ? JSON.parse(readFileSync(jsonPath, 'utf8')) : []
const byId = new Map(previous.map((d) => [d.id, d]))

const AUDIO = new Set(['.mp3', '.m4a', '.aac', '.wav', '.ogg', '.flac'])
mkdirSync(join(dir, 'web'), { recursive: true })

const demos = []
for (const file of readdirSync(dir).sort()) {
  const ext = extname(file).toLowerCase()
  if (!AUDIO.has(ext)) continue
  const base = file.slice(0, -ext.length)
  let served = file
  if (ext === '.wav' || ext === '.flac') {
    served = `web/${base}.m4a`
    if (!existsSync(join(dir, served))) {
      console.log(`Converting ${file}…`)
      execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', join(dir, file), '-vn', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', join(dir, served)])
    }
  }
  const seconds = Number(
    execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', join(dir, served)]).toString().trim(),
  )
  const match = base.match(/^(.*?)\s*(?:\((ai demo|v\d+)\)|\b(V\d+))?\s*$/i)
  const title = match[1].trim()
  const rawTag = (match[2] ?? match[3] ?? '').toLowerCase()
  const tag = rawTag === 'ai demo' ? 'AI demo' : rawTag
  const id = base.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const kept = byId.get(id) ?? {}
  demos.push({
    id,
    title: kept.title ?? title,
    file: served,
    ...(kept.note ?? tag ? { note: kept.note ?? tag } : {}),
    date: kept.date ?? statSync(join(dir, file)).mtime.toISOString().slice(0, 10),
    duration: `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`,
  })
}

demos.sort((a, b) => b.date.localeCompare(a.date))
writeFileSync(jsonPath, JSON.stringify(demos, null, 2) + '\n')
console.log(`demos.json now lists ${demos.length} demos.`)
