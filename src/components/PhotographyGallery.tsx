import { useEffect, useRef } from 'react'
import type { Artwork } from '../types/content'
import { ImageLightbox } from './ImageLightbox'
import { SmartImage } from './ui'

interface Props {
  items: Artwork[]
  /** id of the artwork currently open in the lightbox, if any. */
  openId: string | null
  onOpenChange: (id: string | null) => void
}

/** Masonry gallery. Each tile is a button that opens the lightbox. */
export function PhotographyGallery({ items, openId, onOpenChange }: Props) {
  const triggers = useRef(new Map<string, HTMLButtonElement>())
  const openIndex = openId ? items.findIndex((a) => a.id === openId) : -1

  // When the viewer closes (button, Escape or browser back), return focus to
  // the tile of the image that was last shown, once the dialog has unmounted.
  const lastOpen = useRef<string | null>(null)
  useEffect(() => {
    if (openId) lastOpen.current = openId
    else if (lastOpen.current) {
      triggers.current.get(lastOpen.current)?.focus()
      lastOpen.current = null
    }
  }, [openId])

  const close = () => onOpenChange(null)

  return (
    <>
      <ul data-reveal-stagger className="columns-1 gap-4 xs:columns-2 lg:columns-3">
        {items.map((a, i) => (
          <li key={a.id} className="mb-4 break-inside-avoid">
            <button
              type="button"
              ref={(el) => {
                if (el) triggers.current.set(a.id, el)
                else triggers.current.delete(a.id)
              }}
              onClick={() => onOpenChange(a.id)}
              className="group block w-full text-left"
              aria-label={`Open ${a.title} in viewer`}
            >
              <span className="bg-surface block overflow-hidden">
                <SmartImage
                  image={{ src: a.thumbnailUrl, alt: a.altText, width: a.width, height: a.height }}
                  eager={i < 3}
                  sizes="(min-width: 1024px) 33vw, (min-width: 480px) 50vw, 100vw"
                  className="transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </span>
              <span className="label text-muted mt-2 flex justify-between gap-3">
                <span className="group-hover:text-fg">{a.title}</span>
                <span>{a.medium}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      {openIndex >= 0 && (
        <ImageLightbox items={items} index={openIndex} onClose={close} onNavigate={(i) => onOpenChange(items[i].id)} />
      )}
    </>
  )
}
