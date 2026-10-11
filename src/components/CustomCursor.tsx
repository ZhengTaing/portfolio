import { useEffect, useRef } from 'react'
import { hasFinePointer, prefersReducedMotion } from '../lib/motion'

/**
 * Desktop cursor: a dot that tracks the pointer exactly and a ring that trails
 * it. Over links and buttons the ring grows; over elements with
 * `data-cursor-label` it becomes a solid disc with that word (VIEW, LISTEN);
 * inside `data-cursor="native"` (the audio players) the normal cursor returns.
 * Buttons with `data-magnetic` lean toward the pointer. Clicks leave a ripple.
 *
 * Never mounted for touch or pen, and everything here ignores the pointer, so
 * clicks, text selection and keyboard focus behave exactly as before.
 */
export function CustomCursor() {
  const ringRef = useRef<HTMLDivElement>(null)
  const dotRef = useRef<HTMLDivElement>(null)
  const labelRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!hasFinePointer()) return
    const root = document.documentElement
    const ring = ringRef.current!
    const dot = dotRef.current!
    const mouse = { x: -100, y: -100 }
    const pos = { x: -100, y: -100 }
    let target = mouse
    let magnet: HTMLElement | null = null
    let frame = 0
    root.classList.add('has-cursor')

    const stateFor = (el: Element | null) => {
      if (!el?.closest) return 'default'
      if (el.closest('[data-cursor="native"], input, textarea, select, iframe')) return 'native'
      const labelled = el.closest<HTMLElement>('[data-cursor-label]')
      if (labelled) {
        if (labelRef.current) labelRef.current.textContent = labelled.dataset.cursorLabel ?? ''
        return 'label'
      }
      if (el.closest('a, button, [role="button"], label, summary')) return 'hover'
      return 'default'
    }

    const release = () => {
      if (magnet) magnet.style.transform = ''
      magnet = null
      target = mouse
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      mouse.x = e.clientX
      mouse.y = e.clientY
      root.classList.add('cursor-on')
      root.dataset.cursorState = stateFor(e.target as Element)
      const el = prefersReducedMotion() ? null : (e.target as Element).closest?.<HTMLElement>('[data-magnetic]')
      if (magnet && magnet !== el) release()
      if (el) {
        magnet = el
        const r = el.getBoundingClientRect()
        const cx = r.left + r.width / 2
        const cy = r.top + r.height / 2
        const dx = Math.max(-10, Math.min(10, (mouse.x - cx) * 0.3))
        const dy = Math.max(-10, Math.min(10, (mouse.y - cy) * 0.3))
        el.style.transform = `translate(${dx}px, ${dy}px)`
        target = { x: cx + dx * 1.4, y: cy + dy * 1.4 }
      }
    }

    const tick = () => {
      const follow = prefersReducedMotion() ? 1 : 0.2
      pos.x += (target.x - pos.x) * follow
      pos.y += (target.y - pos.y) * follow
      dot.style.transform = `translate3d(${mouse.x}px, ${mouse.y}px, 0)`
      ring.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`
      frame = requestAnimationFrame(tick)
    }

    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || e.button !== 0 || prefersReducedMotion()) return
      if ((e.target as Element).closest?.('[data-cursor="native"]')) return
      const ripple = document.createElement('div')
      ripple.className = 'click-ripple'
      ripple.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`
      const ring = document.createElement('i')
      ring.addEventListener('animationend', () => ripple.remove())
      ripple.appendChild(ring)
      document.body.appendChild(ripple)
    }

    const hide = () => root.classList.remove('cursor-on')
    // Content under a still pointer changes on scroll and navigation.
    let pending = false
    const recheck = () => {
      if (pending) return
      pending = true
      requestAnimationFrame(() => {
        pending = false
        root.dataset.cursorState = stateFor(document.elementFromPoint(mouse.x, mouse.y))
        if (magnet && !magnet.isConnected) release()
      })
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })
    window.addEventListener('scroll', recheck, { passive: true })
    window.addEventListener('blur', hide)
    document.addEventListener('pointerleave', hide)
    const mo = new MutationObserver(recheck)
    mo.observe(document.body, { childList: true, subtree: true })
    frame = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('scroll', recheck)
      window.removeEventListener('blur', hide)
      document.removeEventListener('pointerleave', hide)
      mo.disconnect()
      release()
      root.classList.remove('has-cursor', 'cursor-on')
      delete root.dataset.cursorState
    }
  }, [])

  return (
    <>
      <div ref={ringRef} className="cursor-ring" aria-hidden="true">
        <i>
          <b ref={labelRef} />
        </i>
      </div>
      <div ref={dotRef} className="cursor-dot" aria-hidden="true">
        <i />
      </div>
    </>
  )
}
