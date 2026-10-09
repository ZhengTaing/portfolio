import { useEffect, useRef } from 'react'
import { artworkCategories } from '../content/artworks'
import type { Artwork } from '../types/content'

interface Props {
  items: Artwork[]
  index: number
  onClose: () => void
  onNavigate: (index: number) => void
}

/**
 * Full-screen viewer built on the native <dialog> element, which provides
 * focus trapping, Escape-to-close and an accessible modal role for free.
 * Arrow keys and horizontal swipes move between images.
 */
export function ImageLightbox({ items, index, onClose, onNavigate }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const touchStart = useRef<number | null>(null)
  const item = items[index]
  const count = items.length

  const prev = () => onNavigate((index - 1 + count) % count)
  const next = () => onNavigate((index + 1) % count)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (typeof dialog.showModal === 'function') {
      if (!dialog.open) dialog.showModal()
    } else {
      dialog.setAttribute('open', '')
    }
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  // Preload neighbours so next/previous feel instant.
  useEffect(() => {
    for (const i of [index - 1, index + 1]) {
      const n = items[(i + count) % count]
      if (n) new Image().src = n.imageUrl
    }
  }, [index, items, count])

  if (!item) return null

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="lightbox-title"
      className="bg-ink m-0 h-dvh max-h-none w-screen max-w-none p-0 text-white backdrop:bg-black/90"
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') prev()
        if (e.key === 'ArrowRight') next()
      }}
      onTouchStart={(e) => (touchStart.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchStart.current === null) return
        const dx = e.changedTouches[0].clientX - touchStart.current
        if (Math.abs(dx) > 50) (dx > 0 ? prev : next)()
        touchStart.current = null
      }}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <p className="label" aria-live="polite">
            {String(index + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}
          </p>
          <button type="button" onClick={onClose} className="label border-2 border-white px-3 py-2 hover:bg-white hover:text-black">
            Close <span aria-hidden="true">✕</span>
          </button>
        </div>

        <figure className="relative flex min-h-0 flex-1 flex-col items-center justify-center px-4 sm:px-20">
          <img
            key={item.id}
            src={item.imageUrl}
            alt={item.altText}
            width={item.width}
            height={item.height}
            className="max-h-full w-auto max-w-full object-contain motion-safe:animate-[rise_.35s_ease-out_both]"
          />
          <button
            type="button"
            onClick={prev}
            aria-label="Previous image"
            className="absolute top-1/2 left-2 hidden -translate-y-1/2 border-2 border-white px-3 py-2 text-lg hover:bg-white hover:text-black sm:block"
          >
            ←
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next image"
            className="absolute top-1/2 right-2 hidden -translate-y-1/2 border-2 border-white px-3 py-2 text-lg hover:bg-white hover:text-black sm:block"
          >
            →
          </button>
        </figure>

        <div className="flex flex-wrap items-end justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <h2 id="lightbox-title" className="font-display text-2xl font-extrabold tracking-[-0.02em] uppercase">
              {item.title}
            </h2>
            <p className="label mt-1 text-[#c9c9c9]">
              {[...new Set([artworkCategories.find((c) => c.id === item.category)?.label, item.medium, item.date])].filter(Boolean).join(' · ')}
            </p>
            {item.caption && <p className="mt-2 max-w-[60ch] text-[#e5e5e5]">{item.caption}</p>}
          </div>
          <div className="flex gap-2 sm:hidden">
            <button type="button" onClick={prev} aria-label="Previous image" className="border-2 border-white px-4 py-2">
              ←
            </button>
            <button type="button" onClick={next} aria-label="Next image" className="border-2 border-white px-4 py-2">
              →
            </button>
          </div>
        </div>
      </div>
    </dialog>
  )
}
