import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { usePlayer, type PlaylistTrack } from '../lib/player'
import { useCoverColor } from '../lib/useCoverColor'
import { formatTime } from '../lib/usePlaylist'
import { HeartButton } from './SongActions'

const imageOf = (t?: PlaylistTrack) => t?.artwork?.src ?? t?.coverUrl
const subtitleOf = (t?: PlaylistTrack) => t?.subtitle ?? (t?.demoArtist ? `Demo · ${t.demoArtist}` : 'Zheng Taing')

const EQ = [55, 90, 35, 75, 50]

/**
 * Site-wide "now playing" bar. Appears once anything is played and stays
 * docked to the bottom of the screen while visitors move between pages.
 */
export function NowPlayingBar() {
  const p = usePlayer()
  const [queueOpen, setQueueOpen] = useState(false)
  const queueRef = useRef<HTMLDivElement>(null)
  const track = p.current
  const accent = useCoverColor(imageOf(track))
  const [hiddenToast, setHiddenToast] = useState<string>()
  const [dragFrom, setDragFrom] = useState<number | null>(null)

  // "Added to your queue" message for a few seconds after each add.
  const toast = p.lastAdded && p.lastAdded.key !== hiddenToast ? p.lastAdded : undefined
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setHiddenToast(toast.key), 4000)
    return () => clearTimeout(t)
  }, [toast])

  useEffect(() => {
    if (!queueOpen) return
    const onDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!queueRef.current?.contains(target) && !target.closest?.('[data-queue-toggle]')) setQueueOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setQueueOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [queueOpen])

  if (!track) return null
  const img = imageOf(track)
  const progress = p.duration ? (p.time / p.duration) * 100 : 0

  return (
    <section
      aria-label="Now playing"
      className="fixed inset-x-0 bottom-0 z-40 text-white motion-safe:animate-[rise_.4s_ease-out_both] md:left-14"
      style={{ '--room-accent': accent, '--room-line': 'rgb(255 255 255 / 0.2)' } as CSSProperties}
    >
      {/* Blurred cover tint behind dark glass */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden bg-[#0b0b0b]">
        {img && (
          <div
            key={img}
            className="absolute -inset-10 bg-cover bg-center opacity-60 blur-2xl saturate-150 motion-safe:animate-[fade_.8s_ease-out_both]"
            style={{ backgroundImage: `url("${img}")` }}
          />
        )}
        <div className="absolute inset-0 bg-black/65 backdrop-blur-xl" />
      </div>

      {toast && (
        <div role="status" className="label pointer-events-auto absolute -top-14 left-1/2 flex -translate-x-1/2 items-center gap-3 bg-white px-3.5 py-2 whitespace-nowrap text-black shadow-[0_10px_30px_rgb(0_0_0/0.4)] motion-safe:animate-[rise_.3s_ease-out_both]">
          <span>
            ✓ Added &ldquo;{toast.track.title}&rdquo; to your queue
          </span>
          <button
            type="button"
            onClick={() => {
              p.removeFromQueue(toast.key)
              setHiddenToast(toast.key)
            }}
            className="underline uppercase"
          >
            Undo
          </button>
        </div>
      )}

      {/* Seek line along the top edge */}
      <input
        type="range"
        min={0}
        max={p.duration || 0}
        step={0.1}
        value={p.time}
        onChange={(e) => p.seek(Number(e.target.value))}
        aria-label="Seek"
        aria-valuetext={`${formatTime(p.time)} of ${formatTime(p.duration)}`}
        className="now-seek absolute inset-x-0 -top-[7px] w-full"
        style={{ '--progress': `${progress}%` } as CSSProperties}
      />

      <div className="grid h-[4.5rem] grid-cols-[1fr_auto] items-center gap-3 px-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:gap-6 sm:px-6">
        {/* Track */}
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative size-12 shrink-0 overflow-hidden bg-white/10">
            {img && <img src={img} alt="" className="h-full w-full object-cover" />}
          </div>
          <div className="min-w-0">
            <Link
              to={p.sourcePath}
              className="font-display block truncate text-[0.95rem] leading-tight font-extrabold tracking-[-0.01em] hover:underline"
              title="Go to this song's page"
            >
              {track.title}
            </Link>
            <p className="label mt-0.5 flex items-center gap-2 truncate text-white/65">
              <span aria-hidden="true" className="flex h-2.5 items-end gap-[2px]">
                {EQ.map((h, i) => (
                  <i
                    key={i}
                    className={`bg-accent w-[2px] origin-bottom ${p.playing ? 'motion-safe:animate-[eq_.9s_ease-in-out_infinite_alternate]' : 'opacity-50'}`}
                    style={{ height: `${h}%`, animationDelay: `${i * -0.17}s` }}
                  />
                ))}
              </span>
              <span className="truncate">{subtitleOf(track)}</span>
            </p>
          </div>
          <HeartButton id={track.id} title={track.title} className="ml-1 hidden sm:grid" />
        </div>

        {/* Transport */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={p.prev}
            aria-label="Previous track"
            className="hidden size-9 place-items-center text-white/80 hover:text-white sm:grid"
          >
            ⏮
          </button>
          <button
            type="button"
            onClick={p.toggle}
            aria-label={p.playing ? 'Pause' : 'Play'}
            className="bg-accent text-ink grid size-11 place-items-center text-lg transition-transform hover:scale-105"
          >
            {p.playing ? '❚❚' : '▶'}
          </button>
          <button
            type="button"
            onClick={p.next}
            disabled={!p.hasNext}
            aria-label="Next track"
            className="grid size-9 place-items-center text-white/80 hover:text-white disabled:opacity-30"
          >
            ⏭
          </button>
          <button
            type="button"
            data-queue-toggle
            aria-expanded={queueOpen}
            aria-label={`Queue (${p.upNext.length})`}
            onClick={() => setQueueOpen((o) => !o)}
            className="relative grid size-9 place-items-center text-white/80 hover:text-white sm:hidden"
          >
            ☰{p.upNext.length > 0 && <span className="bg-accent text-ink absolute -top-0.5 -right-0.5 px-1 text-[0.6rem] font-bold">{p.upNext.length}</span>}
          </button>
          <button type="button" onClick={p.stop} aria-label="Close player" className="grid size-8 place-items-center text-white/60 hover:text-white sm:hidden">
            ✕
          </button>
        </div>

        {/* Extras (desktop) */}
        <div className="label hidden items-center justify-end gap-4 text-white/70 sm:flex">
          <span className="tabular-nums">
            {formatTime(p.time)} / {formatTime(p.duration)}
          </span>
          <button
            type="button"
            aria-pressed={p.shuffle}
            onClick={() => p.setShuffle(!p.shuffle)}
            className={`uppercase ${p.shuffle ? 'text-accent' : 'hover:text-white'}`}
          >
            Shuffle
          </button>
          <label className="hidden items-center gap-2 lg:flex">
            <span className="sr-only">Volume</span>
            <span aria-hidden="true">Vol</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={p.volume}
              onChange={(e) => p.setVolume(Number(e.target.value))}
              className="demo-range w-20"
              style={{ '--progress': `${p.volume * 100}%` } as CSSProperties}
            />
          </label>
          <div className="relative">
            <button
              type="button"
              data-queue-toggle
              aria-expanded={queueOpen}
              onClick={() => setQueueOpen((o) => !o)}
              className={`uppercase ${queueOpen ? 'text-accent' : 'hover:text-white'}`}
            >
              Queue{p.upNext.length > 0 && <span className="bg-accent text-ink ml-1.5 px-1.5 font-bold">{p.upNext.length}</span>}
            </button>
          </div>
          <button type="button" onClick={p.stop} aria-label="Close player" className="text-base hover:text-white">
            ✕
          </button>
        </div>
      </div>
      {queueOpen && (
        <div ref={queueRef} className="label absolute right-2 bottom-full mb-3 max-h-[min(30rem,65vh)] w-[min(22rem,calc(100vw-1rem))] overflow-y-auto bg-[#141414] py-2 text-white/80 normal-case sm:right-6 shadow-[0_20px_50px_rgb(0_0_0/0.6)]">
          <p className="flex justify-between px-4 pb-2 text-white/50 uppercase">
            <span>Queue</span>
            {p.upNext.length > 0 && (
              <button type="button" onClick={p.clearQueue} className="uppercase hover:text-white">
                Clear
              </button>
            )}
          </p>
          <p className="px-4 pt-1 pb-1 text-white/50 uppercase">Now playing</p>
          <QueueRow track={track} label={subtitleOf(track)} current />

          <p className="px-4 pt-3 pb-1 text-white/50 uppercase">Up next · you added ({p.upNext.length})</p>
          {p.upNext.length === 0 ? (
            <p className="px-4 pb-1 text-white/45">Tap “+ Queue” on any song, on any page.</p>
          ) : (
            <ol aria-label="Up next">
              {p.upNext.map((q, i) => (
                <li
                  key={q.key}
                  draggable
                  onDragStart={() => setDragFrom(i)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (dragFrom !== null) p.moveInQueue(dragFrom, i)
                    setDragFrom(null)
                  }}
                  className={`flex items-center pr-3 ${dragFrom === i ? 'opacity-40' : ''}`}
                >
                  <span aria-hidden="true" className="cursor-grab pl-3 text-white/35">
                    ⋮⋮
                  </span>
                  <button type="button" onClick={() => p.playFromQueue(q.key)} className="min-w-0 flex-1 text-left" aria-label={`Play ${q.track.title} now`}>
                    <QueueRow track={q.track} label={q.sourceLabel} />
                  </button>
                  <button type="button" onClick={() => p.moveInQueue(i, i - 1)} disabled={i === 0} aria-label={`Move ${q.track.title} up`} className="px-1 text-white/50 hover:text-white disabled:opacity-20">
                    ↑
                  </button>
                  <button type="button" onClick={() => p.moveInQueue(i, i + 1)} disabled={i === p.upNext.length - 1} aria-label={`Move ${q.track.title} down`} className="px-1 text-white/50 hover:text-white disabled:opacity-20">
                    ↓
                  </button>
                  <button type="button" onClick={() => p.removeFromQueue(q.key)} aria-label={`Remove ${q.track.title} from queue`} className="px-1 text-base text-white/50 hover:text-white">
                    ×
                  </button>
                </li>
              ))}
            </ol>
          )}

          {p.laterInPlaylist.length > 0 && (
            <>
              <p className="px-4 pt-3 pb-1 text-white/50 uppercase">Then · rest of playlist</p>
              <ol aria-label="Rest of playlist">
                {p.laterInPlaylist.map((t) => (
                  <li key={t.id}>
                    <button type="button" onClick={() => p.play(p.queue, t.id)} className="w-full text-left opacity-70 hover:opacity-100">
                      <QueueRow track={t} label={subtitleOf(t)} />
                    </button>
                  </li>
                ))}
              </ol>
            </>
          )}
        </div>
      )}
    </section>
  )
}

function QueueRow({ track, label, current = false }: { track: PlaylistTrack; label: string; current?: boolean }) {
  const img = imageOf(track)
  return (
    <span className="flex items-center gap-3 px-4 py-1.5">
      <span className="size-9 shrink-0 overflow-hidden bg-white/10">{img && <img src={img} alt="" loading="lazy" className="h-full w-full object-cover" />}</span>
      <span className="min-w-0">
        <span className={`font-display block truncate text-sm font-bold tracking-normal ${current ? 'text-accent' : 'text-white'}`}>{track.title}</span>
        <span className="block truncate text-[0.625rem] tracking-[0.08em] text-white/50 uppercase">{label}</span>
      </span>
    </span>
  )
}
