import { useEffect, type RefObject } from 'react'

/**
 * Fades elements marked with `data-reveal` up into place the first time they
 * scroll into view. Children of a `data-reveal-stagger` element animate one
 * after another. New elements (lazy-loaded pages, filtered lists) are picked
 * up automatically.
 *
 * Nothing is hidden unless this hook runs and the visitor allows motion, so
 * content is always visible without JavaScript or with "reduce motion" on.
 */
export function useScrollReveal(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current
    if (!root || typeof IntersectionObserver === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    document.documentElement.classList.add('reveal-ready')

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.classList.add('is-revealed')
          io.unobserve(entry.target)
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    )

    const seen = new WeakSet<Element>()
    const scan = () => {
      root.querySelectorAll('[data-reveal], [data-reveal-stagger] > *').forEach((el) => {
        if (seen.has(el)) return
        seen.add(el)
        const parent = el.parentElement
        if (parent?.hasAttribute('data-reveal-stagger')) {
          const index = Array.prototype.indexOf.call(parent.children, el)
          ;(el as HTMLElement).style.setProperty('--reveal-delay', `${Math.min(index, 8) * 70}ms`)
          el.setAttribute('data-reveal-item', '')
        }
        io.observe(el)
      })
    }

    scan()
    const mo = new MutationObserver(scan)
    mo.observe(root, { childList: true, subtree: true })

    return () => {
      io.disconnect()
      mo.disconnect()
    }
  }, [rootRef])
}
