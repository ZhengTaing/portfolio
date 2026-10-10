import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

/** Anything the site can play. Extra fields are used by the now-playing bar. */
export interface PlaylistTrack {
  id: string
  audioUrl: string
  title?: string
  /** Line under the title, e.g. the artist. */
  subtitle?: string
  artwork?: { src: string; alt?: string }
  /** Unreleased demos use coverUrl / demoArtist instead. */
  coverUrl?: string
  demoArtist?: string
  duration?: string
}

interface PlayerState {
  queue: PlaylistTrack[]
  current: PlaylistTrack | undefined
  playing: boolean
  time: number
  duration: number
  volume: number
  shuffle: boolean
  error: boolean
  /** Page the current queue was started from (the bar links back to it). */
  sourcePath: string
}

interface PlayerApi extends PlayerState {
  /** Replace the queue with `tracks` and play `id` (or the first track). */
  play: (tracks: PlaylistTrack[], id?: string, sourcePath?: string) => void
  /** Swap the queue without interrupting the current song (e.g. filters changed). */
  setQueue: (tracks: PlaylistTrack[]) => void
  toggle: () => void
  next: () => void
  prev: () => void
  seek: (seconds: number) => void
  setVolume: (v: number) => void
  setShuffle: (on: boolean) => void
  /** Stop and clear the player (hides the now-playing bar). */
  stop: () => void
  hasNext: boolean
  hasPrev: boolean
}

const PlayerContext = createContext<PlayerApi | null>(null)

export function usePlayer() {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('usePlayer must be used inside <PlayerProvider>')
  return ctx
}

/**
 * One site-wide <audio> element. It lives in the layout, so music keeps
 * playing while visitors move between pages; every on-page player and the
 * now-playing bar are views of this same state.
 */
export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const autoplay = useRef(false)
  const [queue, setQueueState] = useState<PlaylistTrack[]>([])
  const [current, setCurrent] = useState<PlaylistTrack | undefined>()
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [shuffle, setShuffle] = useState(false)
  const [error, setError] = useState(false)
  const [sourcePath, setSourcePath] = useState('/')

  const index = current ? queue.findIndex((t) => t.id === current.id) : -1

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !current) return
    setTime(0)
    setDuration(0)
    setError(false)
    audio.load()
    if (autoplay.current) audio.play().catch(() => setPlaying(false))
  }, [current?.audioUrl]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  const choose = useCallback((t: PlaylistTrack, autoplayNext: boolean) => {
    autoplay.current = autoplayNext
    setCurrent(t)
  }, [])

  const nextTrack = useCallback((): PlaylistTrack | undefined => {
    if (queue.length === 0) return undefined
    if (shuffle && queue.length > 1) {
      const others = queue.filter((t) => t.id !== current?.id)
      return others[Math.floor(Math.random() * others.length)]
    }
    return index === -1 ? queue[0] : queue[index + 1]
  }, [queue, shuffle, current?.id, index])

  const hasNext = queue.length > 0 && (shuffle ? queue.length > 1 : index < queue.length - 1)
  const hasPrev = index > 0

  const api = useMemo<PlayerApi>(() => {
    const toggle = () => {
      const audio = audioRef.current
      if (!audio || !current) return
      if (audio.paused) {
        autoplay.current = true
        audio.play().catch(() => setPlaying(false))
      } else {
        autoplay.current = false
        audio.pause()
      }
    }
    return {
      queue,
      current,
      playing,
      time,
      duration,
      volume,
      shuffle,
      error,
      sourcePath,
      hasNext,
      hasPrev,
      play: (tracks, id, path) => {
        const t = tracks.find((x) => x.id === id) ?? tracks[0]
        if (!t) return
        setQueueState(tracks)
        if (path) setSourcePath(path)
        if (current?.id === t.id) {
          if (audioRef.current?.paused) toggle()
          return
        }
        choose(t, true)
      },
      setQueue: (tracks) => setQueueState(tracks),
      toggle,
      next: () => {
        const t = nextTrack()
        if (t) choose(t, playing)
      },
      prev: () => {
        const audio = audioRef.current
        if (audio && audio.currentTime > 3) {
          audio.currentTime = 0
          return
        }
        if (hasPrev) choose(queue[index - 1], playing)
      },
      seek: (s) => {
        if (audioRef.current) audioRef.current.currentTime = s
        setTime(s)
      },
      setVolume,
      setShuffle,
      stop: () => {
        audioRef.current?.pause()
        autoplay.current = false
        setCurrent(undefined)
        setQueueState([])
        setPlaying(false)
      },
    }
  }, [queue, current, playing, time, duration, volume, shuffle, error, sourcePath, hasNext, hasPrev, index, choose, nextTrack])

  return (
    <PlayerContext.Provider value={api}>
      {children}
      <audio
        ref={audioRef}
        src={current?.audioUrl}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onDurationChange={(e) => setDuration(e.currentTarget.duration)}
        onError={() => {
          if (!current) return
          setError(true)
          setPlaying(false)
        }}
        onEnded={() => {
          const t = nextTrack()
          if (t && hasNext) choose(t, true)
          else setPlaying(false)
        }}
      />
    </PlayerContext.Provider>
  )
}
