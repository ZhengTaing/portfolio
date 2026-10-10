/**
 * Password-protected demos ("Unreleased").
 *
 * Everything here runs on the server only (Vercel functions in `api/`, or the
 * Vite dev middleware locally). Demo audio and metadata live in
 * `private-demos/`, which is never copied into the public site, so the files
 * cannot be downloaded without a valid session cookie.
 *
 * Environment variables:
 *   DEMOS_PASSWORD        the password visitors type in
 *   DEMOS_SESSION_SECRET  random string used to sign the session cookie
 */
import { createHmac, timingSafeEqual } from 'node:crypto'
import { open, readFile, stat } from 'node:fs/promises'
import { join, resolve } from 'node:path'

export const COOKIE_NAME = 'zt_demos'
const SESSION_DAYS = 7
const DEMOS_DIR = resolve(process.cwd(), 'private-demos')
/** Max bytes per response; serverless functions cap response size (~4.5 MB on Vercel). */
const CHUNK = 2 * 1024 * 1024

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
  bpm?: number
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
}

/** The fields visitors are allowed to see; private management fields are dropped here. */
export function toPublic(d: Demo) {
  const { file: _file, cover, privateNotes: _notes, reservation: _reservation, ...rest } = d
  return {
    ...rest,
    status: d.status ?? 'available',
    holdUntil: d.status === 'on-hold' ? d.holdUntil : undefined,
    placedWith: d.status === 'placed' ? d.placedWith : undefined,
    audioUrl: `/api/demos/audio?id=${encodeURIComponent(d.id)}`,
    coverUrl: cover ? `/api/demos/audio?id=${encodeURIComponent(d.id)}&kind=cover` : undefined,
  }
}

interface Config {
  password: string
  secret: string
}

function config(): Config | null {
  const password = process.env.DEMOS_PASSWORD
  const secret = process.env.DEMOS_SESSION_SECRET
  if (!password || !secret) return null
  return { password, secret }
}

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers },
  })

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  return ab.length === bb.length && timingSafeEqual(ab, bb)
}

function sign(payload: string, secret: string) {
  return createHmac('sha256', secret).update(payload).digest('base64url')
}

export function createSession(secret: string, now = Date.now()) {
  const expires = now + SESSION_DAYS * 24 * 60 * 60 * 1000
  const payload = String(expires)
  return `${payload}.${sign(payload, secret)}`
}

export function verifySession(token: string | undefined, secret: string, now = Date.now()) {
  if (!token) return false
  const [payload, signature] = token.split('.')
  if (!payload || !signature) return false
  if (!safeEqual(signature, sign(payload, secret))) return false
  return Number(payload) > now
}

function readCookie(request: Request, name: string) {
  const header = request.headers.get('cookie') ?? ''
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=')
    if (k === name) return decodeURIComponent(v.join('='))
  }
  return undefined
}

function cookie(value: string, maxAge: number, request: Request) {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : ''
  return `${COOKIE_NAME}=${value}; Path=/api/demos; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`
}

function isAuthed(request: Request, cfg: Config) {
  return verifySession(readCookie(request, COOKIE_NAME), cfg.secret)
}

async function loadDemos(): Promise<Demo[]> {
  try {
    return JSON.parse(await readFile(join(DEMOS_DIR, 'demos.json'), 'utf8')) as Demo[]
  } catch {
    return []
  }
}

/** POST /api/demos/login  { password } */
export async function login(request: Request) {
  const cfg = config()
  if (!cfg) return json({ error: 'Demos are not configured.' }, 503)
  let password = ''
  try {
    password = String(((await request.json()) as { password?: unknown }).password ?? '')
  } catch {
    return json({ error: 'Bad request.' }, 400)
  }
  if (!safeEqual(password, cfg.password)) {
    // Slow down guessing.
    await new Promise((r) => setTimeout(r, 800))
    return json({ error: 'Wrong password.' }, 401)
  }
  return json({ ok: true }, 200, {
    'Set-Cookie': cookie(createSession(cfg.secret), SESSION_DAYS * 24 * 60 * 60, request),
  })
}

/** POST /api/demos/logout */
export async function logout(request: Request) {
  return json({ ok: true }, 200, { 'Set-Cookie': cookie('', 0, request) })
}

/** GET /api/demos  →  list of demos (without file paths) */
export async function list(request: Request) {
  const cfg = config()
  if (!cfg) return json({ error: 'Demos are not configured.' }, 503)
  if (!isAuthed(request, cfg)) return json({ error: 'Password required.' }, 401)
  const demos = await loadDemos()
  return json({
    demos: demos.map(toPublic),
  })
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

/** GET /api/demos/audio?id=…  →  the audio file, with Range support for seeking. */
export async function audio(request: Request) {
  const cfg = config()
  if (!cfg) return new Response('Not configured', { status: 503 })
  if (!isAuthed(request, cfg)) return new Response('Password required', { status: 401 })

  const params = new URL(request.url).searchParams
  const id = params.get('id')
  const demo = (await loadDemos()).find((d) => d.id === id)
  if (!demo) return new Response('Not found', { status: 404 })
  const file = params.get('kind') === 'cover' ? demo.cover : demo.file
  if (!file) return new Response('Not found', { status: 404 })

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
