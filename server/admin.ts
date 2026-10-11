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
  loadDemos,
  loadPeople,
  newCode,
  rateLimit,
  readCookie,
  safeEqual,
  savePerson,
  serveFile,
  verifySession,
  type Demo,
  type LogEntry,
  type Person,
} from './demos.js'
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
      return json({ ok: true, storeReady: Boolean(s) })

    case 'GET demos': {
      const demos = await loadDemos()
      return json({
        storeReady: Boolean(s),
        demos: demos.map(({ file: _file, cover, ...d }) => ({
          ...d,
          status: d.status ?? 'available',
          coverUrl: cover ? `${ADMIN_PATH}?action=cover&id=${encodeURIComponent(d.id)}` : undefined,
        })),
      })
    }

    case 'GET cover': {
      const demo = (await loadDemos()).find((d) => d.id === url.searchParams.get('id'))
      return serveFile(request, demo?.cover)
    }

    case 'POST demo': {
      if (!s) return needStore()
      const b = await body(request)
      const id = String(b.id ?? '')
      if (!(await loadDemos()).some((d) => d.id === id)) return json({ error: 'Not found.' }, 404)
      const [prev] = await s.run([['HGET', 'demo-edits', id]])
      const merged = { ...(prev ? JSON.parse(String(prev)) : {}), ...cleanPatch((b.patch ?? {}) as Record<string, unknown>) }
      await s.run([['HSET', 'demo-edits', id, JSON.stringify(merged)]])
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

