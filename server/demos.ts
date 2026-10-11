/**
 * Private demos ("Unreleased"), unlocked with personal access codes.
 *
 * Everything here runs on the server only (Vercel functions in `api/`, or the
 * Vite dev middleware locally). Demo audio and metadata live in
 * `private-demos/`, which is never copied into the public site, so the files
 * cannot be downloaded without a valid session cookie.
 *
 * Each person gets their own code (made on the /admin page). Signing in gives
 * a 3-day session tied to that person; removing them or giving them a new code
 * ends every session they have at once.
 *
 * Environment variables:
 *   DEMOS_SESSION_SECRET  random string used to sign session cookies (required)
 *   DEMOS_PASSWORD        optional: the old shared password, which keeps working
 *                         until you turn it off on the admin People page
 *   KV_REST_API_URL / KV_REST_API_TOKEN  the Upstash Redis database (see store.ts)
 *   R2_*                  optional: Cloudflare R2 bucket holding the audio (see r2.ts)
 */
import { createHash, createHmac, randomInt, timingSafeEqual } from 'node:crypto'
import { open, readFile, stat } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { objectKey, r2Config, r2Url } from './r2.js'
import { pairs, store } from './store.js'

export const COOKIE_NAME = 'zt_demos'
const SESSION_DAYS = 3
const DEMOS_DIR = resolve(process.cwd(), 'private-demos')
/** Max bytes per response; serverless functions cap response size (~4.5 MB on Vercel). */
const CHUNK = 2 * 1024 * 1024
/** Sign-in attempts allowed per IP address per minute. */
const LOGIN_LIMIT = 5

export type PitchStatus = 'available' | 'on-hold' | 'reserved' | 'placed'

/** One demo / song pitch, as stored in private-demos/demos.json. */
export interface Demo {
  id: string
  title: string
  /** Audio file inside private-demos/. */
  file: string
  /** Optional cover image inside private-demos/ (e.g. "covers/moonlight.jpg"). */
  cover?: string
  note?: string
  date?: string
  duration?: string
  /** Who recorded / is associated with the demo. */
  demoArtist?: string
  /** Who the song is being pitched to. Empty means an open pitch. */
  targetArtists?: string[]
  /** One or more of the filter values, e.g. ["K-pop", "Western pop"]. */
  market?: string | string[]
  actType?: string | string[]
  genre?: string | string[]
  /** Musical key, e.g. "D major". */
  key?: string
  bpm?: number | null
  status?: PitchStatus
  pitchNotes?: string
  /** On hold: ISO date the hold runs until (shown on the card). */
  holdUntil?: string
  /** Placed: who cut the song. */
  placedWith?: string
  /** Never sent to the browser. */
  privateNotes?: string
  /** Never sent to the browser. */
  reservation?: string
  /** Hidden from everyone (set on the admin page). */
  hidden?: boolean
}

/** Someone with an access code. */
export interface Person {
  id: string
  name: string
  code: string
  /** "all" (the default) or a list of demo ids. */
  access: 'all' | string[]
  status: 'active' | 'removed'
  createdAt: string
  /** Bumped to end all of this person's sessions. */
  version: number
}

/** The fields visitors are allowed to see; private management fields are dropped here. */
export function toPublic(d: Demo) {
  const { file: _file, cover, privateNotes: _notes, reservation: _reservation, hidden: _hidden, ...rest } = d
  return {
    ...rest,
    status: d.status ?? 'available',
    holdUntil: d.status === 'on-hold' ? d.holdUntil : undefined,
    placedWith: d.status === 'placed' ? d.placedWith : undefined,
    audioUrl: `/api/demos/audio?id=${encodeURIComponent(d.id)}`,
    coverUrl: cover ? `/api/demos/audio?id=${encodeURIComponent(d.id)}&kind=cover` : undefined,
  }
}

export const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers },
  })

const sha = (s: string) => createHash('sha256').update(s).digest()

/** Constant-time comparison that doesn't reveal the length either. */
export function safeEqual(a: string, b: string) {
  return timingSafeEqual(sha(a), sha(b))
}

export function sign(payload: string, secret: string) {
  return createHmac('sha256', secret).update(payload).digest('base64url')
}

function secret() {
  return process.env.DEMOS_SESSION_SECRET || null
}

// ---------------------------------------------------------------- sessions

export interface Session {
  /** Person id ("legacy" for the old shared password). */
  p: string
  /** Person version when the session was made. */
  v: string
  /** Expiry, ms since epoch. */
  e: number
}

export function createSession(key: string, person: string, version: string, now = Date.now(), days = SESSION_DAYS) {
  const payload = Buffer.from(JSON.stringify({ p: person, v: version, e: now + days * 86_400_000 })).toString('base64url')
  return `${payload}.${sign(payload, key)}`
}

export function verifySession(token: string | undefined, key: string, now = Date.now()): Session | null {
  if (!token) return null
  const [payload, signature] = token.split('.')
  if (!payload || !signature) return null
  if (!safeEqual(signature, sign(payload, key))) return null
  try {
    const s = JSON.parse(Buffer.from(payload, 'base64url').toString()) as Session
    return typeof s.p === 'string' && typeof s.v === 'string' && s.e > now ? s : null
  } catch {
    return null
  }
}

export function readCookie(request: Request, name: string) {
  const header = request.headers.get('cookie') ?? ''
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=')
    if (k === name) return decodeURIComponent(v.join('='))
  }
  return undefined
}

export function cookie(name: string, path: string, value: string, maxAge: number, request: Request) {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : ''
  return `${name}=${value}; Path=${path}; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`
}

export function clientIp(request: Request) {
  return (request.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || request.headers.get('x-real-ip') || 'local'
}

// ------------------------------------------------------------ rate limiting

const memoryHits = new Map<string, { n: number; until: number }>()

/** Counts one attempt; returns seconds to wait if over the limit, else 0. */
export async function rateLimit(name: string, max: number, windowSec: number) {
  const s = store()
  if (s) {
    const key = `rl:${name}`
    const [n, ttl] = (await s.run([['INCR', key], ['TTL', key]])) as [number, number]
    if (n === 1 || ttl < 0) await s.run([['EXPIRE', key, windowSec]])
    return n > max ? Math.max(1, ttl) : 0
  }
  const now = Date.now()
  const hit = memoryHits.get(name)
  if (!hit || hit.until < now) {
    memoryHits.set(name, { n: 1, until: now + windowSec * 1000 })
    return 0
  }
  hit.n++
  return hit.n > max ? Math.ceil((hit.until - now) / 1000) : 0
}

// ---------------------------------------------------------------- people

export const LEGACY_ID = 'legacy'

export function normalizeCode(code: string) {
  return code.toLowerCase().replace(/[^a-z0-9]/g, '')
}

const CODE_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789'

/** A new code like "k3j9-xp2m-7qwa" (no 0/o/1/l/i to avoid mix-ups). */
export function newCode() {
  const c = Array.from({ length: 12 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join('')
  return `${c.slice(0, 4)}-${c.slice(4, 8)}-${c.slice(8)}`
}

export async function loadPeople(): Promise<Person[]> {
  const s = store()
  if (!s) return []
  const [all] = await s.run([['HGETALL', 'people']])
  return Object.values(pairs(all))
    .map((v) => JSON.parse(v) as Person)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export async function savePerson(p: Person) {
  await store()!.run([['HSET', 'people', p.id, JSON.stringify(p)]])
}

/** The old shared password, shown on the admin page as its own row so it can be turned off. */
export async function legacyPerson(): Promise<Person | null> {
  const password = process.env.DEMOS_PASSWORD
  if (!password) return null
  const s = store()
  const saved = s ? pairs((await s.run([['HGETALL', 'legacy']]))[0]) : {}
  return {
    id: LEGACY_ID,
    name: 'Old shared password',
    code: password,
    access: 'all',
    status: saved.status === 'removed' ? 'removed' : 'active',
    createdAt: '',
    version: Number(saved.version ?? 0),
  }
}

/** Version string stored in sessions. For the shared password it also changes when the password does. */
const versionOf = (p: Person) => (p.id === LEGACY_ID ? `${sha(p.code).toString('hex').slice(0, 8)}:${p.version}` : String(p.version))

export async function findPerson(id: string) {
  if (id === LEGACY_ID) return legacyPerson()
  const s = store()
  if (!s) return null
  const [v] = await s.run([['HGET', 'people', id]])
  return v ? (JSON.parse(String(v)) as Person) : null
}

export const canHear = (p: Person, demoId: string) => p.access === 'all' || p.access.includes(demoId)

type Auth = { ok: true; person: Person } | { ok: false; ended: boolean }

/** Who is signed in. `ended` means they had access but it was removed or replaced. */
async function authenticate(request: Request): Promise<Auth> {
  const key = secret()
  if (!key) return { ok: false, ended: false }
  const session = verifySession(readCookie(request, COOKIE_NAME), key)
  if (!session) return { ok: false, ended: false }
  const person = await findPerson(session.p)
  if (!person || person.status !== 'active' || versionOf(person) !== session.v) return { ok: false, ended: true }
  return { ok: true, person }
}

// ---------------------------------------------------------------- activity

export interface LogEntry {
  at: string
  who: string
  name: string
  event: 'signed-in' | 'played' | 'wrong-code' | 'blocked' | 'favorited'
  demoId?: string
  title?: string
}

export async function logEvent(e: Omit<LogEntry, 'at'>, extra: (string | number)[][] = []) {
  const s = store()
  if (!s) return
  const entry: LogEntry = { at: new Date().toISOString(), ...e }
  await s.run([['LPUSH', 'log', JSON.stringify(entry)], ['LTRIM', 'log', 0, 499], ...extra]).catch(() => {})
}

// ---------------------------------------------------------------- demos

async function demosFile(): Promise<Demo[]> {
  try {
    return JSON.parse(await readFile(join(DEMOS_DIR, 'demos.json'), 'utf8')) as Demo[]
  } catch {
    return []
  }
}

/** demos.json plus songs uploaded on the admin page, with admin edits applied on top. */
export async function loadDemos(): Promise<Demo[]> {
  const fromFile = await demosFile()
  const s = store()
  if (!s) return fromFile
  const [editsRaw, addedRaw] = await s.run([['HGETALL', 'demo-edits'], ['HGETALL', 'demos-added']])
  const edits = pairs(editsRaw)
  const added = Object.values(pairs(addedRaw))
    .map((v) => JSON.parse(v) as Demo & { addedAt?: string })
    .sort((a, b) => (b.addedAt ?? '').localeCompare(a.addedAt ?? ''))
  const demos = [...added, ...fromFile.filter((d) => !added.some((a) => a.id === d.id))]
  return demos.map((d) => (edits[d.id] ? { ...d, ...(JSON.parse(edits[d.id]) as Partial<Demo>), id: d.id, file: d.file, cover: d.cover } : d))
}

async function favoritesOf(personId: string) {
  const s = store()
  if (!s) return null
  return ((await s.run([['SMEMBERS', `favs:${personId}`]]))[0] as string[]) ?? []
}

// ---------------------------------------------------------------- handlers

const COOKIE_PATH = '/api/demos'

/** POST /api/demos/login  { code } */
export async function login(request: Request) {
  const key = secret()
  if (!key) return json({ error: 'Demos are not configured.' }, 503)
  let code = ''
  try {
    const body = (await request.json()) as { code?: unknown; password?: unknown }
    code = String(body.code ?? body.password ?? '')
  } catch {
    return json({ error: 'Bad request.' }, 400)
  }

  const ip = clientIp(request)
  const wait = await rateLimit(`login:${ip}`, LOGIN_LIMIT, 60)
  if (wait) {
    if (wait >= 55) await logEvent({ who: '', name: 'Unknown', event: 'blocked' })
    return json({ error: 'Too many tries.', retryAfter: wait }, 429, { 'Retry-After': String(wait) })
  }

  const wanted = normalizeCode(code)
  const legacy = await legacyPerson()
  const people = [...(legacy ? [legacy] : []), ...(await loadPeople())]
  // Compare against everyone (constant time per code) so timing doesn't reveal anything.
  let match: Person | undefined
  for (const p of people) {
    const ok = p.id === LEGACY_ID ? safeEqual(code, p.code) : safeEqual(wanted, normalizeCode(p.code))
    if (ok && !match) match = p
  }
  if (!match || match.status !== 'active' || !wanted) {
    await logEvent({ who: '', name: 'Unknown', event: 'wrong-code' })
    await new Promise((r) => setTimeout(r, 400))
    return json({ error: 'That code is not right.' }, 401)
  }

  await logEvent({ who: match.id, name: match.name, event: 'signed-in' }, [['HSET', 'stats', `${match.id}:seen`, new Date().toISOString()]])
  return json({ ok: true }, 200, {
    'Set-Cookie': cookie(COOKIE_NAME, COOKIE_PATH, createSession(key, match.id, versionOf(match)), SESSION_DAYS * 86_400, request),
  })
}

/** POST /api/demos/logout */
export async function logout(request: Request) {
  return json({ ok: true }, 200, { 'Set-Cookie': cookie(COOKIE_NAME, COOKIE_PATH, '', 0, request) })
}

function denied(auth: Auth) {
  const ended = 'ended' in auth && auth.ended
  return json({ error: ended ? 'Your access has ended.' : 'Access code required.', ended }, 401)
}

/** GET /api/demos  →  { me, favorites, demos } for the signed-in person */
export async function list(request: Request) {
  if (!secret()) return json({ error: 'Demos are not configured.' }, 503)
  const auth = await authenticate(request)
  if (!auth.ok) return denied(auth)
  const { person } = auth
  const demos = (await loadDemos()).filter((d) => !d.hidden && canHear(person, d.id))
  const favs = await favoritesOf(person.id)
  return json({
    // No greeting for the old shared password.
    me: person.id === LEGACY_ID ? null : { name: person.name },
    favorites: favs ? favs.filter((id) => demos.some((d) => d.id === id)) : null,
    demos: demos.map(toPublic),
  })
}

/** POST /api/demos/favorite  { id, on }  →  heart / un-heart a song */
export async function favorite(request: Request) {
  const auth = await authenticate(request)
  if (!auth.ok) return denied(auth)
  const s = store()
  if (!s) return json({ error: 'Favorites are not set up yet.' }, 503)
  let id = ''
  let on = true
  try {
    const body = (await request.json()) as { id?: unknown; on?: unknown }
    id = String(body.id ?? '')
    on = body.on !== false
  } catch {
    return json({ error: 'Bad request.' }, 400)
  }
  const demo = (await loadDemos()).find((d) => d.id === id && !d.hidden)
  if (!demo || !canHear(auth.person, id)) return json({ error: 'Not found.' }, 404)
  await s.run([[on ? 'SADD' : 'SREM', `favs:${auth.person.id}`, id]])
  if (on) await logEvent({ who: auth.person.id, name: auth.person.name, event: 'favorited', demoId: id, title: demo.title })
  return json({ ok: true, favorites: await favoritesOf(auth.person.id) })
}

const MIME: Record<string, string> = {
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.flac': 'audio/flac',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
}

/**
 * Sends a demo file. With R2 set up this is a redirect to a signed link that
 * expires in 2 hours; otherwise the file is streamed from private-demos/.
 */
export async function serveFile(request: Request, file: string | undefined) {
  if (!file) return new Response('Not found', { status: 404 })
  const r2 = r2Config()
  if (r2) {
    return new Response(null, {
      status: 302,
      headers: { Location: r2Url(r2, 'GET', objectKey(file), 7200), 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' },
    })
  }
  // Only ever serve files from inside private-demos/.
  const path = resolve(DEMOS_DIR, file)
  if (!path.startsWith(DEMOS_DIR + '/')) return new Response('Not found', { status: 404 })

  let size: number
  try {
    size = (await stat(path)).size
  } catch {
    return new Response('Not found', { status: 404 })
  }
  const ext = path.slice(path.lastIndexOf('.')).toLowerCase()
  const headers: Record<string, string> = {
    'Content-Type': MIME[ext] ?? 'application/octet-stream',
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'private, no-store',
    'Content-Disposition': 'inline',
  }

  // Audio elements always request byte ranges. Serve at most CHUNK bytes per
  // response; the browser simply asks for the next range as it plays.
  const range = request.headers.get('range')?.match(/bytes=(\d*)-(\d*)/)
  if (!range && size <= CHUNK) {
    return new Response(await readFile(path), { headers: { ...headers, 'Content-Length': String(size) } })
  }
  let start = 0
  let end = size - 1
  if (range) {
    if (range[1]) {
      start = Number(range[1])
      if (range[2]) end = Math.min(Number(range[2]), size - 1)
    } else if (range[2]) {
      // Suffix range: the last N bytes.
      start = Math.max(0, size - Number(range[2]))
    }
  }
  if (start > end || start >= size) {
    return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } })
  }
  end = Math.min(end, start + CHUNK - 1)
  const length = end - start + 1
  const buffer = Buffer.alloc(length)
  const handle = await open(path, 'r')
  try {
    await handle.read(buffer, 0, length, start)
  } finally {
    await handle.close()
  }
  return new Response(buffer, {
    status: 206,
    headers: { ...headers, 'Content-Range': `bytes ${start}-${end}/${size}`, 'Content-Length': String(length) },
  })
}

/** GET /api/demos/audio?id=…[&kind=cover]  →  the audio file (or cover image). */
export async function audio(request: Request) {
  if (!secret()) return new Response('Not configured', { status: 503 })
  const auth = await authenticate(request)
  if (!auth.ok) return new Response('Access code required', { status: 401 })

  const params = new URL(request.url).searchParams
  const id = params.get('id') ?? ''
  const demo = (await loadDemos()).find((d) => d.id === id && !d.hidden)
  if (!demo || !canHear(auth.person, id)) return new Response('Not found', { status: 404 })
  const isCover = params.get('kind') === 'cover'

  // Count a play when the song starts loading from the beginning (at most once per 30 minutes).
  const range = request.headers.get('range')
  if (!isCover && (!range || /^bytes=0-/.test(range)) && !(await rateLimit(`play:${auth.person.id}:${id}`, 1, 1800))) {
    const { person } = auth
    await logEvent({ who: person.id, name: person.name, event: 'played', demoId: id, title: demo.title }, [
      ['HINCRBY', 'stats', `${person.id}:plays`, 1],
      ['HSET', 'stats', `${person.id}:seen`, new Date().toISOString()],
    ])
  }
  return serveFile(request, isCover ? demo.cover : demo.file)
}
