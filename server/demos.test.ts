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
