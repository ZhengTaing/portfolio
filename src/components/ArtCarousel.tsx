import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { artworkCategories } from '../content/artworks'
import { prefersReducedMotion } from '../lib/motion'
import { hapticTick } from '../lib/tactile'
import type { Artwork } from '../types/content'

/** Glide speed for the autoplay slideshow, in pixels per second. */
const GLIDE_SPEED = 28
/** How long the slideshow waits after someone swipes, clicks or hovers away. */
const RESUME_AFTER = 2500

/**
 * Horizontal artwork carousel. Native scroll-snap handles touch swiping and
 * trackpads; the arrow buttons step one slide at a time. Each slide opens the
 * piece in the Visual Art viewer.
 *
 * With `autoplay`, the row glides slowly and endlessly (the slides are repeated
 * once so the loop has no seam). It pauses while the pointer is over it, while
 * it has keyboard focus, during a swipe, when it's off screen or the tab is
 * hidden, and never runs for visitors who prefer reduced motion.
 */
export function ArtCarousel({ items, label = 'Featured artwork', autoplay = false }: { items: Artwork[]; label?: string; autoplay?: boolean }) {
  const trackRef = useRef<HTMLUListElement>(null)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)
  const [gliding, setGliding] = useState(false)
  const loop = autoplay && items.length > 1
  const pauseRef = useRef<(ms?: number) => void>(() => {})

  const update = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    if (loop) return
    setAtStart(el.scrollLeft <= 4)
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4)
  }, [loop])

  useEffect(() => {
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [update])

  // When a swipe settles on a new slide: a tiny press on that slide and, where
  // the device supports it, one light haptic tick.
  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    let touched = false
    let settled = 0
    let timer = 0
    const slideIndex = () => {
      const slides = [...el.children] as HTMLElement[]
      let best = 0
      slides.forEach((s, i) => {
        if (Math.abs(s.offsetLeft - el.offsetLeft - el.scrollLeft) < Math.abs(slides[best].offsetLeft - el.offsetLeft - el.scrollLeft)) best = i
      })
      return best
    }
    const slideAt = () => slideIndex() % items.length
    const onSettle = () => {
      const i = slideAt()
      if (i === settled) return
      settled = i
      if (!touched) return
      touched = false
      hapticTick()
      const slide = el.children[slideIndex()] as HTMLElement | undefined
      if (slide && !prefersReducedMotion()) {
        slide.classList.remove('snap-settle')
        void slide.offsetWidth
        slide.classList.add('snap-settle')
      }
    }
    const onTouch = () => (touched = true)
    // scrollend where supported, otherwise a short pause in scrolling.
    const hasScrollEnd = 'onscrollend' in window
    const onScroll = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(onSettle, 140)
    }
    el.addEventListener('touchstart', onTouch, { passive: true })
    if (hasScrollEnd) el.addEventListener('scrollend', onSettle)
    else el.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.clearTimeout(timer)
      el.removeEventListener('touchstart', onTouch)
      el.removeEventListener('scrollend', onSettle)
      el.removeEventListener('scroll', onScroll)
    }
  }, [items])

  // Autoplay: a continuous glide driven by requestAnimationFrame.
  useEffect(() => {
    const el = trackRef.current
    if (!el || !loop || prefersReducedMotion() || typeof IntersectionObserver === 'undefined') return
    let frame = 0
    let last = 0
    let pos = el.scrollLeft
    let onScreen = false
    let hovering = false
    let focused = false
    let pausedUntil = 0

    // Width of one full set of slides: where the first repeated slide starts.
    const setWidth = () => {
      const first = el.children[0] as HTMLElement | undefined
      const repeat = el.children[items.length] as HTMLElement | undefined
      return first && repeat ? repeat.offsetLeft - first.offsetLeft : 0
    }
    const canRun = () => onScreen && !hovering && !focused && !document.hidden && performance.now() >= pausedUntil

    const tick = (t: number) => {
      frame = requestAnimationFrame(tick)
      const running = canRun()
      setGliding((g) => (g === running ? g : running))
      if (!running) {
        last = 0
        pos = el.scrollLeft
        return
      }
      const dt = last ? Math.min(64, t - last) : 0
      last = t
      const w = setWidth()
      pos += (GLIDE_SPEED * dt) / 1000
      if (w > 0 && pos >= w) pos -= w
      el.scrollTo({ left: pos, behavior: 'instant' })
    }

    const pause = (ms = RESUME_AFTER) => {
      pausedUntil = performance.now() + ms
    }
    pauseRef.current = pause
    const io = new IntersectionObserver(([e]) => (onScreen = e.isIntersecting))
    io.observe(el)
    const enter = () => (hovering = true)
    const leave = () => {
      hovering = false
      pause(800)
    }
    const focusIn = () => (focused = el.contains(document.activeElement))
    const focusOut = () => setTimeout(focusIn)
    const touch = () => pause(4000)
    // A swipe that runs past the end jumps back by one set, which looks identical.
    const wrap = () => {
      const w = setWidth()
      if (w > 0 && el.scrollLeft >= w) el.scrollTo({ left: el.scrollLeft - w, behavior: 'instant' })
    }
    el.addEventListener('pointerenter', enter)
    el.addEventListener('pointerleave', leave)
    el.addEventListener('focusin', focusIn)
    el.addEventListener('focusout', focusOut)
    el.addEventListener('touchstart', touch, { passive: true })
    el.addEventListener('wheel', touch, { passive: true })
    el.addEventListener('scrollend', wrap)
    frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      io.disconnect()
      el.removeEventListener('pointerenter', enter)
      el.removeEventListener('pointerleave', leave)
      el.removeEventListener('focusin', focusIn)
      el.removeEventListener('focusout', focusOut)
      el.removeEventListener('touchstart', touch)
      el.removeEventListener('wheel', touch)
      el.removeEventListener('scrollend', wrap)
      pauseRef.current = () => {}
      setGliding(false)
    }
  }, [loop, items.length])

  function step(direction: 1 | -1) {
    const el = trackRef.current
    if (!el) return
    pauseRef.current(5000)
    const slides = [...el.children] as HTMLElement[]
    let left = el.scrollLeft
    // In the looping slideshow, stepping back from the very start jumps to the
    // identical spot in the repeated set first, so there is always a previous slide.
    if (loop && direction === -1 && left < 8) {
      const repeat = slides[items.length]
      if (repeat) {
        left += repeat.offsetLeft - slides[0].offsetLeft
        el.scrollTo({ left, behavior: 'instant' })
      }
    }
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
        className={`flex gap-4 overflow-x-auto pb-4 [scrollbar-width:thin] ${gliding ? 'snap-none' : loop ? 'pointer-coarse:snap-x pointer-coarse:snap-mandatory' : 'snap-x snap-mandatory scroll-smooth'} ${loop ? 'art-glide' : ''}`}
      >
        {(loop ? [...items, ...items] : items).map((a, n) => {
          const i = n % items.length
          const repeat = n >= items.length
          return (
          <li
            key={repeat ? `${a.id}-again` : a.id}
            aria-roledescription={repeat ? undefined : 'slide'}
            aria-label={repeat ? undefined : `${i + 1} of ${items.length}: ${a.title}`}
            aria-hidden={repeat || undefined}
            inert={repeat || undefined}
            className="shrink-0 snap-start"
          >
            <Link to={`/visual-art?image=${a.id}`} className="group block">
              <div className="bg-surface h-[18rem] max-w-[85vw] overflow-hidden sm:h-[24rem] lg:h-[28rem]" style={{ aspectRatio: `${a.width} / ${a.height}` }}>
                <img
                  src={a.thumbnailUrl}
                  alt={a.altText}
                  width={a.width}
                  height={a.height}
                  loading={n < 3 ? 'eager' : 'lazy'}
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
          )
        })}
      </ul>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => step(-1)}
          disabled={!loop && atStart}
          aria-label="Previous artwork"
          className="border-fg hover:bg-fg hover:text-bg grid size-11 place-items-center border-2 text-lg transition-colors disabled:pointer-events-none disabled:opacity-30"
        >
          ←
        </button>
        <button
          type="button"
          onClick={() => step(1)}
          disabled={!loop && atEnd}
          aria-label="Next artwork"
          className="border-fg hover:bg-fg hover:text-bg grid size-11 place-items-center border-2 text-lg transition-colors disabled:pointer-events-none disabled:opacity-30"
        >
          →
        </button>
      </div>
    </section>
  )
}
