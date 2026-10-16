import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { usePlayer, type PlaylistTrack } from './player'

export type { PlaylistTrack } from './player'

/**
 * A page's view of the site-wide player for one list of tracks.
 *
 * Until something from this list is played, the first track is shown "cued"
 * (paused). Pressing play hands the list to the global player, which keeps
 * going while the visitor browses other pages. If the list changes while it's
 * the active queue (e.g. filters), the queue is updated without interrupting.
 */
export function usePlaylist<T extends PlaylistTrack>(tracks: T[]) {
  const player = usePlayer()
  const { pathname } = useLocation()
  const [cuedId, setCuedId] = useState<string | undefined>(tracks[0]?.id)

  // The link is part of the key, so switching a song's version updates the queue too.
  const ids = tracks.map((t) => `${t.id} ${t.audioUrl}`).join('|')
  const active = Boolean(player.current && tracks.some((t) => t.id === player.current!.id))
  const ownsQueue = player.queue.length > 0 && player.queue.some((q) => tracks.some((t) => t.id === q.id))

  // Keep the global queue in step with this list (filters) while it's playing from here.
  useEffect(() => {
    if (ownsQueue && player.queue.map((t) => `${t.id} ${t.audioUrl}`).join('|') !== ids) player.setQueue(tracks)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids, ownsQueue])

  const cued = tracks.find((t) => t.id === cuedId) ?? tracks[0]
  const track = (active ? (player.current as T) : cued) as T | undefined
  const index = track ? tracks.findIndex((t) => t.id === track.id) : -1

  const playTrack = (id: string) => {
    if (active && player.current?.id === id) {
      player.toggle()
      return
    }
    setCuedId(id)
    player.play(tracks, id, pathname)
  }

  /** Play `id` from a list that differs from `tracks` (e.g. a version was just chosen). */
  const playFrom = (list: T[], id: string) => {
    setCuedId(id)
    player.play(list, id, pathname)
  }

  return {
    track,
    playFrom,
    index,
    active,
    playing: active && player.playing,
    time: active ? player.time : 0,
    duration: active ? player.duration : 0,
    volume: player.volume,
    setVolume: player.setVolume,
    error: active && player.error,
    shuffle: player.shuffle,
    setShuffle: player.setShuffle,
    hasNext: active ? player.hasNext : index < tracks.length - 1,
    hasPrev: active ? player.hasPrev : index > 0,
    toggle: () => (active ? player.toggle() : track && playTrack(track.id)),
    playTrack,
    next: () => {
      if (active) player.next()
      else if (index < tracks.length - 1) setCuedId(tracks[index + 1].id)
    },
    prev: () => {
      if (active) player.prev()
      else if (index > 0) setCuedId(tracks[index - 1].id)
    },
    seek: (s: number) => active && player.seek(s),
  }
}

export function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}
