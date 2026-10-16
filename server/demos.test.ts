// @vitest-environment node
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { admin } from './admin'
import { createSession, favorite, list, login, toPublic, verifySession } from './demos'
import { memoryStore, setStore } from './store'

describe('demo session tokens', () => {
  const secret = 'test-secret'

  it('accepts a fresh token signed with the right secret', () => {
    expect(verifySession(createSession(secret, 'p1', '1'), secret)).toMatchObject({ p: 'p1', v: '1' })
  })

  it('rejects tampered, foreign, expired and missing tokens', () => {
    const token = createSession(secret, 'p1', '1')
    const [payload, sig] = token.split('.')
    const forged = Buffer.from(JSON.stringify({ p: 'p2', v: '1', e: Date.now() + 1e9 })).toString('base64url')
    expect(verifySession(`${forged}.${sig}`, secret)).toBeNull()
    expect(verifySession(`${payload}.x${sig}`, secret)).toBeNull()
    expect(verifySession(token, 'other-secret')).toBeNull()
    expect(verifySession(createSession(secret, 'p1', '1', 0), secret)).toBeNull()
    expect(verifySession(undefined, secret)).toBeNull()
    expect(verifySession('garbage', secret)).toBeNull()
  })
})

describe('demo privacy', () => {
  it('never sends private management fields to the browser', () => {
    const out = toPublic({
      id: 'x',
      title: 'X',
      file: 'x.mp3',
      cover: 'covers/x.jpg',
      status: 'reserved',
      holdUntil: '2026-10-30',
      privateNotes: 'secret',
      reservation: 'for someone',
    })
    expect(out).not.toHaveProperty('privateNotes')
    expect(out).not.toHaveProperty('reservation')
    expect(out).not.toHaveProperty('file')
    expect(out).not.toHaveProperty('cover')
    expect(out.holdUntil).toBeUndefined()
    expect(out.coverUrl).toContain('kind=cover')
  })
})

describe('personal access codes', () => {
  const env = { ...process.env }
  let ip = 0
  const req = (path: string, init: RequestInit & { cookie?: string } = {}) =>
    new Request(`http://localhost${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': `10.0.0.${ip}`, ...(init.cookie ? { cookie: init.cookie } : {}) },
    })
  const cookieOf = (res: Response) => res.headers.get('set-cookie')!.split(';')[0]
  let adminCookie = ''
  const call = async (action: string, body?: unknown) => {
    const res = await admin(req(`/api/admin?action=${action}`, { method: body ? 'POST' : 'GET', body: body ? JSON.stringify(body) : undefined, cookie: adminCookie }))
    return res.json() as Promise<Record<string, any>>
  }
  const signIn = async (code: string) => login(req('/api/demos/login', { method: 'POST', body: JSON.stringify({ code }) }))

  beforeEach(async () => {
    ip++
    setStore(memoryStore())
    process.env.DEMOS_SESSION_SECRET = 'secret'
    process.env.ADMIN_CODE = 'admin-code'
    delete process.env.DEMOS_PASSWORD
    adminCookie = cookieOf(await admin(req('/api/admin?action=login', { method: 'POST', body: JSON.stringify({ code: 'admin-code' }) })))
  })
  afterAll(() => {
    process.env = env
    setStore(null)
  })

  it('admin needs the admin code', async () => {
    const res = await admin(req('/api/admin?action=people'))
    expect(res.status).toBe(401)
    const wrong = await admin(req('/api/admin?action=login', { method: 'POST', body: JSON.stringify({ code: 'nope' }) }))
    expect(wrong.status).toBe(401)
  })

  it('a personal code signs in, can be limited to some songs, and can be revoked', async () => {
    const { person } = await call('person-create', { name: 'Paul', access: 'all' })
    expect(person.code).toMatch(/^[a-z2-9]{4}-[a-z2-9]{4}-[a-z2-9]{4}$/)

    expect((await signIn('wrong-code')).status).toBe(401)
    // Codes work with any capitalisation and without the dashes.
    const ok = await signIn(person.code.toUpperCase().replace(/-/g, ''))
    expect(ok.status).toBe(200)
    expect(ok.headers.get('set-cookie')).toMatch(/HttpOnly; SameSite=Strict; Max-Age=259200/)
    const cookie = cookieOf(ok)

    const listed = (await (await list(req('/api/demos', { cookie }))).json()) as Record<string, unknown>
    expect(listed.me).toEqual({ name: 'Paul' })
    expect(listed.favorites).toEqual([])

    // Removing them ends the session straight away.
    await call('person-update', { id: person.id, status: 'removed' })
    const after = await list(req('/api/demos', { cookie }))
    expect(after.status).toBe(401)
    expect(await after.json()).toMatchObject({ ended: true })
    expect((await signIn(person.code)).status).toBe(401)
  })

  it('a new code replaces the old one and logs the person out', async () => {
    const { person } = await call('person-create', { name: 'Sam' })
    const cookie = cookieOf(await signIn(person.code))
    const { person: updated } = await call('person-update', { id: person.id, newCode: true })
    expect(updated.code).not.toBe(person.code)
    expect((await list(req('/api/demos', { cookie }))).status).toBe(401)
    expect((await signIn(person.code)).status).toBe(401)
    expect((await signIn(updated.code)).status).toBe(200)
  })

  it('limits sign-in attempts per address', async () => {
    const codes = await Promise.all(Array.from({ length: 6 }, () => signIn('guess')))
    expect(codes.map((r) => r.status)).toContain(429)
  })

  it('saves favorites per person and only for songs they can hear', async () => {
    const { person } = await call('person-create', { name: 'Label', access: ['nope'] })
    const cookie = cookieOf(await signIn(person.code))
    const res = await favorite(req('/api/demos/favorite', { method: 'POST', body: JSON.stringify({ id: 'anything', on: true }), cookie }))
    expect(res.status).toBe(404)
    const people = await call('people')
    expect(people.people[0].favorites).toEqual([])
  })

  it('lets the admin swap the cover and song files, and add versions shown as one song', async () => {
    const created = await call('demo-create', {
      cover: 'uploads/covers/c1.jpg',
      versions: [{ id: 'ai', label: 'AI demo', file: 'uploads/a1.mp3', duration: '3:01' }],
      patch: { title: 'Swap Test' },
    })
    expect(created.ok).toBe(true)
    const id = created.id as string
    const find = async () => ((await call('demos')).demos as Record<string, any>[]).find((d) => d.id === id)!

    // Swap the cover, replace the AI demo's file, and add a V2 that plays first.
    await call('demo', {
      id,
      patch: {
        cover: 'uploads/covers/c2.jpg',
        versions: [
          { id: 'ai', label: 'AI demo', file: 'uploads/a2.mp3', duration: '3:02' },
          { id: 'v2', label: 'V2', file: 'uploads/b1.mp3', duration: '2:40' },
        ],
        defaultVersion: 'v2',
      },
    })
    let d = await find()
    expect(d.versions.map((v: { label: string }) => v.label)).toEqual(['AI demo', 'V2'])
    expect(d.defaultVersion).toBe('v2')
    expect(d.duration).toBe('2:40')
    expect(d.note).toBe('V2')
    expect(d.coverUrl).toContain('c2.jpg')

    // Swap back: the AI demo plays first again and the cover can be removed.
    await call('demo', { id, patch: { cover: '', versions: d.versions, defaultVersion: 'ai' } })
    d = await find()
    expect(d.defaultVersion).toBe('ai')
    expect(d.coverUrl).toBeUndefined()

    // Files that are not fresh uploads or already the song's own are refused.
    const bad = await admin(req('/api/admin?action=demo', { method: 'POST', body: JSON.stringify({ id, patch: { versions: [{ file: '../secret.mp3' }] } }), cookie: adminCookie }))
    expect(bad.status).toBe(400)

    // Visitors get one song with a link per version.
    const { person } = await call('person-create', { name: 'Vee' })
    const cookie = cookieOf(await signIn(person.code))
    const listed = (await (await list(req('/api/demos', { cookie }))).json()) as { demos: Record<string, any>[] }
    const pub = listed.demos.find((x) => x.id === id)!
    expect(pub.versions).toHaveLength(2)
    expect(pub.versions[1].audioUrl).toContain('&v=v2')
    expect(pub.audioUrl).toBe(pub.versions[0].audioUrl)
    expect(JSON.stringify(pub)).not.toContain('uploads/')
  })

  it('lets the admin add, rename and remove genres, updating songs that use them', async () => {
    const created = await call('demo-create', { versions: [{ file: 'uploads/t1.mp3' }], patch: { title: 'Tag Test', genre: ['Pop'] } })
    const id = created.id as string
    let res = await call('tags', { group: 'genre', op: 'add', value: 'Hyperpop' })
    expect(res.tags.genre).toContain('Hyperpop')
    // Adding the same name twice (any capitalisation) keeps one.
    res = await call('tags', { group: 'genre', op: 'add', value: 'hyperpop' })
    expect(res.tags.genre.filter((g: string) => g.toLowerCase() === 'hyperpop')).toHaveLength(1)

    res = await call('tags', { group: 'genre', op: 'rename', value: 'Pop', to: 'Mainstream pop' })
    expect(res.tags.genre).toContain('Mainstream pop')
    expect(res.tags.genre).not.toContain('Pop')
    let d = ((await call('demos')).demos as Record<string, any>[]).find((x) => x.id === id)!
    expect(d.genre).toEqual(['Mainstream pop'])

    await call('tags', { group: 'genre', op: 'remove', value: 'Mainstream pop' })
    d = ((await call('demos')).demos as Record<string, any>[]).find((x) => x.id === id)!
    expect(d.genre).toEqual([])
  })

  it('the old shared password keeps working until it is turned off', async () => {
    process.env.DEMOS_PASSWORD = 'shared-password'
    const cookie = cookieOf(await signIn('shared-password'))
    expect((await list(req('/api/demos', { cookie }))).status).toBe(200)
    await call('person-update', { id: 'legacy', status: 'removed' })
    expect((await list(req('/api/demos', { cookie }))).status).toBe(401)
    expect((await signIn('shared-password')).status).toBe(401)
  })
})
