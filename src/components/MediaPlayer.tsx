import type { CSSProperties } from 'react'
import { formatTime, usePlaylist } from '../lib/usePlaylist'

export interface PlayerTrack {
  id: string
  title: string
  note?: string
  date?: string
  duration?: string
  audioUrl: string
  /** Shown under the title, e.g. the artist. */
  subtitle?: string
  /** Cover art; the animated bars are shown when absent. */
  artwork?: { src: string; alt: string }
}

interface Props {
  tracks: PlayerTrack[]
  /** Accessible name for the tracklist. */
  listLabel?: string
  /** Hide the tracklist (e.g. a single song on its detail page). */
  hideList?: boolean
  /** Don't stick to the bottom of the screen on phones. */
  inline?: boolean
}

const BARS = [30, 70, 45, 90, 60, 35, 80, 50, 25, 65, 40, 85, 55, 30, 75, 45, 60, 20, 70, 50]

/**
 * Playlist-style media player: one shared <audio> element, a now-playing
 * panel with transport controls and a seek bar, and a clickable tracklist.
 * Plays straight through the list. Used for released songs.
 */
export function MediaPlayer({ tracks, listLabel = 'Tracks', hideList = false, inline = false }: Props) {
  const p = usePlaylist(tracks)
  const { track, playing, time, duration, volume, error, hasNext } = p
  const index = Math.max(p.index, 0)
  const toggle = p.toggle
  const prev = p.prev
  const next = p.next
  const seek = p.seek
  const setVolume = p.setVolume
  const select = (i: number) => p.playTrack(tracks[i].id)

  if (!track) return null

  const progress = duration ? (time / duration) * 100 : 0

  return (
    <div>
      <audio {...p.audioProps} />

      {/* Now playing */}
      <section
        aria-label="Player"
        className={`border-fg bg-surface z-20 border-2 p-5 sm:p-7 ${inline ? '' : 'sticky bottom-0 md:static'}`}
      >
        <div className="grid gap-6 md:grid-cols-[auto_1fr] md:items-center md:gap-8">
          {track.artwork ? (
            <img
              key={track.id}
              src={track.artwork.src}
              alt={track.artwork.alt}
              width={144}
              height={144}
              className="hidden size-36 object-cover md:block"
            />
          ) : (
          <div
            aria-hidden="true"
            className="border-accent hidden size-36 items-end gap-[3px] border-2 p-3 md:flex"
          >
            {BARS.slice(0, 12).map((h, i) => (
              <i
                key={i}
                className={`bg-accent flex-1 origin-bottom ${playing ? 'motion-safe:animate-[eq_1s_ease-in-out_infinite_alternate]' : ''}`}
                style={{ height: `${h}%`, animationDelay: `${(i % 5) * -0.2}s` }}
              />
            ))}
          </div>
          )}
          <div className="min-w-0">
            <p className="label text-accent" aria-live="polite">
              {playing ? 'Now playing' : 'Paused'} · {String(index + 1).padStart(2, '0')} / {String(tracks.length).padStart(2, '0')}
            </p>
            <h2 className="font-display mt-1 text-[clamp(1.5rem,3.5vw,2.75rem)] md:truncate leading-none font-extrabold tracking-[-0.02em]">
              {track.title}
            </h2>
            {track.subtitle && <p className="label mt-2">{track.subtitle}</p>}
            {track.note && <p className="text-muted mt-2 text-sm md:truncate">{track.note}</p>}
            {error && (
              <p role="alert" className="text-accent mt-2 text-sm">
                This track could not be loaded right now.
              </p>
            )}

            {/* Seek bar */}
            <div className="mt-5 flex items-center gap-3">
              <span className="label w-10 text-right tabular-nums">{formatTime(time)}</span>
              <input
                type="range"
                min={0}
                max={duration || 0}
                step={0.1}
                value={time}
                onChange={(e) => seek(Number(e.target.value))}
                aria-label="Seek"
                aria-valuetext={`${formatTime(time)} of ${formatTime(duration)}`}
                className="demo-range flex-1"
                style={{ '--progress': `${progress}%` } as CSSProperties}
              />
              <span className="label w-10 tabular-nums">{formatTime(duration)}</span>
            </div>

            {/* Transport */}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={prev}
                aria-label="Previous track"
                className="border-fg hover:bg-fg hover:text-bg grid size-11 place-items-center border-2 text-lg transition-colors"
              >
                ⏮
              </button>
              <button
                type="button"
                onClick={toggle}
                aria-label={playing ? 'Pause' : 'Play'}
                className="bg-accent text-ink grid size-14 place-items-center text-2xl transition-transform hover:scale-105"
              >
                {playing ? '❚❚' : '▶'}
              </button>
              <button
                type="button"
                onClick={next}
                disabled={!hasNext}
                aria-label="Next track"
                className="border-fg hover:bg-fg hover:text-bg grid size-11 place-items-center border-2 text-lg transition-colors disabled:pointer-events-none disabled:opacity-40"
              >
                ⏭
              </button>
              <label className="label ml-auto hidden items-center gap-2 sm:flex">
                Vol
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="demo-range w-24"
                  style={{ '--progress': `${volume * 100}%` } as CSSProperties}
                />
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* Tracklist */}
      {!hideList && (
      <ol className="mt-10" aria-label={listLabel}>
        {tracks.map((t, i) => {
          const active = i === index
          return (
            <li key={t.id} className="border-line border-t">
              <button
                type="button"
                onClick={() => (active ? toggle() : select(i))}
                aria-current={active ? 'true' : undefined}
                aria-label={`${active && playing ? 'Pause' : 'Play'} ${t.title}`}
                className={`group grid w-full grid-cols-[2.5rem_1fr_auto] items-center gap-3 py-5 text-left transition-colors sm:grid-cols-[3rem_1fr_auto] ${active ? 'text-accent' : 'hover:text-accent'}`}
              >
                <span className="label tabular-nums">
                  {active && playing ? (
                    <span aria-hidden="true">▶</span>
                  ) : (
                    <>
                      <span className="group-hover:hidden">{String(i + 1).padStart(2, '0')}</span>
                      <span aria-hidden="true" className="hidden group-hover:inline">
                        ▶
                      </span>
                    </>
                  )}
                </span>
                <span className="min-w-0">
                  <span className="font-display block text-xl md:truncate leading-none font-extrabold tracking-[-0.02em] sm:text-2xl">
                    {t.title}
                  </span>
                  {(t.subtitle || t.note || t.date) && (
                    <span className="label text-muted mt-1.5 block truncate normal-case">
                      {[t.subtitle, t.date, t.note].filter(Boolean).join(' · ')}
                    </span>
                  )}
                </span>
                <span className="label text-muted tabular-nums">{t.duration}</span>
              </button>
            </li>
          )
        })}
      </ol>
      )}
    </div>
  )
}
