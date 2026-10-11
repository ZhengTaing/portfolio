import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import {
  actTypes,
  asList,
  emptyFilters,
  formatHold,
  generatedCover,
  genres,
  markets,
  matches,
  statuses,
  type Pitch,
  type PitchFilters,
} from '../lib/pitch'
import { useFavorites } from '../lib/favorites'
import { useCoverColor } from '../lib/useCoverColor'
import { formatTime, usePlaylist } from '../lib/usePlaylist'
import { HeartButton, QueueButton } from './SongActions'
import { Ticker } from './Ticker'

function Cover({ pitch, className = '' }: { pitch: Pitch; className?: string }) {
  if (pitch.coverUrl) {
    return <img src={pitch.coverUrl} alt="" loading="lazy" className={`h-full w-full object-cover ${className}`} />
  }
  return <div aria-hidden="true" className={`h-full w-full ${className}`} style={{ background: generatedCover(pitch.id) }} />
}

function StatusBadge({ pitch, className = '' }: { pitch: Pitch; className?: string }) {
  const s = statuses.find((x) => x.id === pitch.status) ?? statuses[0]
  const hold = pitch.status === 'on-hold' && pitch.holdUntil ? ` · ${formatHold(pitch.holdUntil)}` : ''
  return (
    <span
      className={`label bg-ink inline-flex items-center gap-1.5 border px-2 py-1 font-bold whitespace-nowrap ${className}`}
      style={{ color: s.color, borderColor: s.color }}
    >
      <span aria-hidden="true" className="size-[7px] rounded-full" style={{ background: s.color }} />
      {s.label}
      {hold}
    </span>
  )
}

/** "For → A, B" / "Cut by → X" / "Open pitch" */
function Targets({ pitch }: { pitch: Pitch }) {
  const placed = pitch.status === 'placed'
  const names = placed && pitch.placedWith ? [pitch.placedWith] : (pitch.targetArtists ?? []).filter(Boolean)
  const shown = names.slice(0, 2)
  return (
    <div className="label flex flex-wrap items-center gap-1.5">
      <span className="text-accent">{placed ? 'Cut by →' : 'For →'}</span>
      {shown.length === 0 ? (
        <span className="border-line border px-1.5">Open pitch</span>
      ) : (
        shown.map((n) => (
          <span key={n} className="border-line border px-1.5">
            {n}
          </span>
        ))
      )}
      {names.length > 2 && <span className="border-line border px-1.5">+{names.length - 2}</span>}
    </div>
  )
}

const metaLine = (p: Pitch) =>
  [asList(p.market).join(' / '), asList(p.actType).join(' / '), asList(p.genre).join(' / '), p.key ?? '', p.bpm ? `${p.bpm} BPM` : '']
    .filter(Boolean)
    .join(' · ')

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`label border px-2 py-1 uppercase transition-colors ${on ? 'border-fg bg-fg text-bg' : 'border-line hover:border-fg'}`}
    >
      {children}
    </button>
  )
}

function FilterMenu({
  filters,
  setFilters,
  pitches,
  resultCount,
}: {
  filters: PitchFilters
  setFilters: (f: PitchFilters) => void
  pitches: Pitch[]
  resultCount: number
}) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const active: { group: keyof PitchFilters; value: string; label: string }[] = [
    ...filters.status.map((v) => ({ group: 'status' as const, value: v, label: statuses.find((s) => s.id === v)!.label })),
    ...filters.market.map((v) => ({ group: 'market' as const, value: v, label: v })),
    ...filters.actType.map((v) => ({ group: 'actType' as const, value: v, label: v })),
    ...filters.genre.map((v) => ({ group: 'genre' as const, value: v, label: v })),
  ]

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function toggle(group: keyof PitchFilters, value: string) {
    const list = filters[group] as string[]
    const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
    setFilters({ ...filters, [group]: next })
  }

  const statusCount = (id: string) => pitches.filter((p) => p.status === id).length
  const group = (title: string, children: ReactNode) => (
    <div>
      <p className="label text-muted mb-1.5">{title}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  )

  return (
    <div ref={wrapRef} className="relative ml-auto flex flex-col items-end">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="pitch-filters"
        onClick={() => setOpen((o) => !o)}
        className="label hover:text-accent inline-flex items-center gap-2 py-2 uppercase"
      >
        Filters
        {active.length > 0 && <span className="bg-accent text-ink px-1.5 font-bold">{active.length}</span>}
        <span aria-hidden="true">{open ? '▴' : '▾'}</span>
      </button>

      {active.length > 0 && (
        <div className="mt-1 flex flex-wrap justify-end gap-1.5">
          {active.map((a) => (
            <button
              key={a.group + a.value}
              type="button"
              onClick={() => toggle(a.group, a.value)}
              aria-label={`Remove filter ${a.label}`}
              className="label border-line text-muted hover:text-fg border px-2 py-0.5 uppercase"
            >
              {a.label} <span aria-hidden="true">✕</span>
            </button>
          ))}
        </div>
      )}

      {open && (
        <div
          id="pitch-filters"
          role="group"
          aria-label="Filter songs"
          className="absolute top-10 right-0 z-30 grid w-[min(26rem,calc(100vw-2rem))] gap-4 bg-[#151515] p-4 shadow-[0_20px_50px_rgb(0_0_0/0.6)]"
        >
          {group(
            'Status',
            statuses.map((s) => (
              <Chip key={s.id} on={filters.status.includes(s.id)} onClick={() => toggle('status', s.id)}>
                <span aria-hidden="true" className="mr-1.5 inline-block size-[7px] rounded-full" style={{ background: s.color }} />
                {s.label} ({statusCount(s.id)})
              </Chip>
            )),
          )}
          {group(
            'Market',
            markets.map((m) => (
              <Chip key={m} on={filters.market.includes(m)} onClick={() => toggle('market', m)}>
                {m}
              </Chip>
            )),
          )}
          {group(
            'Act type',
            actTypes.map((a) => (
              <Chip key={a} on={filters.actType.includes(a)} onClick={() => toggle('actType', a)}>
                {a}
              </Chip>
            )),
          )}
          {group(
            'Genre',
            genres.map((g) => (
              <Chip key={g} on={filters.genre.includes(g)} onClick={() => toggle('genre', g)}>
                {g}
              </Chip>
            )),
          )}
          <div className="label flex justify-between pt-1">
            <button type="button" onClick={() => setFilters(emptyFilters)} className="text-muted hover:text-fg uppercase">
              Clear all
            </button>
            <button type="button" onClick={() => setOpen(false)} className="hover:text-accent uppercase">
              Show {resultCount} {resultCount === 1 ? 'song' : 'songs'} →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Full-page backdrop: a heavily blurred copy of the current song's cover that
 * cross-fades when the song changes. Fixed to the viewport; the page wrapper
 * clips it (clip-path) so it never spills over the site header or footer.
 */
function Backdrop({ pitch }: { pitch?: Pitch }) {
  const key = pitch?.id ?? 'none'
  const [layers, setLayers] = useState<Pitch[]>(pitch ? [pitch] : [])
  if (pitch && layers[layers.length - 1]?.id !== pitch.id) {
    // Keep the previous cover underneath while the new one fades in.
    setLayers((l) => [...l.slice(-1), pitch])
  }
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#0e0e0e]" data-backdrop={key}>
      {layers.map((l, i) => (
        <div
          key={l.id + i}
          className={`absolute -inset-24 scale-110 blur-[70px] brightness-[0.55] saturate-[1.4] ${i === layers.length - 1 ? 'motion-safe:animate-[fade_1.2s_ease-out_both]' : ''}`}
          style={
            l.coverUrl
              ? { backgroundImage: `url("${l.coverUrl}")`, backgroundSize: 'cover', backgroundPosition: 'center' }
              : { background: generatedCover(l.id) }
          }
        />
      ))}
      {/* Darken toward the bottom so cards and text stay readable. */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(0_0_0/0.1)_0%,rgb(0_0_0/0.55)_55%,rgb(0_0_0/0.85)_100%)]" />
    </div>
  )
}

/**
 * Song-pitch board for the private demos: filter menu, a player with the
 * current playlist beside it, and horizontal pitch cards that feed the player.
 */
export function PitchBoard({ pitches, toolbarStart }: { pitches: Pitch[]; toolbarStart?: ReactNode }) {
  const [filters, setFilters] = useState<PitchFilters>(emptyFilters)
  const favs = useFavorites()
  const [onlyFavs, setOnlyFavs] = useState(false)
  const showFavs = favs.enabled && onlyFavs
  const favCount = pitches.filter((x) => favs.ids.has(x.id)).length
  const visible = useMemo(
    () => pitches.filter((p) => matches(p, filters) && (!showFavs || favs.ids.has(p.id))),
    [pitches, filters, showFavs, favs.ids],
  )
  const p = usePlaylist(visible.length ? visible : pitches)
  const { track } = p
  const progress = p.duration ? (p.time / p.duration) * 100 : 0
  const queue = visible
  const accent = useCoverColor(track?.coverUrl)

  return (
    <div style={{ '--room-accent': accent, '--room-line': 'rgb(255 255 255 / 0.16)' } as CSSProperties}>
      <Backdrop pitch={track} />
      <div className="relative z-30 mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>{toolbarStart}</div>
        <FilterMenu filters={filters} setFilters={setFilters} pitches={pitches} resultCount={visible.length} />
      </div>

      {favs.enabled && (
        <div role="group" aria-label="Show" className="relative z-20 -mt-3 mb-6 flex flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={!onlyFavs}
            onClick={() => setOnlyFavs(false)}
            className={`label border px-3 py-1.5 uppercase transition-colors ${!onlyFavs ? 'border-white bg-white text-black' : 'border-white/30 hover:border-white'}`}
          >
            All songs ({pitches.length})
          </button>
          <button
            type="button"
            aria-pressed={onlyFavs}
            onClick={() => setOnlyFavs(true)}
            className={`label border px-3 py-1.5 uppercase transition-colors ${onlyFavs ? 'border-white bg-white text-black' : 'border-white/30 hover:border-white'}`}
          >
            <span aria-hidden="true" className="text-[#ff4d6d]">
              ♥
            </span>{' '}
            My favorites ({favCount})
          </button>
        </div>
      )}


      {track && (
        <section
          aria-label="Player"
          className="relative z-20 mb-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(17rem,22rem)] lg:items-end lg:gap-10"
        >
          {/* Now playing */}
          <div className="grid grid-cols-[5.5rem_1fr] items-center gap-4 sm:grid-cols-[8rem_1fr] sm:gap-6 xl:grid-cols-[22rem_1fr] xl:items-end xl:gap-10 lg:grid-cols-[17rem_1fr] lg:items-end lg:gap-8">
            <div className="aspect-square w-full overflow-hidden shadow-[0_30px_80px_rgb(0_0_0/0.65)]">
              <Cover key={track.id} pitch={track} className="motion-safe:animate-[fade_.6s_ease-out_both]" />
            </div>
            <div className="min-w-0">
              <p className="label text-accent flex flex-wrap items-center gap-x-2" aria-live="polite">
                {p.playing ? 'Now playing' : 'Paused'}
                {p.index >= 0 && (
                  <span>
                    · {p.index + 1} of {queue.length}
                  </span>
                )}
              </p>
              <div className="mt-1 flex min-w-0 items-center gap-3">
                <h2 className="font-display min-w-0 truncate text-2xl leading-none font-extrabold tracking-[-0.02em] sm:text-4xl lg:text-5xl xl:text-6xl">
                  {track.title}
                </h2>
                <HeartButton id={track.id} title={track.title} size="lg" />
              </div>
              <Ticker running={p.playing} className="label mt-2 text-white/80">
                Demo: {track.demoArtist || 'Zheng Taing'}
                {track.targetArtists?.length ? ` · For → ${track.targetArtists.join(', ')}` : ''}
                {metaLine(track) && <span className="text-white/60"> · {metaLine(track)}</span>}
              </Ticker>
              {p.error && (
                <p role="alert" className="text-accent mt-1 text-sm">
                  This demo could not be loaded right now.
                </p>
              )}
              <div className="mt-3 flex items-center gap-3">
                <span className="label w-9 text-right tabular-nums">{formatTime(p.time)}</span>
                <input
                  type="range"
                  min={0}
                  max={p.duration || 0}
                  step={0.1}
                  value={p.time}
                  onChange={(e) => p.seek(Number(e.target.value))}
                  aria-label="Seek"
                  aria-valuetext={`${formatTime(p.time)} of ${formatTime(p.duration)}`}
                  className="demo-range min-w-0 flex-1"
                  style={{ '--progress': `${progress}%` } as CSSProperties}
                />
                <span className="label w-9 tabular-nums">{formatTime(p.duration)}</span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={p.prev}
                  aria-label="Previous track"
                  className="border-fg hover:bg-fg hover:text-bg grid size-10 place-items-center border-2 transition-colors"
                >
                  ⏮
                </button>
                <button
                  type="button"
                  onClick={p.toggle}
                  aria-label={p.playing ? 'Pause' : 'Play'}
                  className="bg-accent text-ink grid size-12 place-items-center text-xl transition-transform hover:scale-105"
                >
                  {p.playing ? '❚❚' : '▶'}
                </button>
                <button
                  type="button"
                  onClick={p.next}
                  disabled={!p.hasNext}
                  aria-label="Next track"
                  className="border-fg hover:bg-fg hover:text-bg grid size-10 place-items-center border-2 transition-colors disabled:pointer-events-none disabled:opacity-40"
                >
                  ⏭
                </button>
                <button
                  type="button"
                  aria-pressed={p.shuffle}
                  onClick={() => p.setShuffle(!p.shuffle)}
                  className={`label ml-1 px-1 uppercase ${p.shuffle ? 'text-accent' : 'text-muted hover:text-fg'}`}
                >
                  Shuffle {p.shuffle ? 'on' : 'off'}
                </button>
                <QueueButton track={track} label="Unreleased" className="ml-1" />
              </div>
            </div>
          </div>

          {/* Playlist = the current filtered list */}
          <div className="max-h-[14rem] overflow-y-auto bg-black/35 py-2 backdrop-blur-md sm:max-h-[18rem] lg:max-h-[22rem]">
            <p className="label text-muted flex justify-between px-4 pt-1 pb-2">
              <span>Playlist{filtersSummary(filters)}</span>
              <span>
                {queue.length} {queue.length === 1 ? 'song' : 'songs'}
              </span>
            </p>
            <ol aria-label="Playlist">
              {queue.map((q, i) => {
                const current = q.id === track.id
                return (
                  <li
                    key={q.id}
                    className={`group flex items-center pr-3 transition-colors ${current ? 'bg-[color-mix(in_srgb,var(--room-accent)_16%,transparent)]' : 'hover:bg-white/5'}`}
                  >
                    <button
                      type="button"
                      onClick={() => p.playTrack(q.id)}
                      aria-current={current ? 'true' : undefined}
                      aria-label={`${current && p.playing ? 'Pause' : 'Play'} ${q.title} from playlist`}
                      className={`grid min-w-0 flex-1 grid-cols-[1.75rem_2.25rem_1fr_auto] items-center gap-3 py-1.5 pl-4 text-left ${current ? 'text-accent' : ''}`}
                    >
                      <span className="label text-muted tabular-nums">
                        {current && p.playing ? <span className="text-accent">▶</span> : String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="size-9 overflow-hidden">
                        <Cover pitch={q} />
                      </span>
                      <span className="font-display truncate text-sm font-bold">{q.title}</span>
                      <span className="label text-muted tabular-nums">{q.duration}</span>
                    </button>
                    <span className="flex items-center gap-2 pl-2">
                      <QueueButton
                        track={q}
                        label="Unreleased"
                        compact
                        className="pointer-coarse:hidden opacity-0 group-focus-within:opacity-100 group-hover:opacity-100"
                      />
                      <HeartButton id={q.id} title={q.title} size="sm" />
                    </span>
                  </li>
                )
              })}
            </ol>
          </div>
        </section>
      )}

      <p className="sr-only" role="status" aria-live="polite">
        Showing {visible.length} {visible.length === 1 ? 'song' : 'songs'}
      </p>

      {visible.length === 0 ? (
        showFavs && favCount === 0 ? (
          <div className="label border-line border p-6">
            No favorites yet. Tap ♡ on a song to save it here.
          </div>
        ) : (
        <div className="label border-line border p-6">
          No songs match these filters.{' '}
          <button type="button" onClick={() => setFilters(emptyFilters)} className="link-underline">
            Clear filters
          </button>
        </div>
        )
      ) : (
        <ul data-reveal-stagger className="grid gap-3.5 md:grid-cols-2" aria-label="Song pitches">
          {visible.map((pitch) => {
            const current = track?.id === pitch.id
            const placed = pitch.status === 'placed'
            const meta = metaLine(pitch)
            return (
              <li key={pitch.id}>
                <article
                  className={`relative grid h-full grid-cols-[6.5rem_1fr] border bg-black/40 backdrop-blur-sm transition-colors sm:grid-cols-[8.25rem_1fr] ${current ? 'border-accent outline-accent outline-1' : 'border-white/15 hover:bg-black/55'}`}
                >
                  <div className="relative min-h-[8.25rem]">
                    <Cover pitch={pitch} className={`absolute inset-0 ${placed ? 'brightness-[0.6] grayscale' : ''}`} />
                    <button
                      type="button"
                      onClick={() => p.playTrack(pitch.id)}
                      aria-label={`${current && p.playing ? 'Pause' : 'Play'} ${pitch.title}`}
                      className="bg-accent text-ink absolute bottom-2 left-2 grid size-9 place-items-center text-sm transition-transform hover:scale-110"
                    >
                      {current && p.playing ? '❚❚' : '▶'}
                    </button>
                  </div>
                  <div className="flex min-w-0 flex-col gap-1.5 p-3 sm:p-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-display text-lg leading-none font-extrabold tracking-[-0.02em] sm:text-xl">
                          {pitch.title}
                        </h3>
                        <p className="label text-muted mt-1">
                          Demo: {pitch.demoArtist || 'Zheng Taing'}
                          {pitch.note ? ` (${pitch.note})` : ''}
                        </p>
                      </div>
                      <StatusBadge pitch={pitch} className="shrink-0" />
                    </div>
                    <Targets pitch={pitch} />
                    {meta && <p className="label text-muted">{meta}</p>}
                    {pitch.pitchNotes && <p className="line-clamp-2 text-xs leading-relaxed text-[#ddd]">{pitch.pitchNotes}</p>}
                    <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                      <p className="label text-muted">{pitch.duration}</p>
                      <span className="flex items-center gap-2">
                        <QueueButton track={pitch} label="Unreleased" />
                        <HeartButton id={pitch.id} title={pitch.title} className="size-8 border border-white/40" />
                      </span>
                    </div>
                  </div>
                </article>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function filtersSummary(f: PitchFilters) {
  const parts = [
    ...f.status.map((s) => statuses.find((x) => x.id === s)?.label ?? s),
    ...f.market,
    ...f.actType,
    ...f.genre,
  ]
  return parts.length ? ` · ${parts.join(' · ')}` : ' · All songs'
}
