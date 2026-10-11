// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { presign } from './r2'

describe('R2 signed links', () => {
  it('matches the AWS Signature V4 presigned-URL example', () => {
    // Example from the AWS S3 docs ("Authenticating Requests: Using Query Parameters").
    const url = presign({
      method: 'GET',
      host: 'examplebucket.s3.amazonaws.com',
      path: '/test.txt',
      accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
      secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
      region: 'us-east-1',
      expiresIn: 86400,
      now: new Date('2013-05-24T00:00:00Z'),
    })
    expect(url).toContain('X-Amz-Signature=aeeed9bbccd4d02ee5c0109b86d86835f995330da4c265957d157751f604d404')
  })
})
