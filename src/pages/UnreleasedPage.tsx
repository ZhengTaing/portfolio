import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { PitchBoard } from '../components/PitchBoard'
import { clearFavorites, setFavorites } from '../lib/favorites'
import type { Pitch, PitchTags } from '../lib/pitch'
import { usePlayer } from '../lib/player'
import { usePageMeta } from '../lib/usePageMeta'

type Demo = Pitch

type State =
  | { kind: 'checking' }
  | { kind: 'locked'; error?: string; ended?: boolean }
  | { kind: 'unlocked'; demos: Demo[]; name?: string; tags?: PitchTags }
  | { kind: 'unavailable'; message: string }

async function fetchDemos(): Promise<State> {
  try {
    const res = await fetch('/api/demos', { credentials: 'same-origin' })
    if (res.status === 401) {
      const body = (await res.json().catch(() => ({}))) as { ended?: boolean }
      return { kind: 'locked', ended: Boolean(body.ended) }
    }
    if (!res.ok) return { kind: 'unavailable', message: 'The demos are not available right now.' }
    const body = (await res.json()) as { demos: Demo[]; me?: { name: string }; favorites?: string[] | null; tags?: PitchTags }
    setFavorites(body.favorites ?? null)
    return { kind: 'unlocked', demos: body.demos, name: body.me?.name, tags: body.tags }
  } catch {
    return { kind: 'unavailable', message: 'Could not reach the server. Check your connection and try again.' }
  }
}

/** Demos need a code, so stop one if it's playing, drop any from the queue and end the session. */
async function signOut(player: ReturnType<typeof usePlayer>) {
  const isDemo = (url: string) => url.startsWith('/api/demos')
  if (player.current && isDemo(player.current.audioUrl)) player.stop()
  else player.removeFromQueueWhere((t) => isDemo(t.audioUrl))
  clearFavorites()
  await fetch('/api/demos/logout', { method: 'POST', credentials: 'same-origin', keepalive: true }).catch(() => {})
}

export default function UnreleasedPage() {
  usePageMeta({
    title: 'Unreleased',
    description: 'Private demos. Access code required.',
    path: '/music/unreleased',
  })
  const [state, setState] = useState<State>({ kind: 'checking' })
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const player = usePlayer()

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
        body: JSON.stringify({ code: password }),
      })
      if (res.ok) {
        setPassword('')
        setState(await fetchDemos())
      } else if (res.status === 401) {
        setPassword('')
        setState({ kind: 'locked', error: 'That code is not right. Check it and try again.' })
      } else if (res.status === 429) {
        const { retryAfter = 60 } = (await res.json().catch(() => ({}))) as { retryAfter?: number }
        const mins = Math.max(1, Math.ceil(retryAfter / 60))
        setState({ kind: 'locked', error: `Too many tries. Wait ${mins} ${mins === 1 ? 'minute' : 'minutes'}, then try again.` })
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
    await signOut(player)
    setState({ kind: 'locked' })
  }

  // Leaving the page locks it again: going to another page, closing the tab or
  // reloading all mean the access code has to be entered next time.
  const unlocked = state.kind === 'unlocked'
  const latest = useRef({ unlocked, player })
  useEffect(() => {
    latest.current = { unlocked, player }
  })
  useEffect(() => {
    const onPageHide = () => {
      if (latest.current.unlocked) navigator.sendBeacon?.('/api/demos/logout')
    }
    window.addEventListener('pagehide', onPageHide)
    return () => {
      window.removeEventListener('pagehide', onPageHide)
      if (latest.current.unlocked) void signOut(latest.current.player)
    }
  }, [])

  return (
    <div data-theme="ink" className="bg-bg text-fg relative isolate min-h-[70vh] px-4 pt-12 pb-24 [clip-path:inset(0)] sm:px-8">
      <nav aria-label="Breadcrumb" className="label mb-8">
        <Link to="/music" className="link-underline">
          Music
        </Link>{' '}
        / <span aria-current="page">Unreleased</span>
      </nav>

      <header className="mb-10 border-b-[3px] border-current pb-6">
        <p className="label text-signal mb-3">Private · Song pitches</p>
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
          {state.ended ? (
            <div role="status" className="border-line mb-6 border p-4 text-[0.9375rem] leading-relaxed">
              <p className="label text-accent mb-1">Access ended</p>
              Your access to these demos has ended. If you think that&rsquo;s a mistake, get in touch for a new code.
            </div>
          ) : (
            <p className="mb-6 text-[0.9375rem] leading-relaxed">
              Demos and song pitches shared with collaborators. Enter your personal access code to listen.
            </p>
          )}
          <label htmlFor="demo-password" className="label mb-2 block">
            Access code
          </label>
          <div className="flex gap-2">
            <input
              id="demo-password"
              type="password"
              autoComplete="off"
              placeholder="xxxx-xxxx-xxxx"
              spellCheck={false}
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
          <p className="label text-muted mt-4">Your code is just for you. Please don&rsquo;t share it.</p>
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
          {state.demos.length === 0 ? (
            <p className="label border-line border p-6">No demos uploaded yet.</p>
          ) : (
            <PitchBoard
              pitches={state.demos}
              tags={state.tags}
              toolbarStart={
                <div className="label flex flex-wrap items-center gap-x-4 gap-y-1 py-2">
                  {state.name && (
                    <span>
                      <span aria-hidden="true">👋 </span>Signed in as <b>{state.name}</b>
                    </span>
                  )}
                  <button type="button" onClick={lock} className="link-underline uppercase">
                    Sign out
                  </button>
                  <span className="text-muted">Please don&rsquo;t share or download these.</span>
                </div>
              }
            />
          )}
        </section>
      )}
    </div>
  )
}
