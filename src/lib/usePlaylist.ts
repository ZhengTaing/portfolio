import { useEffect, useRef, useState, type AudioHTMLAttributes, type RefObject } from 'react'

export interface PlaylistTrack {
  id: string
  audioUrl: string
}

/**
 * Shared audio logic for the media players: one <audio> element playing
 * through a list of tracks. The current track is remembered by id, so the list
 * can change (e.g. when filters change) without interrupting what's playing;
 * next / previous then move through the new list.
 */
export function usePlaylist<T extends PlaylistTrack>(tracks: T[]) {
  const audioRef = useRef<HTMLAudioElement>(null) as RefObject<HTMLAudioElement>
  const [currentId, setCurrentId] = useState<string | null>(tracks[0]?.id ?? null)
  const [current, setCurrent] = useState<T | undefined>(tracks[0])
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [error, setError] = useState(false)
  const [shuffle, setShuffle] = useState(false)
  const autoplay = useRef(false)

  // If nothing has been chosen yet (or the list was empty), start at the top.
  if (current === undefined && tracks[0]) {
    setCurrent(tracks[0])
    setCurrentId(tracks[0].id)
  }

  const index = tracks.findIndex((t) => t.id === currentId)
  const track = current

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !track) return
    setTime(0)
    setDuration(0)
    setError(false)
    audio.load()
    if (autoplay.current) audio.play().catch(() => setPlaying(false))
    // Only reload when the audio file itself changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track?.audioUrl])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  function choose(t: T, play: boolean) {
    autoplay.current = play
    setCurrent(t)
    setCurrentId(t.id)
  }

  function toggle() {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      autoplay.current = true
      audio.play().catch(() => setPlaying(false))
    } else {
      autoplay.current = false
      audio.pause()
    }
  }

  /** Play (or pause, if it's already playing) a specific track. */
  function playTrack(id: string) {
    if (id === currentId) {
      toggle()
      return
    }
    const t = tracks.find((x) => x.id === id)
    if (t) choose(t, true)
  }

  function nextTrack(): T | undefined {
    if (tracks.length === 0) return undefined
    if (shuffle && tracks.length > 1) {
      const others = tracks.filter((t) => t.id !== currentId)
      return others[Math.floor(Math.random() * others.length)]
    }
    // When the current song isn't in the list (filtered out), start from the top.
    return index === -1 ? tracks[0] : tracks[index + 1]
  }

  const hasNext = Boolean(nextTrack()) && tracks.length > 0 && (shuffle || index < tracks.length - 1)
  const hasPrev = index > 0

  function next() {
    const t = nextTrack()
    if (t) choose(t, playing)
  }

  function prev() {
    const audio = audioRef.current
    // Like most players: restart the song first, then go back.
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0
      return
    }
    if (hasPrev) choose(tracks[index - 1], playing)
  }

  function seek(value: number) {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = value
    setTime(value)
  }

  const audioProps: AudioHTMLAttributes<HTMLAudioElement> & { ref: RefObject<HTMLAudioElement> } = {
    ref: audioRef,
    src: track?.audioUrl,
    preload: 'metadata',
    onPlay: () => setPlaying(true),
    onPause: () => setPlaying(false),
    onTimeUpdate: (e) => setTime(e.currentTarget.currentTime),
    onLoadedMetadata: (e) => setDuration(e.currentTarget.duration),
    onDurationChange: (e) => setDuration(e.currentTarget.duration),
    onError: () => {
      setError(true)
      setPlaying(false)
    },
    onEnded: () => {
      const t = nextTrack()
      if (t && (shuffle || index < tracks.length - 1)) choose(t, true)
      else setPlaying(false)
    },
  }

  return {
    audioProps,
    track,
    index,
    playing,
    time,
    duration,
    volume,
    setVolume,
    error,
    shuffle,
    setShuffle,
    hasNext,
    hasPrev,
    toggle,
    playTrack,
    next,
    prev,
    seek,
  }
}

export function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}
