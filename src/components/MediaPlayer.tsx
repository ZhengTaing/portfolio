import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { useCoverColor } from '../lib/useCoverColor'
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
  /**
   * "showcase": the Unreleased-page look (big artwork, playlist beside it,
   * blurred cover backdrop and an accent color taken from the cover). The
   * parent should be `relative isolate overflow-hidden` so the backdrop fills it.
   */
  variant?: 'compact' | 'showcase'
  /** Optional heading shown above the showcase player. */
  heading?: ReactNode
  /** Showcase only: draw the blurred cover behind the player itself (default true). */
  backdrop?: boolean
  /** Called whenever the current song changes (e.g. to theme the whole page). */
  onTrackChange?: (track: PlayerTrack | undefined) => void
}

const BARS = [30, 70, 45, 90, 60, 35, 80, 50, 25, 65, 40, 85, 55, 30, 75, 45, 60, 20, 70, 50]

/**
 * Playlist-style media player: one shared <audio> element, a now-playing
 * panel with transport controls and a seek bar, and a clickable tracklist.
 * Plays straight through the list. Used for released songs.
 */
export function MediaPlayer(props: Props) {
  return props.variant === 'showcase' ? <ShowcasePlayer {...props} /> : <CompactPlayer {...props} />
}

function CompactPlayer({ tracks, listLabel = 'Tracks', hideList = false, inline = false }: Props) {
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

/**
 * Blurred copy of the current cover, cross-fading between songs. `fixed` fills
 * the viewport behind a page; the page wrapper should use
 * `relative isolate [clip-path:inset(0)]` so it never covers the header or footer.
 */
export function CoverBackdrop({ track, fixed = false }: { track?: PlayerTrack; fixed?: boolean }) {
  const [layers, setLayers] = useState<PlayerTrack[]>(track ? [track] : [])
  if (track && layers[layers.length - 1]?.id !== track.id) setLayers((l) => [...l.slice(-1), track])
  return (
    <div aria-hidden="true" className={`pointer-events-none ${fixed ? 'fixed' : 'absolute'} inset-0 -z-10 overflow-hidden bg-[#0e0e0e]`}>
      {layers.map((l, i) =>
        l.artwork ? (
          <div
            key={l.id + i}
            className={`absolute -inset-24 scale-110 bg-cover bg-center blur-[70px] brightness-[0.55] saturate-[1.4] ${i === layers.length - 1 ? 'motion-safe:animate-[fade_1.2s_ease-out_both]' : ''}`}
            style={{ backgroundImage: `url("${l.artwork.src}")` }}
          />
        ) : null,
      )}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(0_0_0/0.05)_0%,rgb(0_0_0/0.45)_60%,rgb(0_0_0/0.75)_100%)]" />
    </div>
  )
}

/** The Unreleased-page player style: big artwork, info, playlist, cover-colored backdrop. */
function ShowcasePlayer({ tracks, listLabel = 'Tracks', heading, backdrop = true, onTrackChange }: Props) {
  const p = usePlaylist(tracks)
  const { track } = p
  const accent = useCoverColor(track?.artwork?.src)
  useEffect(() => {
    onTrackChange?.(track)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track?.id])
  if (!track) return null
  const progress = p.duration ? (p.time / p.duration) * 100 : 0
  const index = Math.max(p.index, 0)

  return (
    <div
      className="p-5 sm:p-8"
      style={{ '--room-accent': accent, '--room-line': 'rgb(255 255 255 / 0.16)' } as CSSProperties}
    >
      {backdrop && <CoverBackdrop track={track} />}
      <audio {...p.audioProps} />
      {heading}
      <div aria-label="Player" role="region" className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,21rem)] lg:items-end lg:gap-10">
        <div className="grid grid-cols-[5.5rem_1fr] items-center gap-4 sm:grid-cols-[8rem_1fr] sm:gap-6 lg:grid-cols-[15rem_1fr] lg:items-end lg:gap-8 xl:grid-cols-[19rem_1fr]">
          <div className="aspect-square w-full overflow-hidden bg-black/30 shadow-[0_30px_80px_rgb(0_0_0/0.6)]">
            {track.artwork && (
              <img
                key={track.id}
                src={track.artwork.src}
                alt={track.artwork.alt}
                className="h-full w-full object-cover motion-safe:animate-[fade_.6s_ease-out_both]"
              />
            )}
          </div>
          <div className="min-w-0">
            <p className="label text-accent" aria-live="polite">
              {p.playing ? 'Now playing' : 'Paused'} · {index + 1} of {tracks.length}
            </p>
            <h3 className="font-display mt-1 truncate text-2xl leading-none font-extrabold tracking-[-0.02em] sm:text-4xl lg:text-5xl">
              {track.title}
            </h3>
            {track.subtitle && <p className="label mt-2 truncate text-white/80">{track.subtitle}</p>}
            {track.date && <p className="label mt-1 text-white/60">{track.date}</p>}
            {p.error && (
              <p role="alert" className="text-accent mt-1 text-sm">
                This track could not be loaded right now.
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
              <button type="button" onClick={p.prev} aria-label="Previous track" className="border-fg hover:bg-fg hover:text-bg grid size-10 place-items-center border-2 transition-colors">
                ⏮
              </button>
              <button type="button" onClick={p.toggle} aria-label={p.playing ? 'Pause' : 'Play'} className="bg-accent text-ink grid size-12 place-items-center text-xl transition-transform hover:scale-105">
                {p.playing ? '❚❚' : '▶'}
              </button>
              <button type="button" onClick={p.next} disabled={!p.hasNext} aria-label="Next track" className="border-fg hover:bg-fg hover:text-bg grid size-10 place-items-center border-2 transition-colors disabled:pointer-events-none disabled:opacity-40">
                ⏭
              </button>
              <button type="button" aria-pressed={p.shuffle} onClick={() => p.setShuffle(!p.shuffle)} className={`label ml-1 px-1 uppercase ${p.shuffle ? 'text-accent' : 'text-white/60 hover:text-white'}`}>
                Shuffle {p.shuffle ? 'on' : 'off'}
              </button>
            </div>
          </div>
        </div>

        <div className="max-h-[14rem] overflow-y-auto bg-black/35 py-2 backdrop-blur-md sm:max-h-[18rem] lg:max-h-[19rem]">
          <p className="label flex justify-between px-4 pt-1 pb-2 text-white/60">
            <span>Playlist</span>
            <span>
              {tracks.length} {tracks.length === 1 ? 'song' : 'songs'}
            </span>
          </p>
          <ol aria-label={listLabel}>
            {tracks.map((t, i) => {
              const current = t.id === track.id
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => p.playTrack(t.id)}
                    aria-current={current ? 'true' : undefined}
                    aria-label={`${current && p.playing ? 'Pause' : 'Play'} ${t.title}`}
                    className={`grid w-full grid-cols-[1.75rem_2.25rem_1fr_auto] items-center gap-3 px-4 py-1.5 text-left transition-colors ${current ? 'text-accent bg-[color-mix(in_srgb,var(--room-accent)_16%,transparent)]' : 'hover:bg-white/5'}`}
                  >
                    <span className="label tabular-nums text-white/60">{current && p.playing ? <span className="text-accent">▶</span> : String(i + 1).padStart(2, '0')}</span>
                    <span className="size-9 overflow-hidden bg-black/30">
                      {t.artwork && <img src={t.artwork.src} alt="" loading="lazy" className="h-full w-full object-cover" />}
                    </span>
                    <span className="min-w-0">
                      <span className="font-display block truncate text-sm font-bold">{t.title}</span>
                      {t.subtitle && <span className="label block truncate text-[0.625rem] text-white/55">{t.subtitle}</span>}
                    </span>
                    <span className="label tabular-nums text-white/60">{t.duration}</span>
                  </button>
                </li>
              )
            })}
          </ol>
        </div>
      </div>
    </div>
  )
}
