import { Link } from 'react-router-dom'
import { useState } from 'react'
import { CoverBackdrop, MediaPlayer, type PlayerTrack } from '../components/MediaPlayer'
import { PlatformLinks } from '../components/PlatformLinks'
import { ContactLinks } from '../components/ContactLinks'
import { LockIcon } from '../components/icons'
import { MusicReleaseCard } from '../components/MusicReleaseCard'
import { ExternalLink, PlaceholderNotice, SectionHeader, SmartImage } from '../components/ui'
import { profile } from '../content/profile'
import { artistLinks, formatLabels, releases } from '../content/releases'
import { releaseTracks } from '../lib/audio'
import { formatDate } from '../lib/format'
import { usePageMeta } from '../lib/usePageMeta'

const musicPlatforms = new Set(['spotify', 'apple-music', 'soundcloud', 'youtube'])

export default function MusicPage() {
  usePageMeta({
    title: 'Music',
    description: 'Releases, songwriting and production credits by Zheng Taing. Listen here or on your streaming platform.',
    path: '/music',
  })
  const released = releases.filter((r) => r.status === 'released')
  const upcoming = releases.filter((r) => r.status === 'upcoming')
  const lead = released.find((r) => r.featured) ?? released[0]
  const artistProfiles = profile.socialLinks.filter((l) => musicPlatforms.has(l.platform))
  // Own songs first, then songs written for others.
  const tracks = releaseTracks([
    ...released.filter((r) => r.format !== 'writing'),
    ...released.filter((r) => r.format === 'writing'),
  ])
  // The song playing in the Listen player themes the whole page background.
  const [current, setCurrent] = useState<PlayerTrack | undefined>(tracks[0])

  return (
    <div data-theme="ink" className="bg-bg text-fg relative isolate overflow-hidden px-4 pt-12 pb-24 [clip-path:inset(0)] sm:px-8">
      <CoverBackdrop track={current} fixed />
      <div className="text-white">
        <SectionHeader as="h1" number="02" title="Sonic Structures" />
      </div>

      <div className="relative z-10 grid gap-12 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <p className="font-display text-[clamp(1.375rem,2.6vw,2.25rem)] leading-tight font-semibold tracking-[-0.01em]">
            Singer-songwriter. I release my own music and write songs for other artists.
          </p>
          {artistProfiles.length > 0 && (
            <div className="mt-8">
              <p className="label mb-2">Artist profiles</p>
              <ContactLinks links={artistProfiles} />
            </div>
          )}
        </div>

        {lead && (
          <section aria-labelledby="lead-title">
            <div className="grid grid-cols-[6rem_1fr] items-end gap-4 sm:grid-cols-[8rem_1fr]">
              <SmartImage image={lead.artwork} eager />
              <div>
                <p className="label">Latest · {formatLabels[lead.format]}</p>
                <h2 id="lead-title" className="font-display mt-1 text-3xl leading-none font-extrabold tracking-[-0.02em]">
                  <Link to={`/music/${lead.slug}`} className="link-draw">
                    {lead.title}
                  </Link>
                </h2>
                <p className="label mt-1">{formatDate(lead.releaseDate)}</p>
              </div>
            </div>
            <PlatformLinks release={lead} className="mt-4" />
          </section>
        )}
      </div>

      <section
        aria-labelledby="listen-title"
        data-reveal
        data-theme="ink"
        className="text-fg relative isolate z-10 mt-16 overflow-hidden border border-white/15 bg-black/30 backdrop-blur-sm"
      >
        {tracks.length > 0 ? (
          <MediaPlayer
            tracks={tracks}
            listLabel="Released songs"
            variant="showcase"
            backdrop={false}
            onTrackChange={setCurrent}
            heading={
              <h2 id="listen-title" className="label text-accent mb-5">
                Listen
              </h2>
            }
          />
        ) : (
          <p className="max-w-xl p-5 text-[0.9375rem] leading-relaxed sm:p-8">
            <span id="listen-title" className="sr-only">Listen</span>
            Full songs are coming to this player soon. Until then, listen on{' '}
            <ExternalLink href={artistLinks.spotify} className="link-underline">
              Spotify
            </ExternalLink>{' '}
            or{' '}
            <ExternalLink href={artistLinks.appleMusic} className="link-underline">
              Apple Music
            </ExternalLink>
            .
          </p>
        )}
      </section>

      <section aria-labelledby="releases-title" className="relative z-10 mt-24">
        <div className="border-fg mb-8 flex items-baseline justify-between border-b-2 pb-3">
          <h2 id="releases-title" className="display text-4xl sm:text-5xl">
            Released
          </h2>
        </div>
        <h3 className="label mb-4">My releases · Artist</h3>
        <ul data-reveal-stagger className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {[...released, ...upcoming]
            .filter((r) => r.format !== 'writing')
            .map((r) => (
              <li key={r.id}>
                <MusicReleaseCard release={r} />
              </li>
            ))}
        </ul>
        {released.some((r) => r.format === 'writing') && (
          <>
            <div className="mt-14 mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="label">Written for other artists · Songwriting credit only</h3>
              {released.some((r) => r.format === 'writing' && r.placeholder) && (
                <PlaceholderNotice>Links pending</PlaceholderNotice>
              )}
            </div>
            <ul data-reveal-stagger className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
              {released
                .filter((r) => r.format === 'writing')
                .map((r) => (
                  <li key={r.id}>
                    <MusicReleaseCard release={r} />
                  </li>
                ))}
            </ul>
          </>
        )}
      </section>

      <section aria-labelledby="unreleased-title" data-reveal className="relative z-10 mt-20">
        <div className="border-fg mb-8 border-b-2 pb-3">
          <h2 id="unreleased-title" className="display text-4xl sm:text-5xl">
            Unreleased
          </h2>
        </div>
        <Link
          to="/music/unreleased"
          data-theme="ink"
          className="group text-fg grid gap-6 border border-white/15 bg-black/40 p-6 backdrop-blur-sm transition-colors hover:bg-black/55 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-8"
        >
          <span aria-hidden="true" className="border-signal text-signal grid size-14 place-items-center border-2 text-2xl">
            <LockIcon />
          </span>
          <span>
            <span className="font-display block text-2xl leading-none font-extrabold tracking-[-0.02em] uppercase"><span className="link-draw">
              Demos &amp; works in progress
            </span></span>
            <span className="label mt-2 block text-[#c9c9c9]">Password protected · For collaborators</span>
          </span>
          <span className="btn-outline justify-self-start">
            Enter password <span aria-hidden="true">→</span>
          </span>
        </Link>
      </section>

      <section aria-labelledby="credits-title" data-reveal className="relative z-10 mt-20">
        <div className="border-fg mb-4 border-b-2 pb-3">
          <h2 id="credits-title" className="display text-4xl sm:text-5xl">
            Credits
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] border-collapse text-left uppercase">
            <thead>
              <tr className="label">
                <th scope="col" className="py-3 pr-4 font-normal">Title</th>
                <th scope="col" className="py-3 pr-4 font-normal">Artist</th>
                <th scope="col" className="py-3 pr-4 font-normal">Role</th>
                <th scope="col" className="py-3 font-normal">Year</th>
              </tr>
            </thead>
            <tbody>
              {released.map((r) => (
                <tr key={r.id} className="border-fg border-t">
                  <td className="py-3 pr-4">
                    <Link to={`/music/${r.slug}`} className="link-underline">
                      {r.title}
                    </Link>
                  </td>
                  <td className="py-3 pr-4">{r.artist}</td>
                  <td className="py-3 pr-4">{r.roles.join(', ')}</td>
                  <td className="py-3">{r.releaseDate?.slice(0, 4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div aria-hidden="true" data-word="Sound" className="ghost-word display pointer-events-none absolute hidden md:block top-[18rem] -right-[0.1em] text-[26vw] whitespace-nowrap text-white/[0.05]" />
    </div>
  )
}
