import { Link, useParams } from 'react-router-dom'
import { MediaPlayer } from '../components/MediaPlayer'
import { PlatformLinks } from '../components/PlatformLinks'
import { PlaceholderNotice, SmartImage } from '../components/ui'
import { formatLabels, getRelease } from '../content/releases'
import { releaseTracks } from '../lib/audio'
import { formatDate } from '../lib/format'
import { usePageMeta } from '../lib/usePageMeta'
import NotFoundPage from './NotFoundPage'

export default function ReleaseDetailPage() {
  const { slug = '' } = useParams()
  const release = getRelease(slug)

  usePageMeta({
    title: release ? `${release.title} — ${release.artist}` : 'Release not found',
    description: release?.description ?? 'This release could not be found.',
    path: `/music/${slug}`,
    image: release?.artwork.src,
  })

  if (!release) return <NotFoundPage message="That release could not be found." />
  const tracks = releaseTracks([release])

  return (
    <article className="px-4 pt-12 pb-24 sm:px-8">
      <nav aria-label="Breadcrumb" className="label mb-8">
        <Link to="/music" className="link-underline">
          Music
        </Link>{' '}
        / <span aria-current="page">{release.title}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16">
        <div>
          <SmartImage image={release.artwork} eager sizes="(min-width: 1024px) 45vw, 100vw" />
        </div>

        <div>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="label bg-ink text-signal px-2 py-1">
              {release.status === 'upcoming' ? 'Upcoming' : formatLabels[release.format]}
            </span>
            <span className="label">{formatDate(release.releaseDate)}</span>
            {release.placeholder && <PlaceholderNotice />}
          </div>
          <h1 className="display text-[clamp(3rem,7vw,6.5rem)] normal-case">{release.title}</h1>
          <p className="label mt-3">{release.artist}</p>

          <p className="mt-8 max-w-[60ch] text-[0.9375rem] leading-relaxed">{release.description}</p>

          <div className="mt-8">
            {tracks.length > 0 ? (
              <div data-theme="ink" className="bg-bg text-fg">
                <MediaPlayer tracks={tracks} hideList inline />
              </div>
            ) : (
              <p className="label mb-3">
                {Object.keys(release.platformLinks).length > 0 ? 'Listen on:' : 'Streaming links coming soon.'}
              </p>
            )}
            <PlatformLinks release={release} className="mt-3" />
          </div>

          <section aria-labelledby="credits" className="mt-12">
            <h2 id="credits" className="label border-fg mb-2 border-b-2 pb-2">
              My role
            </h2>
            <p className="uppercase">{release.roles.join(' · ')}</p>

            {release.credits.length > 0 && (
              <>
                <h2 className="label border-fg mt-8 mb-2 border-b-2 pb-2">Credits</h2>
                <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 uppercase">
                  {release.credits.map((c) => (
                    <div key={c.name + c.role} className="contents">
                      <dt className="font-bold">{c.name}</dt>
                      <dd>{c.role}</dd>
                    </div>
                  ))}
                </dl>
              </>
            )}
          </section>
        </div>
      </div>

      <Link to="/music" className="btn-outline mt-16">
        <span aria-hidden="true">←</span> All music
      </Link>
    </article>
  )
}
