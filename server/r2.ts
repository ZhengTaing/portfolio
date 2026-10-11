/**
 * Cloudflare R2 storage for demo audio and covers.
 *
 * Files live in a private bucket under "demos/<path>". The site never makes
 * them public: it hands a signed link that expires after a short time to
 * someone with a valid access code (and to the admin page for uploads).
 *
 * Environment variables (in .env.local and in Vercel):
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET
 *
 * Signing is AWS Signature V4 ("presigned URLs"), which R2 supports, so no
 * extra packages are needed.
 */
import { createHash, createHmac } from 'node:crypto'

export interface R2Config {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  bucket: string
}

export function r2Config(env: Record<string, string | undefined> = process.env): R2Config | null {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } = env
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET) return null
  return { accountId: R2_ACCOUNT_ID, accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY, bucket: R2_BUCKET }
}

/** Where a demo file lives in the bucket. */
export const objectKey = (file: string) => `demos/${file.replace(/^\/+/, '')}`

/** RFC 3986 encoding, as Signature V4 expects. */
const enc = (s: string) => encodeURIComponent(s).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)
const hmac = (key: string | Buffer, data: string) => createHmac('sha256', key).update(data).digest()
const sha256hex = (data: string) => createHash('sha256').update(data).digest('hex')

export interface PresignInput {
  method: 'GET' | 'PUT' | 'HEAD' | 'DELETE'
  host: string
  /** Already-encoded path, e.g. "/bucket/demos/song.m4a". */
  path: string
  accessKeyId: string
  secretAccessKey: string
  region: string
  expiresIn: number
  now?: Date
}

/** A Signature V4 query-string-signed URL. */
export function presign({ method, host, path, accessKeyId, secretAccessKey, region, expiresIn, now = new Date() }: PresignInput) {
  const amzDate = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const date = amzDate.slice(0, 8)
  const scope = `${date}/${region}/s3/aws4_request`
  const params: Record<string, string> = {
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': `${accessKeyId}/${scope}`,
    'X-Amz-Date': amzDate,
    'X-Amz-Expires': String(expiresIn),
    'X-Amz-SignedHeaders': 'host',
  }
  const query = Object.keys(params)
    .sort()
    .map((k) => `${enc(k)}=${enc(params[k])}`)
    .join('&')
  const canonical = [method, path, query, `host:${host}`, '', 'host', 'UNSIGNED-PAYLOAD'].join('\n')
  const toSign = ['AWS4-HMAC-SHA256', amzDate, scope, sha256hex(canonical)].join('\n')
  const key = hmac(hmac(hmac(hmac(`AWS4${secretAccessKey}`, date), region), 's3'), 'aws4_request')
  const signature = createHmac('sha256', key).update(toSign).digest('hex')
  return `https://${host}${path}?${query}&X-Amz-Signature=${signature}`
}

/** Signed link to one object in the bucket. */
export function r2Url(cfg: R2Config, method: 'GET' | 'PUT' | 'HEAD' | 'DELETE', key: string, expiresIn = 3600) {
  return presign({
    method,
    host: `${cfg.accountId}.r2.cloudflarestorage.com`,
    path: `/${enc(cfg.bucket)}/${key.split('/').map(enc).join('/')}`,
    accessKeyId: cfg.accessKeyId,
    secretAccessKey: cfg.secretAccessKey,
    region: 'auto',
    expiresIn,
  })
}
