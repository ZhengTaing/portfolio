import { Link } from 'react-router-dom'
import { formatLabels } from '../content/releases'
import type { MusicRelease } from '../types/content'
import { SmartImage } from './ui'

/** Tracklist-style row: catalogue number, title, format and date. */
export function MusicReleaseRow({ release, index }: { release: MusicRelease; index: number }) {
  return (
    <li className="group border-line relative grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 border-b-2 py-4 sm:grid-cols-[1fr_auto_auto]">
      <Link to={`/music/${release.slug}`} className="after:absolute after:inset-0 group-hover:underline">
        <span className="uppercase">ZT-{String(index + 1).padStart(3, '0')}:</span> {release.title}
      </Link>
      <span className="label bg-surface text-bg px-1.5 py-0.5">
        {release.status === 'upcoming' ? 'Upcoming' : formatLabels[release.format]}
      </span>
      <span className="label col-span-2 sm:col-span-1">{release.releaseDate?.slice(0, 4) ?? 'TBA'}</span>
    </li>
  )
}

/** Artwork-led card used on the Music page grid. */
export function MusicReleaseCard({ release }: { release: MusicRelease }) {
  return (
    <article className="group relative">
      <div className="overflow-hidden">
        <SmartImage
          image={release.artwork}
          sizes="(min-width: 1024px) 25vw, 50vw"
          className="transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-3">
        <h3 className="font-display text-xl leading-none font-extrabold tracking-[-0.02em]">
          <Link to={`/music/${release.slug}`} className="after:absolute after:inset-0 group-hover:underline">
            {release.title}
          </Link>
        </h3>
        <span className="label shrink-0">{release.status === 'upcoming' ? 'Upcoming' : formatLabels[release.format]}</span>
      </div>
      <p className="label mt-1">
        {release.artist} · {release.roles.join(' · ')}
      </p>
    </article>
  )
}
