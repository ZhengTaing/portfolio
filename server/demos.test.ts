// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { createSession, verifySession } from './demos'

describe('demo session tokens', () => {
  const secret = 'test-secret'

  it('accepts a fresh token signed with the right secret', () => {
    expect(verifySession(createSession(secret), secret)).toBe(true)
  })

  it('rejects tampered, foreign, expired and missing tokens', () => {
    const token = createSession(secret)
    const [exp, sig] = token.split('.')
    expect(verifySession(`${Number(exp) + 1000}.${sig}`, secret)).toBe(false)
    expect(verifySession(token, 'other-secret')).toBe(false)
    expect(verifySession(createSession(secret, 0), secret)).toBe(false)
    expect(verifySession(undefined, secret)).toBe(false)
    expect(verifySession('garbage', secret)).toBe(false)
  })
})

describe('demo privacy', () => {
  it('never sends private management fields to the browser', async () => {
    const { toPublic } = await import('./demos')
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
