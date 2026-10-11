import { useLocation } from 'react-router-dom'
import { toggleFavorite, useFavorites } from '../lib/favorites'
import { usePlayer, type PlaylistTrack } from '../lib/player'

/** ♥ / ♡ for a demo. Renders nothing unless someone is signed in to Unreleased. */
export function HeartButton({ id, title, className = '', size = 'md' }: { id: string; title?: string; className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const favs = useFavorites()
  if (!favs.enabled) return null
  const on = favs.ids.has(id)
  const text = size === 'lg' ? 'text-3xl' : size === 'sm' ? 'text-base' : 'text-lg'
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={`${on ? 'Remove' : 'Add'} ${title ?? 'song'} ${on ? 'from' : 'to'} favorites`}
      title={on ? 'Remove from favorites' : 'Add to favorites'}
      onClick={(e) => {
        e.stopPropagation()
        void toggleFavorite(id)
      }}
      className={`grid shrink-0 place-items-center leading-none transition-transform hover:scale-110 active:scale-95 ${text} ${on ? 'text-[#ff4d6d]' : 'text-white/60 hover:text-white'} ${className}`}
    >
      <span aria-hidden="true">{on ? '♥' : '♡'}</span>
    </button>
  )
}

/** "+ Queue" for any song on the site. Shows "✓ Queued" once it's in Up next. */
export function QueueButton({
  track,
  label,
  className = '',
  compact = false,
}: {
  track: PlaylistTrack
  /** Where the song comes from, shown in the queue (e.g. "Unreleased"). */
  label: string
  className?: string
  compact?: boolean
}) {
  const player = usePlayer()
  const { pathname } = useLocation()
  const queued = player.isQueued(track.id)
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        player.addToQueue(track, pathname, label)
      }}
      aria-label={`Add ${track.title ?? 'song'} to queue`}
      title="Play after the current song"
      className={`label shrink-0 border whitespace-nowrap uppercase transition-colors ${compact ? 'px-1.5 py-0.5 text-[0.625rem]' : 'px-2 py-1'} ${queued ? 'border-white/40 text-white/70' : 'border-white/40 hover:border-white hover:bg-white hover:text-black'} ${className}`}
    >
      {queued ? '✓ Queued' : '+ Queue'}
    </button>
  )
}
