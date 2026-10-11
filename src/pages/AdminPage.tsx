import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { actTypes, asList, generatedCover, genres, markets, statuses, type PitchStatus } from '../lib/pitch'
import { usePageMeta } from '../lib/usePageMeta'

/** A demo as the admin page sees it (includes private notes). */
interface AdminDemo {
  id: string
  title: string
  coverUrl?: string
  duration?: string
  note?: string
  demoArtist?: string
  targetArtists?: string[]
  market?: string | string[]
  actType?: string | string[]
  genre?: string | string[]
  key?: string
  bpm?: number | null
  status: PitchStatus
  holdUntil?: string
  placedWith?: string
  pitchNotes?: string
  privateNotes?: string
  reservation?: string
  hidden?: boolean
}

interface AdminPerson {
  id: string
  name: string
  code: string
  access: 'all' | string[]
  status: 'active' | 'removed'
  favorites: string[]
  lastSeen: string | null
  plays: number
}

interface LogEntry {
  at: string
  who: string
  name: string
  event: 'signed-in' | 'played' | 'wrong-code' | 'blocked' | 'favorited'
  demoId?: string
  title?: string
}

type Tab = 'demos' | 'people' | 'activity'

async function api<T>(action: string, body?: unknown): Promise<{ status: number; data: T }> {
  const res = await fetch(`/api/admin?action=${action}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  return { status: res.status, data: (await res.json().catch(() => ({}))) as T }
}

function timeAgo(iso: string | null) {
  if (!iso) return 'Never'
  const s = (Date.now() - new Date(iso).getTime()) / 1000
  if (s < 60) return 'Just now'
  if (s < 3600) return `${Math.floor(s / 60)} min ago`
  if (s < 86_400) return `${Math.floor(s / 3600)} h ago`
  const d = Math.floor(s / 86_400)
  return d === 1 ? 'Yesterday' : d < 14 ? `${d} days ago` : new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const inputCls =
  'w-full border border-white/25 bg-[#161616] px-3 py-2 text-sm text-white outline-none focus-visible:border-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-signal)]'
const btnPrimary = 'label bg-signal px-4 py-2.5 font-bold text-black uppercase hover:brightness-110 disabled:opacity-50'
const btnGhost = 'label border border-white/40 px-3 py-2 uppercase hover:border-white hover:bg-white hover:text-black disabled:opacity-40'

function StoreWarning() {
  return (
    <div role="alert" className="mb-6 border border-[#ffb020] bg-[#ffb020]/10 p-4 text-sm leading-relaxed">
      <p className="label mb-1 text-[#ffb020]">Database not connected</p>
      Changes can&rsquo;t be saved yet. In Vercel, open the project → <b>Storage</b> → <b>Create Database</b> → <b>Upstash for Redis</b> (free), connect
      it to this project, then redeploy. Everything else on this page will start working.
    </div>
  )
}

export default function AdminPage() {
  usePageMeta({ title: 'Admin', description: 'Private admin page.', path: '/admin' })
  const [auth, setAuth] = useState<'checking' | 'out' | 'in' | 'unavailable'>('checking')
  const [storeReady, setStoreReady] = useState(true)
  const [tab, setTab] = useState<Tab>('demos')

  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, nofollow'
    document.head.appendChild(meta)
    return () => meta.remove()
  }, [])

  useEffect(() => {
    api<{ storeReady?: boolean }>('me')
      .then(({ status, data }) => {
        if (status === 200) {
          setStoreReady(Boolean(data.storeReady))
          setAuth('in')
        } else setAuth(status === 503 ? 'unavailable' : 'out')
      })
      .catch(() => setAuth('unavailable'))
  }, [])

  async function signOut() {
    await api('logout', {})
    setAuth('out')
  }

  return (
    <div data-theme="ink" className="bg-bg text-fg min-h-screen">
      {auth === 'checking' && (
        <p className="label p-8" role="status">
          Checking…
        </p>
      )}
      {auth === 'unavailable' && (
        <p className="label p-8" role="alert">
          The admin page isn&rsquo;t set up on this server (ADMIN_CODE is missing).
        </p>
      )}
      {auth === 'out' && <SignIn onDone={() => window.location.reload()} />}
      {auth === 'in' && (
        <div className="md:grid md:min-h-screen md:grid-cols-[13rem_1fr]">
          <aside className="border-b border-white/15 p-4 md:flex md:flex-col md:border-r md:border-b-0 md:p-5">
            <Link to="/" className="font-display block text-xl leading-none font-extrabold tracking-[-0.03em] uppercase">
              Zheng
              <br />
              Taing
            </Link>
            <p className="label text-muted mt-1">Admin</p>
            <nav aria-label="Admin" className="mt-4 flex gap-1 md:mt-8 md:flex-col">
              {(['demos', 'people', 'activity'] as Tab[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  aria-current={tab === t ? 'page' : undefined}
                  onClick={() => setTab(t)}
                  className={`label px-3 py-2 text-left uppercase ${tab === t ? 'bg-signal font-bold text-black' : 'hover:bg-white/10'}`}
                >
                  {t}
                </button>
              ))}
            </nav>
            <p className="label text-muted mt-4 md:mt-auto">
              <Link to="/music/unreleased" className="link-underline">
                View Unreleased
              </Link>
              {' · '}
              <button type="button" onClick={signOut} className="link-underline uppercase">
                Sign out
              </button>
            </p>
          </aside>
          <main className="min-w-0 p-4 sm:p-8">
            {!storeReady && <StoreWarning />}
            {tab === 'demos' && <DemosTab storeReady={storeReady} />}
            {tab === 'people' && <PeopleTab storeReady={storeReady} />}
            {tab === 'activity' && <ActivityTab />}
          </main>
        </div>
      )}
    </div>
  )
}

function SignIn({ onDone }: { onDone: () => void }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    const { status, data } = await api<{ retryAfter?: number }>('login', { code }).catch(() => ({ status: 0, data: {} as { retryAfter?: number } }))
    setBusy(false)
    if (status === 200) return onDone()
    setCode('')
    setError(
      status === 429
        ? `Too many tries. Wait ${Math.max(1, Math.ceil((data.retryAfter ?? 60) / 60))} min, then try again.`
        : status === 401
          ? 'That code is not right.'
          : 'Could not reach the server.',
    )
  }
  return (
    <div className="grid min-h-screen place-items-center p-4">
      <form onSubmit={submit} className="w-full max-w-sm border border-white/15 bg-[#141414] p-7">
        <h1 className="font-display text-3xl leading-none font-extrabold tracking-[-0.03em]">Admin</h1>
        <p className="label text-muted mt-2">zhengtaing.com · private</p>
        <label htmlFor="admin-code" className="label mt-6 mb-2 block">
          Admin code
        </label>
        <input
          id="admin-code"
          type="password"
          autoComplete="current-password"
          required
          value={code}
          onChange={(e) => setCode(e.target.value)}
          aria-invalid={Boolean(error)}
          className={inputCls}
        />
        <button type="submit" disabled={busy} className={`${btnPrimary} mt-4 w-full`}>
          {busy ? 'Checking…' : 'Sign in'}
        </button>
        {error && (
          <p role="alert" className="text-accent mt-3 text-sm">
            {error}
          </p>
        )}
        <p className="label text-muted mt-5 leading-relaxed normal-case">5 tries per minute. Stays signed in on this device for 7 days.</p>
      </form>
    </div>
  )
}

function Cover({ d, className = '' }: { d: { id: string; coverUrl?: string }; className?: string }) {
  return d.coverUrl ? (
    <img src={d.coverUrl} alt="" loading="lazy" className={`object-cover ${className}`} />
  ) : (
    <div aria-hidden="true" className={className} style={{ background: generatedCover(d.id) }} />
  )
}

function StatusSelect({ value, onChange, label }: { value: PitchStatus; onChange: (s: PitchStatus) => void; label: string }) {
  const s = statuses.find((x) => x.id === value) ?? statuses[0]
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value as PitchStatus)}
      className="label cursor-pointer border bg-[#111] px-2 py-1 font-bold uppercase"
      style={{ color: s.color, borderColor: s.color }}
    >
      {statuses.map((x) => (
        <option key={x.id} value={x.id}>
          {x.label}
        </option>
      ))}
    </select>
  )
}

function useDemos() {
  const [demos, setDemos] = useState<AdminDemo[] | null>(null)
  const reload = useCallback(async () => {
    const { data } = await api<{ demos: AdminDemo[] }>('demos')
    setDemos(data.demos ?? [])
  }, [])
  useEffect(() => {
    let live = true
    api<{ demos: AdminDemo[] }>('demos').then(({ data }) => live && setDemos(data.demos ?? []))
    return () => {
      live = false
    }
  }, [])
  return { demos, setDemos, reload }
}

function DemosTab({ storeReady }: { storeReady: boolean }) {
  const { demos, setDemos, reload } = useDemos()
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState<AdminDemo | null>(null)
  const [adding, setAdding] = useState(false)
  const [saved, setSaved] = useState('')

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!demos) return []
    if (!needle) return demos
    return demos.filter((d) =>
      [d.title, d.demoArtist, ...(d.targetArtists ?? []), ...asList(d.genre), ...asList(d.market)].some((v) => v?.toLowerCase().includes(needle)),
    )
  }, [demos, q])

  async function save(id: string, patch: Partial<AdminDemo>) {
    setDemos((list) => list?.map((d) => (d.id === id ? { ...d, ...patch } : d)) ?? null)
    const { status } = await api('demo', { id, patch })
    if (status !== 200) {
      setSaved('Could not save. Is the database connected?')
      await reload()
    } else setSaved('Saved. Visitors see it right away.')
    setTimeout(() => setSaved(''), 3000)
  }

  if (!demos) return <p className="label">Loading…</p>
  const count = (s: PitchStatus) => demos.filter((d) => d.status === s).length

  return (
    <section aria-labelledby="demos-h">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 id="demos-h" className="font-display text-4xl leading-none font-extrabold tracking-[-0.03em]">
            Demos
          </h1>
          <p className="label text-muted mt-2">
            {demos.length} songs · {count('available')} available · {count('on-hold')} on hold · {count('reserved')} reserved · {count('placed')} placed
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, artist, target…" aria-label="Search demos" className={inputCls.replace('w-full', 'w-64 max-w-full')} />
          <button type="button" onClick={() => setAdding(true)} className={btnPrimary}>
            + Add demo
          </button>
        </div>
      </div>
      <p role="status" className="label text-accent mb-2 min-h-5">
        {saved}
      </p>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[56rem] border-collapse text-left">
          <thead>
            <tr className="label text-muted border-b border-white/15">
              <th className="py-2 font-normal">Song</th>
              <th className="py-2 font-normal">Status</th>
              <th className="py-2 font-normal">Pitching to</th>
              <th className="py-2 font-normal">Market · Genre</th>
              <th className="py-2 font-normal">BPM</th>
              <th className="py-2 font-normal">Length</th>
              <th className="py-2 font-normal">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {shown.map((d) => (
              <tr key={d.id} className={`border-b border-white/10 ${d.hidden ? 'opacity-50' : ''}`}>
                <td className="py-2 pr-3">
                  <div className="flex items-center gap-3">
                    <Cover d={d} className="size-10 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-display font-extrabold">
                        {d.title} {d.hidden && <span className="label text-muted font-normal">(hidden)</span>}
                      </p>
                      <p className="label text-muted">{d.demoArtist || 'Zheng Taing'}</p>
                    </div>
                  </div>
                </td>
                <td className="py-2 pr-3">
                  <StatusSelect value={d.status} label={`Status of ${d.title}`} onChange={(status) => save(d.id, { status })} />
                  {d.status === 'on-hold' && d.holdUntil && <p className="label text-muted mt-1">until {d.holdUntil}</p>}
                </td>
                <td className="label max-w-[14rem] py-2 pr-3">{d.targetArtists?.length ? d.targetArtists.join(', ') : <span className="text-muted">Open pitch</span>}</td>
                <td className="label text-muted max-w-[14rem] py-2 pr-3">{[asList(d.market).join(', '), asList(d.genre).join(', ')].filter(Boolean).join(' · ')}</td>
                <td className="label py-2 pr-3 tabular-nums">{d.bpm ?? '—'}</td>
                <td className="label py-2 pr-3 tabular-nums">{d.duration ?? '—'}</td>
                <td className="py-2 text-right">
                  <button type="button" onClick={() => setEditing(d)} className="label link-underline uppercase" aria-label={`Edit ${d.title}`}>
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <DemoEditor
          demo={editing}
          storeReady={storeReady}
          onClose={() => setEditing(null)}
          onSave={async (patch) => {
            await save(editing.id, patch)
            setEditing(null)
          }}
        />
      )}
      {adding && (
        <Drawer title="Add a demo" onClose={() => setAdding(false)}>
          <p className="text-sm leading-relaxed">New audio still goes in from your Mac, because song files are too big to upload through the website:</p>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-relaxed">
            <li>
              Put the song file (WAV, MP3 or M4A) in the <code>private-demos</code> folder.
            </li>
            <li>
              Run <code>npm run demos</code>, then <code>npm run deploy</code>.
            </li>
            <li>The song shows up here. Click Edit to fill in status, targets, genre and notes.</li>
          </ol>
          <p className="text-muted mt-6 text-sm">Everything else (status, who it&rsquo;s pitched to, notes, hiding a song) you can change right here.</p>
        </Drawer>
      )}
    </section>
  )
}

function Drawer({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title} className="h-full w-full max-w-xl overflow-y-auto border-l border-white/15 bg-[#121212] p-6 sm:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <h2 className="font-display text-3xl leading-none font-extrabold tracking-[-0.03em]">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-xl text-white/70 hover:text-white">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="label text-muted mb-1.5 block">{label}</span>
      {children}
      {hint && <span className="text-muted mt-1 block text-xs">{hint}</span>}
    </label>
  )
}

function ChipPicker({ label, options, value, onChange }: { label: string; options: string[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <fieldset>
      <legend className="label text-muted mb-1.5">{label}</legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const on = value.includes(o)
          return (
            <button
              key={o}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(on ? value.filter((v) => v !== o) : [...value, o])}
              className={`label border px-2 py-1 uppercase ${on ? 'border-white bg-white text-black' : 'border-white/25 hover:border-white'}`}
            >
              {o}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

function DemoEditor({ demo, storeReady, onClose, onSave }: { demo: AdminDemo; storeReady: boolean; onClose: () => void; onSave: (p: Partial<AdminDemo>) => Promise<void> }) {
  const [f, setF] = useState({
    ...demo,
    targets: (demo.targetArtists ?? []).join(', '),
    market: asList(demo.market),
    actType: asList(demo.actType),
    genre: asList(demo.genre),
  })
  const [busy, setBusy] = useState(false)
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }))

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    await onSave({
      title: f.title,
      demoArtist: f.demoArtist,
      note: f.note,
      targetArtists: f.targets.split(',').map((s) => s.trim()).filter(Boolean),
      market: f.market,
      actType: f.actType,
      genre: f.genre,
      key: f.key,
      bpm: f.bpm,
      status: f.status,
      holdUntil: f.holdUntil,
      placedWith: f.placedWith,
      pitchNotes: f.pitchNotes,
      privateNotes: f.privateNotes,
      reservation: f.reservation,
      hidden: f.hidden,
    })
    setBusy(false)
  }

  return (
    <Drawer title={`Edit ${demo.title}`} onClose={onClose}>
      <form onSubmit={submit} className="grid gap-4">
        <div className="flex items-center gap-4">
          <Cover d={demo} className="size-20 shrink-0" />
          <p className="text-muted text-sm">To change the audio or cover, replace the file in private-demos/ and redeploy.</p>
        </div>
        <Field label="Title">
          <input className={inputCls} value={f.title} onChange={(e) => set('title', e.target.value)} required />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Demo artist">
            <input className={inputCls} value={f.demoArtist ?? ''} onChange={(e) => set('demoArtist', e.target.value)} placeholder="Zheng Taing" />
          </Field>
          <Field label="Version note" hint='Shown after the artist, e.g. "V1"'>
            <input className={inputCls} value={f.note ?? ''} onChange={(e) => set('note', e.target.value)} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Status">
            <select className={inputCls} value={f.status} onChange={(e) => set('status', e.target.value as PitchStatus)}>
              {statuses.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
          {f.status === 'on-hold' && (
            <Field label="On hold until">
              <input type="date" className={inputCls} value={f.holdUntil ?? ''} onChange={(e) => set('holdUntil', e.target.value)} />
            </Field>
          )}
          {f.status === 'placed' && (
            <Field label="Cut by">
              <input className={inputCls} value={f.placedWith ?? ''} onChange={(e) => set('placedWith', e.target.value)} />
            </Field>
          )}
        </div>
        <Field label="Pitching to" hint="Separate names with commas. Leave empty for an open pitch.">
          <input className={inputCls} value={f.targets} onChange={(e) => set('targets', e.target.value)} />
        </Field>
        <ChipPicker label="Market" options={markets} value={f.market} onChange={(v) => set('market', v)} />
        <ChipPicker label="Act type" options={actTypes} value={f.actType} onChange={(v) => set('actType', v)} />
        <ChipPicker label="Genre" options={genres} value={f.genre} onChange={(v) => set('genre', v)} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Key">
            <input className={inputCls} value={f.key ?? ''} onChange={(e) => set('key', e.target.value)} placeholder="Ab major" />
          </Field>
          <Field label="BPM">
            <input type="number" min={30} max={300} className={inputCls} value={f.bpm ?? ''} onChange={(e) => set('bpm', e.target.value ? Number(e.target.value) : null)} />
          </Field>
        </div>
        <Field label="Pitch note (shown on the card)">
          <textarea rows={2} className={inputCls} value={f.pitchNotes ?? ''} onChange={(e) => set('pitchNotes', e.target.value)} />
        </Field>
        <div className="border border-[#ffb020]/50 p-3">
          <p className="label mb-3 text-[#ffb020]">🔒 Only you see these</p>
          <div className="grid gap-4">
            <Field label="Private notes">
              <textarea rows={2} className={inputCls} value={f.privateNotes ?? ''} onChange={(e) => set('privateNotes', e.target.value)} />
            </Field>
            <Field label="Reservation details">
              <input className={inputCls} value={f.reservation ?? ''} onChange={(e) => set('reservation', e.target.value)} />
            </Field>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={Boolean(f.hidden)} onChange={(e) => set('hidden', e.target.checked)} />
          Hide this song from everyone
        </label>
        <div className="flex gap-2 pt-2">
          <button type="submit" disabled={busy || !storeReady} className={btnPrimary}>
            {busy ? 'Saving…' : 'Save & publish'}
          </button>
          <button type="button" onClick={onClose} className={btnGhost}>
            Cancel
          </button>
        </div>
      </form>
    </Drawer>
  )
}

function AccessPicker({ demos, value, onChange }: { demos: AdminDemo[]; value: 'all' | string[]; onChange: (v: 'all' | string[]) => void }) {
  const list = value === 'all' ? [] : value
  return (
    <fieldset>
      <legend className="label text-muted mb-2">Can hear</legend>
      <div className="flex flex-wrap gap-2">
        <button type="button" aria-pressed={value === 'all'} onClick={() => onChange('all')} className={`label border px-3 py-1.5 uppercase ${value === 'all' ? 'border-white bg-white text-black' : 'border-white/30'}`}>
          All demos (default)
        </button>
        <button type="button" aria-pressed={value !== 'all'} onClick={() => onChange(list)} className={`label border px-3 py-1.5 uppercase ${value !== 'all' ? 'border-white bg-white text-black' : 'border-white/30'}`}>
          Only these songs
        </button>
      </div>
      {value !== 'all' && (
        <div className="mt-3">
          <p className="label text-muted mb-2">
            {list.length} of {demos.length} checked
          </p>
          <div className="grid max-h-64 grid-cols-1 gap-x-4 gap-y-1 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
            {demos.map((d) => (
              <label key={d.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={list.includes(d.id)} onChange={(e) => onChange(e.target.checked ? [...list, d.id] : list.filter((x) => x !== d.id))} />
                <span className="truncate">{d.title}</span>
              </label>
            ))}
          </div>
        </div>
      )}
      <p className="text-muted mt-2 text-xs">New songs you add go to everyone on &ldquo;All demos&rdquo; automatically.</p>
    </fieldset>
  )
}

function CodeCell({ code }: { code: string }) {
  const [shown, setShown] = useState(false)
  const [copied, setCopied] = useState(false)
  return (
    <span className="flex items-center gap-2">
      <span className="border border-white/25 px-1.5 py-0.5 font-mono text-xs">{shown ? code : '••••-••••-••••'}</span>
      <button type="button" onClick={() => setShown((s) => !s)} className="label link-underline uppercase">
        {shown ? 'Hide' : 'Show'}
      </button>
      <button
        type="button"
        onClick={() => {
          void navigator.clipboard?.writeText(code)
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        }}
        className="label link-underline uppercase"
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
    </span>
  )
}

function PeopleTab({ storeReady }: { storeReady: boolean }) {
  const { demos } = useDemos()
  const [people, setPeople] = useState<AdminPerson[] | null>(null)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [access, setAccess] = useState<'all' | string[]>('all')
  const [created, setCreated] = useState<AdminPerson | null>(null)
  const [editing, setEditing] = useState<AdminPerson | null>(null)
  const [openFavs, setOpenFavs] = useState<string | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    const { data } = await api<{ people: AdminPerson[] }>('people')
    setPeople(data.people ?? [])
  }, [])
  useEffect(() => {
    let live = true
    api<{ people: AdminPerson[] }>('people').then(({ data }) => live && setPeople(data.people ?? []))
    return () => {
      live = false
    }
  }, [])

  const titleOf = (id: string) => demos?.find((d) => d.id === id)?.title ?? id

  async function create(e: FormEvent) {
    e.preventDefault()
    const { status, data } = await api<{ person?: AdminPerson; error?: string }>('person-create', { name, access })
    if (status !== 200 || !data.person) return setError(data.error ?? 'Could not create the code.')
    setCreated(data.person)
    setName('')
    setAccess('all')
    setCreating(false)
    await load()
  }

  async function update(id: string, patch: Record<string, unknown>) {
    const { status, data } = await api<{ person?: AdminPerson; error?: string }>('person-update', { id, ...patch })
    if (status !== 200) return setError(data.error ?? 'Could not save.')
    if (patch.newCode && data.person) setCreated(data.person)
    await load()
  }

  if (!people || !demos) return <p className="label">Loading…</p>

  return (
    <section aria-labelledby="people-h">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 id="people-h" className="font-display text-4xl leading-none font-extrabold tracking-[-0.03em]">
            People
          </h1>
          <p className="label text-muted mt-2">Everyone with a personal access code</p>
        </div>
        <button type="button" disabled={!storeReady} onClick={() => setCreating((c) => !c)} className={btnPrimary}>
          + New access code
        </button>
      </div>
      {error && (
        <p role="alert" className="text-accent mb-4 text-sm">
          {error}
        </p>
      )}

      {created && (
        <div role="status" className="mb-6 border border-[#3ddc84] bg-[#3ddc84]/10 p-4">
          <p className="label mb-2 text-[#3ddc84]">Code for {created.name}</p>
          <p className="font-mono text-2xl tracking-widest">{created.code}</p>
          <p className="text-muted mt-2 text-sm">Send this to them privately. They type it on zhengtaing.com/music/unreleased. You can copy it again from the table any time.</p>
          <div className="mt-3 flex gap-2">
            <button type="button" className={btnGhost} onClick={() => navigator.clipboard?.writeText(created.code)}>
              Copy code
            </button>
            <button type="button" className={btnGhost} onClick={() => setCreated(null)}>
              Done
            </button>
          </div>
        </div>
      )}

      {creating && (
        <form onSubmit={create} className="mb-8 grid max-w-3xl gap-4 border border-white/15 p-5">
          <Field label="Name or label" hint='Something you&apos;ll recognise, e.g. "Label A&R (HYBE)"'>
            <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} />
          </Field>
          <AccessPicker demos={demos} value={access} onChange={setAccess} />
          <div className="flex gap-2">
            <button type="submit" className={btnPrimary}>
              Create code
            </button>
            <button type="button" className={btnGhost} onClick={() => setCreating(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[60rem] border-collapse text-left">
          <thead>
            <tr className="label text-muted border-b border-white/15">
              <th className="py-2 font-normal">Name</th>
              <th className="py-2 font-normal">Can hear</th>
              <th className="py-2 font-normal">♥ Favorites</th>
              <th className="py-2 font-normal">Code</th>
              <th className="py-2 font-normal">Last listened</th>
              <th className="py-2 font-normal">Plays</th>
              <th className="py-2 font-normal">Status</th>
              <th className="py-2 font-normal">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {people.length === 0 && (
              <tr>
                <td colSpan={8} className="text-muted py-6 text-sm">
                  No codes yet. Click &ldquo;+ New access code&rdquo; to make the first one.
                </td>
              </tr>
            )}
            {people.map((p) => {
              const legacy = p.id === 'legacy'
              return (
                <tr key={p.id} className={`border-b border-white/10 align-top ${p.status === 'removed' ? 'opacity-55' : ''}`}>
                  <td className="font-display py-2.5 pr-3 font-extrabold">{p.name}</td>
                  <td className="label py-2.5 pr-3">
                    {p.access === 'all' ? 'All demos' : `Only ${p.access.length} ${p.access.length === 1 ? 'song' : 'songs'}`}
                    {!legacy && (
                      <>
                        {' · '}
                        <button type="button" onClick={() => setEditing(p)} className="link-underline uppercase">
                          Edit
                        </button>
                      </>
                    )}
                  </td>
                  <td className="label py-2.5 pr-3">
                    {p.favorites.length === 0 ? (
                      <span className="text-muted">—</span>
                    ) : (
                      <>
                        <span className="text-[#ff4d6d]">♥</span> {p.favorites.length} ·{' '}
                        <button type="button" aria-expanded={openFavs === p.id} onClick={() => setOpenFavs(openFavs === p.id ? null : p.id)} className="link-underline uppercase">
                          {openFavs === p.id ? 'Hide' : 'See'}
                        </button>
                        {openFavs === p.id && (
                          <ul className="mt-1 normal-case">
                            {p.favorites.map((id) => (
                              <li key={id}>♥ {titleOf(id)}</li>
                            ))}
                          </ul>
                        )}
                      </>
                    )}
                  </td>
                  <td className="py-2.5 pr-3">{legacy ? <span className="label text-muted">DEMOS_PASSWORD</span> : <CodeCell code={p.code} />}</td>
                  <td className="label text-muted py-2.5 pr-3">{timeAgo(p.lastSeen)}</td>
                  <td className="label py-2.5 pr-3 tabular-nums">{p.plays}</td>
                  <td className={`label py-2.5 pr-3 ${p.status === 'active' ? 'text-[#3ddc84]' : 'text-muted'}`}>{p.status === 'active' ? 'Active' : 'Removed'}</td>
                  <td className="label py-2.5 text-right whitespace-nowrap">
                    {p.status === 'active' ? (
                      <>
                        {!legacy && (
                          <button
                            type="button"
                            onClick={() => confirm(`Give ${p.name} a new code? Their old code stops working and they're signed out.`) && update(p.id, { newCode: true })}
                            className="link-underline mr-3 uppercase"
                          >
                            New code
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => confirm(`Remove access for ${p.name}? They're signed out straight away.`) && update(p.id, { status: 'removed' })}
                          className="link-underline uppercase"
                        >
                          {legacy ? 'Turn off' : 'Remove'}
                        </button>
                      </>
                    ) : (
                      <button type="button" onClick={() => update(p.id, { status: 'active' })} className="link-underline uppercase">
                        Restore
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {editing && (
        <EditAccess
          person={editing}
          demos={demos}
          onClose={() => setEditing(null)}
          onSave={async (patch) => {
            await update(editing.id, patch)
            setEditing(null)
          }}
        />
      )}
    </section>
  )
}

function EditAccess({ person, demos, onClose, onSave }: { person: AdminPerson; demos: AdminDemo[]; onClose: () => void; onSave: (p: Record<string, unknown>) => Promise<void> }) {
  const [name, setName] = useState(person.name)
  const [access, setAccess] = useState(person.access)
  return (
    <Drawer title={`Edit access · ${person.name}`} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void onSave({ name, access })
        }}
        className="grid gap-5"
      >
        <Field label="Name or label">
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <AccessPicker demos={demos} value={access} onChange={setAccess} />
        <div className="flex gap-2">
          <button type="submit" className={btnPrimary}>
            Save
          </button>
          <button type="button" className={btnGhost} onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
    </Drawer>
  )
}

const EVENT_TEXT: Record<LogEntry['event'], string> = {
  'signed-in': 'Signed in',
  played: 'Played',
  favorited: 'Favorited',
  'wrong-code': 'Wrong code',
  blocked: 'Too many tries · blocked 1 min',
}

function ActivityTab() {
  const [log, setLog] = useState<LogEntry[] | null>(null)
  useEffect(() => {
    let live = true
    api<{ log: LogEntry[] }>('activity').then(({ data }) => live && setLog(data.log ?? []))
    return () => {
      live = false
    }
  }, [])
  if (!log) return <p className="label">Loading…</p>
  return (
    <section aria-labelledby="activity-h">
      <h1 id="activity-h" className="font-display mb-6 text-4xl leading-none font-extrabold tracking-[-0.03em]">
        Recent activity
      </h1>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[40rem] border-collapse text-left">
          <thead>
            <tr className="label text-muted border-b border-white/15">
              <th className="py-2 font-normal">When</th>
              <th className="py-2 font-normal">Who</th>
              <th className="py-2 font-normal">What</th>
              <th className="py-2 font-normal">Song</th>
            </tr>
          </thead>
          <tbody>
            {log.length === 0 && (
              <tr>
                <td colSpan={4} className="text-muted py-6 text-sm">
                  Nothing yet. Sign-ins, plays and favorites show up here.
                </td>
              </tr>
            )}
            {log.map((e, i) => {
              const bad = e.event === 'wrong-code' || e.event === 'blocked'
              return (
                <tr key={e.at + i} className="label border-b border-white/10">
                  <td className="text-muted py-2 pr-3 whitespace-nowrap">
                    {new Date(e.at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </td>
                  <td className="py-2 pr-3">{e.name}</td>
                  <td className={`py-2 pr-3 ${bad ? 'text-[#ffb020]' : ''}`}>{EVENT_TEXT[e.event]}</td>
                  <td className="py-2">{e.title ?? '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
