import { Link, useParams } from 'react-router-dom'
import { MediaPlayer } from '../components/MediaPlayer'
import { PlatformLinks } from '../components/PlatformLinks'
import { PlaceholderNotice, SmartImage } from '../components/ui'
import { formatLabels, getRelease } from '../content/releases'
import { releaseTracks } from '../lib/audio'
import { formatDate } from '../lib/format'
import { usePageMeta } from '../lib/usePageMeta'
import NotFoundPage from './NotFoundPage'
import type { Credit } from '../types/content'

/** Zheng's own entry in a credit list. */
const isMe = (c: Credit) => /zheng taing/i.test(c.name)

/** "My credit: Composer · Lyricist · 1 of 13 writers", shown under the title. */
function MyCreditBadge({ credits }: { credits: Credit[] }) {
  const me = credits.find(isMe)
  if (!me || credits.length < 3) return null
  const writers = new Set(credits.filter((c) => /composer|lyricist|songwriter|writer/i.test(c.role)).map((c) => c.name))
  return (
    <div className="border-accent mt-5 inline-flex flex-wrap items-center gap-x-3 gap-y-1 border-2 px-3.5 py-2.5">
      <span className="label text-accent">My credit</span>
      <span className="font-display text-lg leading-none font-extrabold tracking-[-0.01em]">{me.role}</span>
      {writers.size > 1 && writers.has(me.name) && (
        <span className="label">1 of {writers.size} writers</span>
      )}
    </div>
  )
}

/** Credits grouped by section, with Zheng's own line highlighted. */
function CreditList({ credits }: { credits: Credit[] }) {
  const groups: { title: string; items: Credit[] }[] = []
  for (const c of credits) {
    const title = c.group ?? 'Credits'
    const g = groups.find((x) => x.title === title)
    if (g) g.items.push(c)
    else groups.push({ title, items: [c] })
  }
  return (
    <>
      {groups.map((g) => (
        <div key={g.title}>
          <h2 className="label border-fg mt-8 mb-1 border-b-2 pb-2">{g.title}</h2>
          <ul className="uppercase">
            {g.items.map((c) => {
              const me = isMe(c)
              return (
                <li
                  key={c.name + c.role}
                  className={
                    me
                      ? 'bg-fg text-bg -mx-2.5 my-1 grid grid-cols-[1fr_auto] gap-4 px-2.5 py-2 font-bold'
                      : 'border-line grid grid-cols-[1fr_auto] gap-4 border-b py-2'
                  }
                >
                  <span className="font-bold">
                    {me && <span aria-hidden="true">★ </span>}
                    {c.name}
                    {me && <span className="sr-only"> (me)</span>}
                  </span>
                  <span className="text-right">{c.role}</span>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </>
  )
}

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
          <MyCreditBadge credits={release.credits} />

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

            {release.credits.length > 0 && <CreditList credits={release.credits} />}
          </section>
        </div>
      </div>

      <Link to="/music" className="btn-outline mt-16">
        <span aria-hidden="true">←</span> All music
      </Link>
    </article>
  )
}
