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

/** A song someone added with "+ Queue". It plays before the rest of the playlist. */
export interface QueuedTrack {
  /** Unique per add, so the same song can be queued twice. */
  key: string
  track: PlaylistTrack
  /** Page it was added from, e.g. "/music/unreleased". */
  sourcePath: string
  /** Shown under the title, e.g. "Unreleased". */
  sourceLabel: string
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
  /** Songs added with "+ Queue", in play order. */
  upNext: QueuedTrack[]
  /** Playlist songs that play after `upNext`. */
  laterInPlaylist: PlaylistTrack[]
  /** The last song added, for the "Added to your queue" message. */
  lastAdded: QueuedTrack | undefined
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
  /** Add a song to "Up next" (or play it straight away if nothing is playing). */
  addToQueue: (track: PlaylistTrack, sourcePath: string, sourceLabel: string) => void
  removeFromQueue: (key: string) => void
  /** Move a queued song from one position to another. */
  moveInQueue: (from: number, to: number) => void
  clearQueue: () => void
  /** Play a queued song now (it leaves the queue). */
  playFromQueue: (key: string) => void
  /** Drop queued songs that match, e.g. demos after locking the page. */
  removeFromQueueWhere: (test: (t: PlaylistTrack) => boolean) => void
  isQueued: (id: string) => boolean
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
  const [upNext, setUpNext] = useState<QueuedTrack[]>([])
  const [lastAdded, setLastAdded] = useState<QueuedTrack | undefined>()
  /** Playing something from "Up next": the playlist resumes after `anchorId`. */
  const [fromQueue, setFromQueue] = useState(false)
  const [anchorId, setAnchorId] = useState<string | undefined>()
  /** Page a queued song was added from, while it plays. */
  const [queuedFrom, setQueuedFrom] = useState<string | undefined>()
  const queueKey = useRef(0)

  const index = current ? queue.findIndex((t) => t.id === (fromQueue ? anchorId : current.id)) : -1

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

  const choose = useCallback((t: PlaylistTrack, autoplayNext: boolean, queued = false) => {
    autoplay.current = autoplayNext
    setFromQueue(queued)
    if (!queued) setAnchorId(t.id)
    setCurrent(t)
  }, [])

  /** The next playlist song (not counting "Up next"). */
  const nextTrack = useCallback((): PlaylistTrack | undefined => {
    if (queue.length === 0) return undefined
    if (shuffle && queue.length > 1) {
      const others = queue.filter((t) => t.id !== current?.id && t.id !== anchorId)
      return others[Math.floor(Math.random() * others.length)]
    }
    return index === -1 ? queue[0] : queue[index + 1]
  }, [queue, shuffle, current?.id, anchorId, index])

  const playlistHasNext = queue.length > 0 && (shuffle ? queue.length > 1 : index < queue.length - 1)
  const hasNext = upNext.length > 0 || playlistHasNext
  const hasPrev = index > 0 || fromQueue
  const laterInPlaylist = useMemo(() => (shuffle ? [] : index === -1 ? queue : queue.slice(index + 1)), [shuffle, index, queue])

  /** Advance: "Up next" first, then the playlist. */
  const advance = useCallback(
    (autoplayNext: boolean) => {
      const [first, ...rest] = upNext
      if (first) {
        setUpNext(rest)
        setQueuedFrom(first.sourcePath)
        choose(first.track, autoplayNext, true)
        return true
      }
      const t = playlistHasNext ? nextTrack() : undefined
      if (t) choose(t, autoplayNext)
      return Boolean(t)
    },
    [upNext, playlistHasNext, nextTrack, choose],
  )

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
      sourcePath: fromQueue && queuedFrom ? queuedFrom : sourcePath,
      upNext,
      laterInPlaylist,
      lastAdded,
      hasNext,
      hasPrev,
      play: (tracks, id, path) => {
        const t = tracks.find((x) => x.id === id) ?? tracks[0]
        if (!t) return
        setQueueState(tracks)
        if (path) setSourcePath(path)
        if (current?.id === t.id) {
          setFromQueue(false)
          setAnchorId(t.id)
          if (audioRef.current?.paused) toggle()
          return
        }
        choose(t, true)
      },
      setQueue: (tracks) => setQueueState(tracks),
      toggle,
      next: () => {
        advance(playing)
      },
      prev: () => {
        const audio = audioRef.current
        if (audio && audio.currentTime > 3) {
          audio.currentTime = 0
          return
        }
        // After a queued song, "previous" goes back to where the playlist was.
        if (fromQueue && index >= 0) choose(queue[index], playing)
        else if (index > 0) choose(queue[index - 1], playing)
      },
      seek: (s) => {
        if (audioRef.current) audioRef.current.currentTime = s
        setTime(s)
      },
      setVolume,
      setShuffle,
      addToQueue: (track, path, label) => {
        const item: QueuedTrack = { key: `q${++queueKey.current}`, track, sourcePath: path, sourceLabel: label }
        if (!current) {
          // Nothing playing yet: just play it.
          setQueueState([track])
          setSourcePath(path)
          choose(track, true)
          return
        }
        setUpNext((q) => [...q, item])
        setLastAdded(item)
      },
      removeFromQueue: (key) => setUpNext((q) => q.filter((x) => x.key !== key)),
      moveInQueue: (from, to) =>
        setUpNext((q) => {
          if (from === to || from < 0 || to < 0 || from >= q.length || to >= q.length) return q
          const next = [...q]
          const [item] = next.splice(from, 1)
          next.splice(to, 0, item)
          return next
        }),
      clearQueue: () => setUpNext([]),
      playFromQueue: (key) => {
        const item = upNext.find((x) => x.key === key)
        if (!item) return
        setUpNext((q) => q.filter((x) => x.key !== key))
        setQueuedFrom(item.sourcePath)
        choose(item.track, true, true)
      },
      removeFromQueueWhere: (test) => setUpNext((q) => q.filter((x) => !test(x.track))),
      isQueued: (id) => upNext.some((x) => x.track.id === id),
      stop: () => {
        audioRef.current?.pause()
        autoplay.current = false
        setCurrent(undefined)
        setQueueState([])
        setUpNext([])
        setLastAdded(undefined)
        setFromQueue(false)
        setPlaying(false)
      },
    }
  }, [queue, current, playing, time, duration, volume, shuffle, error, sourcePath, upNext, laterInPlaylist, lastAdded, hasNext, hasPrev, index, fromQueue, queuedFrom, choose, advance])

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
          if (!advance(true)) setPlaying(false)
        }}
      />
    </PlayerContext.Provider>
  )
}
