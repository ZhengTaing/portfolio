import { useState } from 'react'
import type { ProfilePhoto } from '../types/content'

/**
 * A large portrait with a "contact sheet" of frames underneath, like a strip
 * of film. Choosing a frame swaps the large photo.
 */
export function PortraitSheet({ photos }: { photos: ProfilePhoto[] }) {
  const [active, setActive] = useState(0)
  const photo = photos[active]
  if (!photo) return null

  return (
    <figure className="mx-auto w-full max-w-md lg:max-w-none">
      <div className="bg-surface relative overflow-hidden" style={{ aspectRatio: '4 / 5' }}>
        <img
          key={photo.src}
          src={photo.src}
          srcSet={`${photo.srcSmall} 600w, ${photo.src} 1200w`}
          sizes="(min-width: 1024px) 26rem, 100vw"
          alt={photo.alt}
          width={photo.width}
          height={photo.height}
          className="h-full w-full object-cover object-[50%_62%] motion-safe:animate-[fade_.5s_ease-out_both]"
        />
        <span className="label absolute top-3 left-3 bg-black/55 px-2 py-1 text-white" aria-hidden="true">
          {String(active + 1).padStart(2, '0')}A
        </span>
      </div>

      {photos.length > 1 && (
        <div role="group" aria-label="Choose a portrait" className="mt-3 grid grid-cols-4 gap-2">
          {photos.map((p, i) => (
            <button
              key={p.src}
              type="button"
              onClick={() => setActive(i)}
              aria-pressed={i === active}
              aria-label={`Show portrait ${i + 1}`}
              className={`group relative overflow-hidden border-2 transition-colors ${i === active ? 'border-fg' : 'border-transparent hover:border-line'}`}
            >
              <img
                src={p.srcSmall}
                alt=""
                width={600}
                height={900}
                loading="lazy"
                className={`aspect-square w-full object-cover object-[50%_62%] transition-opacity ${i === active ? '' : 'opacity-60 group-hover:opacity-100'}`}
              />
              <span className="label absolute bottom-1 left-1 text-[0.625rem] text-white drop-shadow" aria-hidden="true">
                {String(i + 1).padStart(2, '0')}A
              </span>
            </button>
          ))}
        </div>
      )}
    </figure>
  )
}
