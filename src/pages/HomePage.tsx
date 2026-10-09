import { Link } from 'react-router-dom'
import { HeroSection } from '../components/HeroSection'
import { ArtCarousel } from '../components/ArtCarousel'
import { MediaPlayer } from '../components/MediaPlayer'
import { ProjectRow } from '../components/ProjectCard'
import { SectionHeader } from '../components/ui'
import { featuredArtworks } from '../content/artworks'
import { profile } from '../content/profile'
import { featuredProjects } from '../content/projects'
import { releases as allReleases } from '../content/releases'
import { releaseTracks } from '../lib/audio'
import { usePageMeta } from '../lib/usePageMeta'

export default function HomePage() {
  usePageMeta({
    description: `${profile.name}: ${profile.headline}. ${profile.introduction}`,
    path: '/',
  })
  const projects = featuredProjects()
  const artworks = featuredArtworks()
  // Own songs first, then songs written for others (same player as the Music page).
  const tracks = releaseTracks([
    ...allReleases.filter((r) => r.status === 'released' && r.format !== 'writing'),
    ...allReleases.filter((r) => r.status === 'released' && r.format === 'writing'),
  ])

  return (
    <>
      <HeroSection />

      <section data-theme="ink" aria-labelledby="home-work" className="bg-bg text-fg px-4 py-20 sm:px-8 md:py-28">
        <SectionHeader number="01" title={<span id="home-work">Selected Works</span>} />
        <div data-reveal-stagger>
          {projects.map((p) => (
            <ProjectRow key={p.id} project={p} />
          ))}
        </div>
        <Link to="/projects" className="btn-outline mt-10">
          All projects <span aria-hidden="true">→</span>
        </Link>
      </section>

      <section
        data-theme="signal"
        aria-labelledby="home-sound"
        className="bg-bg text-fg relative overflow-hidden px-4 py-20 sm:px-8 md:py-28"
      >
        <div className="text-white">
          <SectionHeader number="02" title={<span id="home-sound">Sonic Structures</span>} />
        </div>
        <div data-reveal className="relative z-10 grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-12">
          <div>
            <p className="font-display mb-10 text-[clamp(1.375rem,2.4vw,2.125rem)] leading-tight font-semibold tracking-[-0.01em]">
              Singer-songwriter, releasing my own music and writing songs for other artists.
            </p>
            <Link to="/music" className="btn-outline">
              All music &amp; credits <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div data-theme="ink" className="bg-bg text-fg self-start p-5 sm:p-6">
            {tracks.length > 0 ? (
              <MediaPlayer tracks={tracks} listLabel="Songs" inline />
            ) : (
              <p className="text-sm">Songs are coming to this player soon.</p>
            )}
          </div>
        </div>
        <div aria-hidden="true" data-word="Sound" className="ghost-word display pointer-events-none absolute -bottom-[0.18em] left-4 text-[26vw] whitespace-nowrap text-white/15" />
      </section>

      <section data-theme="graphite" aria-labelledby="home-lens" className="bg-bg text-fg px-4 py-20 sm:px-8 md:py-28">
        <SectionHeader
          number="03"
          title={<span id="home-lens">Visual Art</span>}
          aside="Painting, life drawing, observational drawing and 3D environments."
        />
        <div data-reveal>
          <ArtCarousel items={artworks} />
        </div>
        <Link to="/visual-art" className="btn-outline mt-10">
          View visual art <span aria-hidden="true">→</span>
        </Link>
      </section>
    </>
  )
}
