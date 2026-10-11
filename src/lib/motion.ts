import { useLayoutEffect, useRef, type RefObject } from 'react'

const matches = (query: string) => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(query).matches

export const prefersReducedMotion = () => matches('(prefers-reduced-motion: reduce)')

/** A mouse or trackpad (not touch or pen). */
export const hasFinePointer = () => matches('(hover: hover) and (pointer: fine)')

const EASE_OUT = 'cubic-bezier(0.2, 0.7, 0.2, 1)'

/**
 * Smooth list changes (filters): items that stay glide to their new place,
 * new items fade up. Children need a stable `data-flip` attribute.
 * Runs whenever `key` changes.
 */
export function useFlip(listRef: RefObject<HTMLElement | null>, key: unknown) {
  const last = useRef(new Map<string, DOMRect>())

  useLayoutEffect(() => {
    const list = listRef.current
    if (!list) return
    const items = Array.from(list.querySelectorAll<HTMLElement>(':scope > [data-flip]'))
    const before = last.current
    const next = new Map<string, DOMRect>()
    const animate = before.size > 0 && !prefersReducedMotion() && typeof list.animate === 'function'
    let entering = 0
    for (const el of items) {
      const id = el.dataset.flip!
      const rect = el.getBoundingClientRect()
      next.set(id, rect)
      if (!animate) continue
      const prev = before.get(id)
      if (prev) {
        const dx = prev.left - rect.left
        const dy = prev.top - rect.top
        if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
          el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: 420, easing: EASE_OUT })
        }
      } else {
        // Already animating in, so the scroll reveal shouldn't hide it again.
        el.classList.add('is-revealed')
        el.animate([{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], {
          duration: 420,
          delay: Math.min(entering++, 8) * 50,
          easing: EASE_OUT,
          fill: 'backwards',
        })
      }
    }
    last.current = next
  }, [listRef, key])
}
