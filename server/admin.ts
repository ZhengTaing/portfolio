/**
 * The private admin page's API (/api/admin?action=…).
 *
 * Signing in uses ADMIN_CODE (an environment variable, like DEMOS_PASSWORD).
 * The admin session cookie only goes to /api/admin and lasts 7 days.
 */
import { randomUUID } from 'node:crypto'
import {
  clientIp,
  cookie,
  createSession,
  json,
  LEGACY_ID,
  legacyPerson,
  filesOf,
  loadDemos,
  loadPeople,
  loadTags,
  newCode,
  rateLimit,
  readCookie,
  removeUpload,
  safeEqual,
  saveDemoEdit,
  saveLocalUpload,
  savePerson,
  serveFile,
  TAG_GROUPS,
  tagList,
  tagsWithSongs,
  verifySession,
  type Demo,
  type DemoVersion,
  type LogEntry,
  type Person,
  type TagGroup,
} from './demos.js'
import { objectKey, r2Config, r2Url } from './r2.js'
import { pairs, store } from './store.js'

const ADMIN_COOKIE = 'zt_admin'
const ADMIN_PATH = '/api/admin'
const ADMIN_DAYS = 7

function adminConfig() {
  const code = process.env.ADMIN_CODE
  const secret = process.env.DEMOS_SESSION_SECRET
  return code && secret ? { code, secret: `admin:${secret}` } : null
}

/** Changing ADMIN_CODE signs the admin out everywhere. */
const adminVersion = (code: string) => String(code.length) + code.slice(-2)

function isAdmin(request: Request) {
  const cfg = adminConfig()
  if (!cfg) return false
  const s = verifySession(readCookie(request, ADMIN_COOKIE), cfg.secret)
  return Boolean(s && s.p === 'admin' && s.v === adminVersion(cfg.code))
}

/** Fields the admin page may change on a demo. */
const EDITABLE: (keyof Demo)[] = [
  'title',
  'demoArtist',
  'note',
  'targetArtists',
  'market',
  'actType',
  'genre',
  'key',
  'bpm',
  'status',
  'holdUntil',
  'placedWith',
  'pitchNotes',
  'privateNotes',
  'reservation',
  'hidden',
]
const STATUSES = ['available', 'on-hold', 'reserved', 'placed']

function cleanPatch(input: Record<string, unknown>) {
  const out: Partial<Demo> = {}
  for (const k of EDITABLE) {
    if (!(k in input)) continue
    const v = input[k]
    if (k === 'bpm') out.bpm = v === '' || v == null ? null : Number(v) || null
    else if (k === 'hidden') out.hidden = Boolean(v)
    else if (k === 'status') {
      if (STATUSES.includes(String(v))) out.status = v as Demo['status']
    } else if (Array.isArray(v)) (out as Record<string, unknown>)[k] = v.map(String).map((s) => s.trim()).filter(Boolean)
    else (out as Record<string, unknown>)[k] = v == null ? '' : String(v).slice(0, 2000)
  }
  return out
}

const NEW_AUDIO = /^uploads\/[\w-]+\.\w+$/
const NEW_COVER = /^uploads\/covers\/[\w-]+\.\w+$/
const MAX_VERSIONS = 12

/**
 * The cover and versions sent by the admin page. A file must be a fresh upload
 * or one the song already uses, so nothing else in storage can be pointed at.
 * Returns an error message instead when something is off.
 */
function cleanMedia(input: Record<string, unknown>, current?: Demo): Partial<Demo> | string {
  const known = new Set(current ? filesOf(current) : [])
  const out: Partial<Demo> = {}
  if ('cover' in input) {
    const cover = input.cover ? String(input.cover) : ''
    if (cover && !NEW_COVER.test(cover) && !known.has(cover)) return 'Upload the cover again.'
    out.cover = cover
  }
  if ('versions' in input) {
    const list = Array.isArray(input.versions) ? (input.versions as Record<string, unknown>[]).slice(0, MAX_VERSIONS) : []
    if (!list.length) return 'Keep at least one version of the song.'
    const versions: DemoVersion[] = []
    for (const [i, v] of list.entries()) {
      const file = String(v?.file ?? '')
      if (!NEW_AUDIO.test(file) && !known.has(file)) return 'Upload the song file again.'
      let id = /^[\w-]{1,24}$/.test(String(v.id ?? '')) ? String(v.id) : `v${i + 1}`
      while (versions.some((x) => x.id === id)) id += 'x'
      versions.push({
        id,
        label: String(v.label ?? '').trim().slice(0, 40),
        file,
        duration: typeof v.duration === 'string' && v.duration ? v.duration.slice(0, 8) : undefined,
      })
    }
    out.versions = versions
    const wanted = String(input.defaultVersion ?? '')
    out.defaultVersion = versions.some((v) => v.id === wanted) ? wanted : versions[0].id
  }
  return out
}

/** Deletes uploads a song stopped using, unless another song still uses them. */
async function removeUnused(before: string[], after: string[]) {
  const gone = before.filter((f) => !after.includes(f))
  if (!gone.length) return
  const inUse = new Set((await loadDemos()).flatMap(filesOf))
  for (const f of gone) if (!inUse.has(f)) await removeUpload(f)
}

const sameTag = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase()

function cleanAccess(v: unknown): Person['access'] {
  return Array.isArray(v) ? v.map(String) : 'all'
}

async function body(request: Request) {
  try {
    return (await request.json()) as Record<string, unknown>
  } catch {
    return {}
  }
}

const needStore = () => json({ error: 'The database is not connected yet.', needsStore: true }, 503)

export async function admin(request: Request) {
  const cfg = adminConfig()
  if (!cfg) return json({ error: 'Admin is not configured. Set ADMIN_CODE.' }, 503)
  const url = new URL(request.url)
  const action = url.searchParams.get('action') ?? ''
  const post = request.method === 'POST'

  if (post && action === 'login') {
    const wait = await rateLimit(`admin:${clientIp(request)}`, 5, 60)
    if (wait) return json({ error: 'Too many tries.', retryAfter: wait }, 429, { 'Retry-After': String(wait) })
    const code = String((await body(request)).code ?? '')
    if (!safeEqual(code, cfg.code)) {
      await new Promise((r) => setTimeout(r, 400))
      return json({ error: 'That code is not right.' }, 401)
    }
    return json({ ok: true }, 200, {
      'Set-Cookie': cookie(ADMIN_COOKIE, ADMIN_PATH, createSession(cfg.secret, 'admin', adminVersion(cfg.code), Date.now(), ADMIN_DAYS), ADMIN_DAYS * 86_400, request),
    })
  }
  if (post && action === 'logout') {
    return json({ ok: true }, 200, { 'Set-Cookie': cookie(ADMIN_COOKIE, ADMIN_PATH, '', 0, request) })
  }

  if (!isAdmin(request)) return json({ error: 'Sign in required.' }, 401)
  const s = store()

  switch (`${request.method} ${action}`) {
    case 'GET me':
      return json({ ok: true, storeReady: Boolean(s), uploadsReady: Boolean(r2Config()) || !process.env.VERCEL })

    case 'GET demos': {
      const demos = await loadDemos()
      const [addedIds] = s ? await s.run([['HKEYS', 'demos-added']]) : [[]]
      const ref = (id: string, extra = '') => `${ADMIN_PATH}?action=media&id=${encodeURIComponent(id)}${extra}`
      return json({
        storeReady: Boolean(s),
        tags: tagsWithSongs(await loadTags(), demos),
        demos: demos.map(({ file: _file, cover, ...d }) => ({
          ...d,
          uploaded: ((addedIds ?? []) as string[]).includes(d.id),
          status: d.status ?? 'available',
          coverUrl: cover ? ref(d.id, `&kind=cover&f=${encodeURIComponent(cover.slice(-12))}`) : undefined,
          // Files stay private: the page gets a link per version to listen with, plus the stored path to send back unchanged.
          versions: (d.versions?.length ? d.versions : [{ id: 'main', label: d.note ?? '', file: _file, duration: d.duration }]).map((v) => ({
            ...v,
            audioUrl: ref(d.id, `&v=${encodeURIComponent(v.id)}`),
          })),
        })),
      })
    }

    case 'GET cover':
    case 'GET media': {
      const demo = (await loadDemos()).find((d) => d.id === url.searchParams.get('id'))
      if (!demo || action === 'cover' || url.searchParams.get('kind') === 'cover') return serveFile(request, demo?.cover)
      const v = url.searchParams.get('v')
      const versions = demo.versions?.length ? demo.versions : [{ id: 'main', file: demo.file }]
      return serveFile(request, (versions.find((x) => x.id === v) ?? versions[0]).file)
    }

    case 'POST demo': {
      if (!s) return needStore()
      const b = await body(request)
      const id = String(b.id ?? '')
      const current = (await loadDemos()).find((d) => d.id === id)
      if (!current) return json({ error: 'Not found.' }, 404)
      const input = (b.patch ?? {}) as Record<string, unknown>
      const media = cleanMedia(input, current)
      if (typeof media === 'string') return json({ error: media }, 400)
      await saveDemoEdit(id, { ...cleanPatch(input), ...media })
      const updated = (await loadDemos()).find((d) => d.id === id)!
      await removeUnused(filesOf(current), filesOf(updated))
      return json({ ok: true })
    }

    case 'PUT local-upload': {
      // Only for `npm run dev` without R2: the "signed link" points here and the file lands in private-demos/uploads/.
      if (r2Config() || process.env.VERCEL) return json({ error: 'Not available.' }, 404)
      const ok = await saveLocalUpload(url.searchParams.get('file') ?? '', await request.arrayBuffer())
      return ok ? json({ ok: true }) : json({ error: 'Bad file name.' }, 400)
    }

    case 'POST tags': {
      // Add, rename or remove a market, act type or genre. Renaming and removing update every song using it.
      if (!s) return needStore()
      const b = await body(request)
      const group = String(b.group ?? '') as TagGroup
      if (!TAG_GROUPS.includes(group)) return json({ error: 'Unknown list.' }, 400)
      const value = String(b.value ?? '').trim().slice(0, 40)
      const to = String(b.to ?? '').trim().slice(0, 40)
      if (!value) return json({ error: 'Type a name.' }, 400)
      const demos = await loadDemos()
      const list = tagsWithSongs(await loadTags(), demos)[group]
      let next = list
      if (b.op === 'add') {
        if (list.some((x) => sameTag(x, value))) return json({ ok: true, tags: tagsWithSongs(await loadTags(), demos), value: list.find((x) => sameTag(x, value)) })
        next = [...list, value]
      } else if (b.op === 'rename') {
        if (!to) return json({ error: 'Type the new name.' }, 400)
        if (!sameTag(value, to) && list.some((x) => sameTag(x, to))) return json({ error: `${to} is already in the list.` }, 400)
        next = list.map((x) => (sameTag(x, value) ? to : x))
      } else if (b.op === 'remove') {
        next = list.filter((x) => !sameTag(x, value))
      } else return json({ error: 'Unknown change.' }, 400)

      if (b.op !== 'add') {
        for (const d of demos) {
          const have = tagList(d[group])
          if (!have.some((x) => sameTag(x, value))) continue
          const changed = b.op === 'rename' ? have.map((x) => (sameTag(x, value) ? to : x)) : have.filter((x) => !sameTag(x, value))
          await saveDemoEdit(d.id, { [group]: [...new Set(changed)] })
        }
      }
      await s.run([['HSET', 'tags', group, JSON.stringify(next)]])
      return json({ ok: true, tags: tagsWithSongs(await loadTags(), await loadDemos()), value: b.op === 'add' ? value : to })
    }

    case 'POST upload-url': {
      // A signed link the browser uses to send a song or cover straight to R2.
      const r2 = r2Config()
      if (!r2 && process.env.VERCEL) return json({ error: 'Song storage (Cloudflare R2) is not connected yet.' }, 503)
      const b = await body(request)
      const kind = b.kind === 'cover' ? 'cover' : 'audio'
      const ext = String(b.filename ?? '').toLowerCase().match(/\.(mp3|m4a|aac|wav|ogg|flac|jpg|jpeg|png|webp)$/)?.[1]
      const allowed = kind === 'audio' ? ['mp3', 'm4a', 'aac', 'wav', 'ogg', 'flac'] : ['jpg', 'jpeg', 'png', 'webp']
      if (!ext || !allowed.includes(ext)) return json({ error: kind === 'audio' ? 'Use an MP3, M4A, WAV, AAC, OGG or FLAC file.' : 'Use a JPG, PNG or WebP image.' }, 400)
      const file = `uploads/${kind === 'cover' ? 'covers/' : ''}${randomUUID()}.${ext}`
      return json({ file, url: r2 ? r2Url(r2, 'PUT', objectKey(file), 3600) : `${ADMIN_PATH}?action=local-upload&file=${encodeURIComponent(file)}` })
    }

    case 'POST demo-create': {
      if (!s) return needStore()
      const b = await body(request)
      const patch = cleanPatch((b.patch ?? {}) as Record<string, unknown>)
      // Older pages send one `file`; the current one sends the full version list.
      const media = cleanMedia({
        cover: b.cover,
        versions: Array.isArray(b.versions) ? b.versions : b.file ? [{ id: 'main', label: patch.note ?? '', file: b.file, duration: b.duration }] : [],
        defaultVersion: b.defaultVersion,
      })
      if (typeof media === 'string') return json({ error: media === 'Keep at least one version of the song.' ? 'Upload the song first.' : media }, 400)
      if (!patch.title) return json({ error: 'Add a title.' }, 400)
      const slug = patch.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'demo'
      const main = media.versions!.find((v) => v.id === media.defaultVersion)!
      const demo = {
        status: 'available' as const,
        ...patch,
        ...media,
        cover: media.cover || undefined,
        id: `${slug}-${randomUUID().slice(0, 4)}`,
        file: main.file,
        duration: main.duration,
        date: new Date().toISOString().slice(0, 10),
        addedAt: new Date().toISOString(),
      }
      await s.run([['HSET', 'demos-added', demo.id, JSON.stringify(demo)]])
      return json({ ok: true, id: demo.id })
    }

    case 'POST demo-delete': {
      // Only songs uploaded here can be deleted; songs from demos.json can be hidden instead.
      if (!s) return needStore()
      const id = String((await body(request)).id ?? '')
      const [raw] = await s.run([['HGET', 'demos-added', id]])
      if (!raw) return json({ error: 'Only songs uploaded on this page can be deleted. Hide the others instead.' }, 400)
      const current = (await loadDemos()).find((d) => d.id === id) ?? (JSON.parse(String(raw)) as Demo)
      await s.run([['HDEL', 'demos-added', id], ['HDEL', 'demo-edits', id]])
      await removeUnused(filesOf(current), [])
      return json({ ok: true })
    }

    case 'GET people': {
      if (!s) return json({ storeReady: false, people: [] })
      const legacy = await legacyPerson()
      const people = [...(await loadPeople()), ...(legacy ? [legacy] : [])]
      const results = await s.run([['HGETALL', 'stats'], ...people.map((p) => ['SMEMBERS', `favs:${p.id}`])])
      const stats = pairs(results[0])
      return json({
        storeReady: true,
        people: people.map((p, i) => ({
          ...p,
          favorites: (results[i + 1] as string[]) ?? [],
          lastSeen: stats[`${p.id}:seen`] ?? null,
          plays: Number(stats[`${p.id}:plays`] ?? 0),
        })),
      })
    }

    case 'POST person-create': {
      if (!s) return needStore()
      const b = await body(request)
      const name = String(b.name ?? '').trim().slice(0, 80)
      if (!name) return json({ error: 'Add a name.' }, 400)
      const person: Person = {
        id: randomUUID().slice(0, 8),
        name,
        code: newCode(),
        access: cleanAccess(b.access),
        status: 'active',
        createdAt: new Date().toISOString(),
        version: 1,
      }
      await savePerson(person)
      return json({ ok: true, person })
    }

    case 'POST person-update': {
      if (!s) return needStore()
      const b = await body(request)
      const id = String(b.id ?? '')
      if (id === LEGACY_ID) {
        // The old shared password can only be turned off or back on.
        const legacy = await legacyPerson()
        if (!legacy) return json({ error: 'Not found.' }, 404)
        const status = b.status === 'removed' ? 'removed' : 'active'
        await s.run([['HSET', 'legacy', 'status', status, 'version', legacy.version + 1]])
        return json({ ok: true })
      }
      const person = (await loadPeople()).find((p) => p.id === id)
      if (!person) return json({ error: 'Not found.' }, 404)
      if (typeof b.name === 'string' && b.name.trim()) person.name = b.name.trim().slice(0, 80)
      if ('access' in b) person.access = cleanAccess(b.access)
      if (b.status === 'removed' || b.status === 'active') {
        if (b.status !== person.status) person.version++
        person.status = b.status
      }
      if (b.newCode) {
        person.code = newCode()
        person.version++
      }
      await savePerson(person)
      return json({ ok: true, person })
    }

    case 'GET activity': {
      if (!s) return json({ storeReady: false, log: [] })
      const [rows] = await s.run([['LRANGE', 'log', 0, 199]])
      return json({ storeReady: true, log: ((rows ?? []) as string[]).map((r) => JSON.parse(r) as LogEntry) })
    }
  }
  return json({ error: 'Unknown action.' }, 404)
}

