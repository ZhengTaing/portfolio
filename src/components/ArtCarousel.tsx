import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { artworkCategories } from '../content/artworks'
import type { Artwork } from '../types/content'

/**
 * Horizontal artwork carousel. Native scroll-snap handles touch swiping and
 * trackpads; the arrow buttons step one slide at a time. Each slide opens the
 * piece in the Visual Art viewer.
 */
export function ArtCarousel({ items, label = 'Featured artwork' }: { items: Artwork[]; label?: string }) {
  const trackRef = useRef<HTMLUListElement>(null)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)

  const update = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    setAtStart(el.scrollLeft <= 4)
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4)
  }, [])

  useEffect(() => {
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [update])

  function step(direction: 1 | -1) {
    const el = trackRef.current
    if (!el) return
    const slides = [...el.children] as HTMLElement[]
    const left = el.scrollLeft
    // Find the next slide edge beyond the current scroll position.
    const target =
      direction === 1
        ? slides.find((s) => s.offsetLeft - el.offsetLeft > left + 8)
        : [...slides].reverse().find((s) => s.offsetLeft - el.offsetLeft < left - 8)
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollTo({ left: target ? target.offsetLeft - el.offsetLeft : direction === 1 ? el.scrollWidth : 0, behavior: reduce ? 'auto' : 'smooth' })
  }

  const categoryLabel = (a: Artwork) => artworkCategories.find((c) => c.id === a.category)?.label

  return (
    <section aria-roledescription="carousel" aria-label={label}>
      <ul
        ref={trackRef}
        onScroll={update}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-4 [scrollbar-width:thin]"
      >
        {items.map((a, i) => (
          <li
            key={a.id}
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${items.length}: ${a.title}`}
            className="shrink-0 snap-start"
          >
            <Link to={`/visual-art?image=${a.id}`} className="group block">
              <div className="bg-surface h-[18rem] max-w-[85vw] overflow-hidden sm:h-[24rem] lg:h-[28rem]" style={{ aspectRatio: `${a.width} / ${a.height}` }}>
                <img
                  src={a.thumbnailUrl}
                  alt={a.altText}
                  width={a.width}
                  height={a.height}
                  loading={i < 3 ? 'eager' : 'lazy'}
                  decoding="async"
                  className="media-zoom h-full w-full object-cover"
                />
              </div>
              <span className="label mt-2 flex w-0 min-w-full justify-between gap-3">
                <span className="truncate"><span className="link-draw">{a.title}</span></span>
                <span className="text-muted shrink-0">{categoryLabel(a)}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => step(-1)}
          disabled={atStart}
          aria-label="Previous artwork"
          className="border-fg hover:bg-fg hover:text-bg grid size-11 place-items-center border-2 text-lg transition-colors disabled:pointer-events-none disabled:opacity-30"
        >
          ←
        </button>
        <button
          type="button"
          onClick={() => step(1)}
          disabled={atEnd}
          aria-label="Next artwork"
          className="border-fg hover:bg-fg hover:text-bg grid size-11 place-items-center border-2 text-lg transition-colors disabled:pointer-events-none disabled:opacity-30"
        >
          →
        </button>
      </div>
    </section>
  )
}
