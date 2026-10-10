import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { usePlayer, type PlaylistTrack } from '../lib/player'
import { useCoverColor } from '../lib/useCoverColor'
import { formatTime } from '../lib/usePlaylist'

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

  useEffect(() => {
    if (!queueOpen) return
    const onDown = (e: MouseEvent) => !queueRef.current?.contains(e.target as Node) && setQueueOpen(false)
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
          <div ref={queueRef} className="relative">
            <button
              type="button"
              aria-expanded={queueOpen}
              onClick={() => setQueueOpen((o) => !o)}
              className={`uppercase ${queueOpen ? 'text-accent' : 'hover:text-white'}`}
            >
              Queue ({p.queue.length})
            </button>
            {queueOpen && (
              <div className="absolute right-0 bottom-9 max-h-[22rem] w-80 overflow-y-auto bg-[#141414] py-2 shadow-[0_20px_50px_rgb(0_0_0/0.6)]">
                <p className="px-4 pb-2 text-white/50">Up next</p>
                <ol aria-label="Queue">
                  {p.queue.map((t, i) => {
                    const current = t.id === track.id
                    return (
                      <li key={t.id}>
                        <button
                          type="button"
                          onClick={() => p.play(p.queue, t.id)}
                          aria-current={current ? 'true' : undefined}
                          className={`grid w-full grid-cols-[1.5rem_2rem_1fr] items-center gap-3 px-4 py-1.5 text-left normal-case ${current ? 'text-accent' : 'text-white hover:bg-white/5'}`}
                        >
                          <span className="tabular-nums text-white/50">{String(i + 1).padStart(2, '0')}</span>
                          <span className="size-8 overflow-hidden bg-white/10">
                            {imageOf(t) && <img src={imageOf(t)} alt="" loading="lazy" className="h-full w-full object-cover" />}
                          </span>
                          <span className="font-display truncate text-sm font-bold tracking-normal">{t.title}</span>
                        </button>
                      </li>
                    )
                  })}
                </ol>
              </div>
            )}
          </div>
          <button type="button" onClick={p.stop} aria-label="Close player" className="text-base hover:text-white">
            ✕
          </button>
        </div>
      </div>
    </section>
  )
}
