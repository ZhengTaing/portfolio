import { useEffect, useRef, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { profile } from '../content/profile'
import { ContactLinks } from './ContactLinks'

const disciplines = [
  { number: '01', area: 'Software · Apps · Games', title: 'Projects', cta: 'Explore projects', to: '/projects' },
  { number: '02', area: 'Songs · Songwriting · Demos', title: 'Sound', cta: 'Listen to my music', to: '/music' },
  { number: '03', area: 'Painting · Drawing · 3D', title: 'Visual Art', cta: 'View visual art', to: '/visual-art' },
]

/**
 * Home hero: the feature photo fills the screen and stays bright and mostly
 * clear, with a short headline in the corner. The site menu overlays the photo
 * (see SiteLayout / Navigation `overlay`). The introduction and the links to
 * each discipline follow in a calm section underneath.
 */
export function HeroSection() {
  const photo = profile.feature
  const heroRef = useRef<HTMLElement>(null)

  // The ambient drift only runs while the hero is on screen and the tab is visible.
  useEffect(() => {
    const hero = heroRef.current
    if (!hero || typeof IntersectionObserver === 'undefined') return
    let onScreen = true
    const update = () => hero.classList.toggle('ambient-paused', !onScreen || document.hidden)
    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting
      update()
    })
    io.observe(hero)
    document.addEventListener('visibilitychange', update)
    return () => {
      io.disconnect()
      document.removeEventListener('visibilitychange', update)
    }
  }, [])

  return (
    <>
      <section
        ref={heroRef}
        aria-labelledby="hero-title"
        data-theme="ink"
        className="text-fg relative isolate flex h-[100svh] min-h-[32rem] flex-col justify-end overflow-hidden bg-[#1a140e] px-4 pb-8 sm:px-8 sm:pb-10"
      >
        <div className="absolute inset-0 -z-20 overflow-hidden motion-safe:animate-[ken-burns_2.6s_cubic-bezier(0.2,0.7,0.2,1)_both]">
        <div className="hero-drift h-full w-full">
        <img
          src={photo.src}
          srcSet={`${photo.srcSmall} 1200w, ${photo.src} 2304w`}
          sizes="100vw"
          alt={photo.alt}
          width={photo.width}
          height={photo.height}
          fetchPriority="high"
          decoding="async"
          className="h-full w-full object-cover object-[60%_50%] md:origin-[0%_60%] md:scale-[1.14] md:object-[50%_50%]"
        />
        </div>
        </div>
        <div aria-hidden="true" className="hero-light pointer-events-none absolute inset-0 -z-10" />
        {/* Light touch: a soft shade at the top for the menu and at the bottom-left for the headline. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,rgb(0_0_0/0.35)_0%,transparent_22%),linear-gradient(to_top,rgb(0_0_0/0.6)_0%,transparent_40%)] md:bg-[linear-gradient(to_bottom,rgb(0_0_0/0.3)_0%,transparent_20%),radial-gradient(ellipse_at_0%_100%,rgb(0_0_0/0.55)_0%,transparent_50%)]"
        />

        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="label mb-3 text-white/85 motion-safe:animate-[fade_1s_ease-out_.5s_both]">
              {profile.name} — {profile.location}
            </p>
            <h1
              id="hero-title"
              className="display text-[clamp(2.25rem,4.8vw,4.5rem)] [text-shadow:0_2px_24px_rgb(0_0_0/0.35)]"
            >
              <span className="sr-only">{profile.name}: </span>
              <span className="line-mask">
                <span style={{ '--line-delay': '250ms' } as CSSProperties}>Software,</span>
              </span>
              <span className="line-mask">
                <span style={{ '--line-delay': '400ms' } as CSSProperties}>Sound &amp; Image</span>
              </span>
            </h1>
          </div>
          <a
            href="#intro"
            className="label hidden shrink-0 items-center gap-2 text-white/85 hover:text-white motion-safe:animate-[fade_1s_ease-out_1s_both] sm:flex"
          >
            Scroll <span aria-hidden="true" className="inline-block motion-safe:animate-[nudge_1.8s_ease-in-out_infinite]">↓</span>
          </a>
        </div>
      </section>

      <section id="intro" aria-label="Introduction" className="px-4 py-20 sm:px-8 md:py-28">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-20">
          <div data-reveal>
            <p className="font-display text-[clamp(1.5rem,2.6vw,2.25rem)] leading-tight font-semibold tracking-[-0.01em]">
              {profile.introduction}
            </p>
            <p className="label text-muted mt-5">{profile.headline}</p>
          </div>

          <ul className="border-fg border-t-[3px]" data-reveal-stagger>
            {disciplines.map((d) => (
              <li key={d.to} className="border-line border-b">
                <Link to={d.to} className="group grid grid-cols-[2.5rem_1fr_auto] items-center gap-4 py-5 transition-[padding] duration-300 hover:pl-2">
                  <span className="label text-muted">{d.number}</span>
                  <span>
                    <strong className="font-display group-hover:text-accent block text-[clamp(1.5rem,2.6vw,2.25rem)] leading-none font-extrabold tracking-[-0.03em] uppercase transition-colors">
                      {d.title}
                    </strong>
                    <span className="label text-muted mt-1.5 block">{d.area}</span>
                  </span>
                  <span className="label group-hover:text-accent transition-colors">
                    <span className="hidden sm:inline">{d.cta} </span>
                    <span aria-hidden="true" className="arrow">→</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-14 flex flex-wrap items-center gap-x-6 gap-y-3" data-reveal>
          <span className="label text-muted">Elsewhere</span>
          <ContactLinks />
        </div>
      </section>
    </>
  )
}
