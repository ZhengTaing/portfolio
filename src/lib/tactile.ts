import { useEffect } from 'react'
import { prefersReducedMotion } from './motion'

/**
 * Light haptic tick for discrete moments (a carousel settling on a slide), never
 * for continuous scrolling. Only devices whose browser supports the Vibration
 * API do anything (Android Chrome and Firefox; iPhone Safari does not), and only
 * after the visitor has touched the page and when they allow motion.
 */
let lastTick = 0
export function hapticTick() {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return
  if (prefersReducedMotion() || !window.matchMedia?.('(pointer: coarse)').matches) return
  if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return
  const now = performance.now()
  if (now - lastTick < 180) return
  lastTick = now
  navigator.vibrate(8)
}

const clamp = (v: number, max: number) => Math.max(-max, Math.min(max, v))

/**
 * Subtle "tactile" scrolling, mounted once in the layout:
 * - cards (`.card-lift`) trail the scroll by a few pixels and settle back,
 *   through the `--scroll-nudge` variable (uses `translate`, so hover lifts
 *   still work);
 * - elements with `data-parallax="0.1"` drift at that fraction of the scroll;
 * - each themed section sends one soft ripple from its top edge the first time
 *   it scrolls into view.
 * Nothing runs with reduced motion, and the loop sleeps when scrolling stops.
 */
export function useTactileScroll(pathname: string) {
  useEffect(() => {
    if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') return
    const root = document.documentElement
    const main = document.getElementById('main')
    if (!main) return

    // Parallax targets that are on screen.
    const visible = new Set<HTMLElement>()
    const parallaxIo = new IntersectionObserver(
      (entries) => entries.forEach((e) => (e.isIntersecting ? visible.add(e.target as HTMLElement) : visible.delete(e.target as HTMLElement))),
      { rootMargin: '20% 0px' },
    )
    // Section ripples, once per section.
    const rippleIo = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return
          e.target.classList.add('section-ripple')
          rippleIo.unobserve(e.target)
        }),
      { rootMargin: '0px 0px -30% 0px' },
    )

    const scan = () => {
      document.querySelectorAll<HTMLElement>('[data-parallax]').forEach((el) => parallaxIo.observe(el))
      main.querySelectorAll<HTMLElement>(':scope section[data-theme]:not(.section-ripple)').forEach((el) => {
        // The first screen doesn't need announcing.
        if (el.getBoundingClientRect().top > window.innerHeight * 0.5) rippleIo.observe(el)
      })
    }
    // Pages load lazily, so look again shortly after a route change.
    scan()
    const rescan = window.setTimeout(scan, 600)

    let lastY = window.scrollY
    let lastT = performance.now()
    let nudge = 0
    let target = 0
    let frame = 0

    const update = () => {
      frame = 0
      // Ease toward the target, and let the target relax back to zero.
      nudge += (target - nudge) * 0.18
      target *= 0.85
      if (Math.abs(nudge) < 0.05 && Math.abs(target) < 0.05) nudge = target = 0
      root.style.setProperty('--scroll-nudge', `${nudge.toFixed(2)}px`)

      const vh = window.innerHeight
      visible.forEach((el) => {
        const speed = Number(el.dataset.parallax) || 0
        const r = el.getBoundingClientRect()
        const fromCentre = r.top + r.height / 2 - vh / 2
        el.style.translate = `0 ${clamp(-fromCentre * speed, 120).toFixed(1)}px`
      })

      if (nudge !== 0 || target !== 0) frame = requestAnimationFrame(update)
    }

    const onScroll = () => {
      const now = performance.now()
      const dt = Math.max(16, now - lastT)
      const velocity = (window.scrollY - lastY) / dt // px per ms
      lastY = window.scrollY
      lastT = now
      // Cards lag a little behind the direction of travel: at most 3px.
      target = clamp(-velocity * 2.2, 3)
      if (!frame) frame = requestAnimationFrame(update)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    update()
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.clearTimeout(rescan)
      cancelAnimationFrame(frame)
      parallaxIo.disconnect()
      rippleIo.disconnect()
      root.style.removeProperty('--scroll-nudge')
      visible.forEach((el) => (el.style.translate = ''))
    }
  }, [pathname])
}
