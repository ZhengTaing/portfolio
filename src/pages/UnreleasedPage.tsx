import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { MediaPlayer } from '../components/MediaPlayer'
import { usePageMeta } from '../lib/usePageMeta'

interface Demo {
  id: string
  title: string
  note?: string
  date?: string
  duration?: string
  audioUrl: string
}

type State =
  | { kind: 'checking' }
  | { kind: 'locked'; error?: string }
  | { kind: 'unlocked'; demos: Demo[] }
  | { kind: 'unavailable'; message: string }

async function fetchDemos(): Promise<State> {
  try {
    const res = await fetch('/api/demos', { credentials: 'same-origin' })
    if (res.status === 401) return { kind: 'locked' }
    if (!res.ok) return { kind: 'unavailable', message: 'The demos are not available right now.' }
    const body = (await res.json()) as { demos: Demo[] }
    return { kind: 'unlocked', demos: body.demos }
  } catch {
    return { kind: 'unavailable', message: 'Could not reach the server. Check your connection and try again.' }
  }
}

export default function UnreleasedPage() {
  usePageMeta({
    title: 'Unreleased',
    description: 'Private demos. Password required.',
    path: '/music/unreleased',
  })
  const [state, setState] = useState<State>({ kind: 'checking' })
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Keep this page out of search results.
  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, nofollow'
    document.head.appendChild(meta)
    return () => meta.remove()
  }, [])

  useEffect(() => {
    let active = true
    fetchDemos().then((s) => active && setState(s))
    return () => {
      active = false
    }
  }, [])

  async function unlock(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/demos/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        setPassword('')
        setState(await fetchDemos())
      } else if (res.status === 401) {
        setPassword('')
        setState({ kind: 'locked', error: 'That password is not right.' })
      } else {
        setState({ kind: 'unavailable', message: 'The demos are not available right now.' })
      }
    } catch {
      setState({ kind: 'locked', error: 'Could not reach the server. Try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  async function lock() {
    await fetch('/api/demos/logout', { method: 'POST', credentials: 'same-origin' }).catch(() => {})
    setState({ kind: 'locked' })
  }

  return (
    <div data-theme="ink" className="bg-bg text-fg min-h-[70vh] px-4 pt-12 pb-24 sm:px-8">
      <nav aria-label="Breadcrumb" className="label mb-8">
        <Link to="/music" className="link-underline">
          Music
        </Link>{' '}
        / <span aria-current="page">Unreleased</span>
      </nav>

      <header className="mb-10 border-b-[3px] border-current pb-6">
        <p className="label text-signal mb-3">Private · Demos &amp; works in progress</p>
        <h1 className="display text-[clamp(2.75rem,9vw,8rem)]">Unreleased</h1>
      </header>

      {state.kind === 'checking' && (
        <p className="label" role="status">
          Checking access…
        </p>
      )}

      {state.kind === 'unavailable' && (
        <p className="label border-line border p-6" role="alert">
          {state.message}
        </p>
      )}

      {state.kind === 'locked' && (
        <form onSubmit={unlock} className="max-w-md">
          <p className="mb-6 text-[0.9375rem] leading-relaxed">
            These are unfinished songs and demos shared with collaborators. Enter the password to listen.
          </p>
          <label htmlFor="demo-password" className="label mb-2 block">
            Password
          </label>
          <div className="flex gap-2">
            <input
              id="demo-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={Boolean(state.error)}
              aria-describedby={state.error ? 'demo-password-error' : undefined}
              className="border-fg bg-surface min-w-0 flex-1 border-2 px-3 py-3 font-mono text-base outline-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-signal)]"
            />
            <button type="submit" className="btn-outline" disabled={submitting}>
              {submitting ? 'Checking…' : 'Unlock'}
            </button>
          </div>
          {state.error && (
            <p id="demo-password-error" role="alert" className="text-accent mt-3 text-sm">
              {state.error}
            </p>
          )}
          <p className="label text-muted mt-8">
            Need access?{' '}
            <Link to="/about" className="link-underline">
              Get in touch
            </Link>
            .
          </p>
        </form>
      )}

      {state.kind === 'unlocked' && (
        <section aria-label="Demos">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <p className="label text-muted">Please don&rsquo;t share or download these.</p>
            <button type="button" onClick={lock} className="label link-underline">
              Lock page
            </button>
          </div>
          {state.demos.length === 0 ? (
            <p className="label border-line border p-6">No demos uploaded yet.</p>
          ) : (
            <MediaPlayer tracks={state.demos} listLabel="Demos" />
          )}
        </section>
      )}
    </div>
  )
}
