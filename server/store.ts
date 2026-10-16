/**
 * Tiny key-value store used by the access-code system and the admin page.
 *
 * - On Vercel it talks to an Upstash Redis database over its REST API. Adding
 *   one in Vercel → Storage sets KV_REST_API_URL / KV_REST_API_TOKEN (or the
 *   UPSTASH_REDIS_REST_* equivalents) automatically.
 * - On your Mac (`npm run dev`) it falls back to a JSON file in `.data/`, so
 *   everything works locally without a database.
 * - On Vercel without a database, `store()` returns null and the features that
 *   need it say so instead of failing silently.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

export type Cmd = (string | number)[]

export interface Store {
  /** Run several Redis commands in order and return each result. */
  run: (cmds: Cmd[]) => Promise<unknown[]>
}

function redisStore(url: string, token: string): Store {
  return {
    async run(cmds) {
      const res = await fetch(`${url.replace(/\/$/, '')}/pipeline`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(cmds.map((c) => c.map(String))),
      })
      if (!res.ok) throw new Error(`Store error ${res.status}`)
      const out = (await res.json()) as { result?: unknown; error?: string }[]
      return out.map((r) => {
        if (r.error) throw new Error(r.error)
        return r.result
      })
    },
  }
}

/** Just enough Redis for this site, kept in a local JSON file. */
type Value = { t: 's'; v: string; exp?: number } | { t: 'h'; v: Record<string, string> } | { t: 'set'; v: string[] } | { t: 'l'; v: string[] }

function fileStore(path?: string): Store {
  let data: Record<string, Value> = {}
  try {
    if (path) data = JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    data = {}
  }
  const save = () => {
    if (!path) return
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, JSON.stringify(data, null, 1))
  }
  const live = (k: string) => {
    const v = data[k]
    if (v?.t === 's' && v.exp && v.exp < Date.now()) delete data[k]
    return data[k]
  }
  const hash = (k: string) => {
    const v = live(k)
    if (v?.t === 'h') return v.v
    data[k] = { t: 'h', v: {} }
    return (data[k] as { v: Record<string, string> }).v
  }
  const set = (k: string) => {
    const v = live(k)
    if (v?.t === 'set') return v
    data[k] = { t: 'set', v: [] }
    return data[k] as { t: 'set'; v: string[] }
  }
  const list = (k: string) => {
    const v = live(k)
    if (v?.t === 'l') return v
    data[k] = { t: 'l', v: [] }
    return data[k] as { t: 'l'; v: string[] }
  }
  const range = (arr: string[], a: number, b: number) => arr.slice(a < 0 ? arr.length + a : a, b < 0 ? arr.length + b + 1 : b + 1)

  function exec([name, ...args]: Cmd): unknown {
    const k = String(args[0])
    const a = args.slice(1).map(String)
    switch (String(name).toUpperCase()) {
      case 'GET': {
        const v = live(k)
        return v?.t === 's' ? v.v : null
      }
      case 'SET':
        data[k] = { t: 's', v: a[0], exp: a[1]?.toUpperCase() === 'EX' ? Date.now() + Number(a[2]) * 1000 : undefined }
        return 'OK'
      case 'DEL':
        delete data[k]
        return 1
      case 'INCR': {
        const v = live(k)
        const n = (v?.t === 's' ? Number(v.v) : 0) + 1
        data[k] = { t: 's', v: String(n), exp: v?.t === 's' ? v.exp : undefined }
        return n
      }
      case 'EXPIRE': {
        const v = live(k)
        if (v?.t === 's') v.exp = Date.now() + Number(a[0]) * 1000
        return 1
      }
      case 'TTL': {
        const v = live(k)
        return v?.t === 's' && v.exp ? Math.ceil((v.exp - Date.now()) / 1000) : -1
      }
      case 'HGET':
        return hash(k)[a[0]] ?? null
      case 'HSET':
        for (let i = 0; i < a.length; i += 2) hash(k)[a[i]] = a[i + 1]
        return 1
      case 'HDEL':
        for (const f of a) delete hash(k)[f]
        return 1
      case 'HINCRBY': {
        const h = hash(k)
        h[a[0]] = String(Number(h[a[0]] ?? 0) + Number(a[1]))
        return Number(h[a[0]])
      }
      case 'HKEYS':
        return Object.keys(hash(k))
      case 'HGETALL':
        return Object.entries(hash(k)).flat()
      case 'SADD': {
        const s = set(k)
        for (const m of a) if (!s.v.includes(m)) s.v.push(m)
        return 1
      }
      case 'SREM': {
        const s = set(k)
        s.v = s.v.filter((m) => !a.includes(m))
        return 1
      }
      case 'SMEMBERS':
        return [...set(k).v]
      case 'LPUSH':
        list(k).v.unshift(...a.reverse())
        return list(k).v.length
      case 'LTRIM': {
        const l = list(k)
        l.v = range(l.v, Number(a[0]), Number(a[1]))
        return 'OK'
      }
      case 'LRANGE':
        return range(list(k).v, Number(a[0]), Number(a[1]))
      default:
        throw new Error(`Unsupported command ${String(name)}`)
    }
  }

  return {
    async run(cmds) {
      const out = cmds.map(exec)
      save()
      return out
    },
  }
}

let cached: Store | null | undefined

export function store(): Store | null {
  if (cached !== undefined) return cached
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
  if (url && token) cached = redisStore(url, token)
  else if (!process.env.VERCEL) cached = fileStore(process.env.DEMOS_STORE_FILE || resolve(process.cwd(), '.data/store.json'))
  else cached = null
  return cached
}

/** For tests: use a fresh store (or none). */
export function setStore(s: Store | null) {
  cached = s
}

export function memoryStore(): Store {
  return fileStore()
}

/** HGETALL returns [field, value, field, value, …]. */
export function pairs(result: unknown): Record<string, string> {
  const arr = (result ?? []) as string[]
  const out: Record<string, string> = {}
  for (let i = 0; i < arr.length; i += 2) out[arr[i]] = arr[i + 1]
  return out
}
