import { useSearchParams } from 'react-router-dom'
import { PhotographyGallery } from '../components/PhotographyGallery'
import { PlaceholderNotice, SectionHeader } from '../components/ui'
import { artworkCategories, artworks, artworksInOrder } from '../content/artworks'
import { photoCollections } from '../content/photography'
import type { ArtworkCategory, PhotoCollection } from '../types/content'
import { usePageMeta } from '../lib/usePageMeta'

export default function VisualArtPage() {
  usePageMeta({
    title: 'Visual Art',
    description: 'Paintings, life drawing, observational drawing, 3D models and photography by Zheng Taing.',
    path: '/visual-art',
  })
  const [params, setParams] = useSearchParams()
  const rawCategory = params.get('category')
  const category = artworkCategories.some((c) => c.id === rawCategory) ? (rawCategory as ArtworkCategory) : null
  const rawCollection = params.get('collection')
  const collection =
    category === 'photography' && photoCollections.some((c) => c.id === rawCollection)
      ? (rawCollection as PhotoCollection)
      : null
  // "All" mixes every kind of work; a chosen category keeps each shoot or series together.
  const visible = category
    ? artworksInOrder.filter((a) => a.category === category && (!collection || a.collection === collection))
    : artworks
  const count = (id: ArtworkCategory) => artworks.filter((a) => a.category === id).length
  const openId = params.get('image')

  const update = (key: string, value: string | null, replace = true) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    // Switching category clears the photo-collection filter.
    if (key === 'category') next.delete('collection')
    setParams(next, { replace })
  }

  const chip = (selected: boolean) =>
    `label border px-3 py-2 transition-colors ${selected ? 'bg-fg text-bg border-fg' : 'border-line hover:border-fg'}`

  return (
    <section className="px-4 pt-12 pb-24 sm:px-8">
      <SectionHeader
        as="h1"
        number="03"
        title="Visual Art"
        aside="Photography, painting, life drawing, observational drawing and 3D environments."
      />

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div role="group" aria-label="Filter by category" className="flex flex-wrap gap-2">
          <button type="button" className={chip(!category)} aria-pressed={!category} onClick={() => update('category', null)}>
            All <span className="opacity-75">({artworks.length})</span>
          </button>
          {artworkCategories.filter((c) => artworks.some((a) => a.category === c.id)).map((c) => (
            <button
              key={c.id}
              type="button"
              className={chip(category === c.id)}
              aria-pressed={category === c.id}
              onClick={() => update('category', c.id)}
            >
              {c.label} <span className="opacity-75">({count(c.id)})</span>
            </button>
          ))}
        </div>
        {artworks.some((a) => a.placeholder) && <PlaceholderNotice>Placeholder images</PlaceholderNotice>}
      </div>

      {category === 'photography' && (
        <div role="group" aria-label="Filter photography by collection" className="-mt-4 mb-8 flex flex-wrap gap-x-5 gap-y-2">
          <button
            type="button"
            aria-pressed={!collection}
            onClick={() => update('collection', null)}
            className={`label py-1 ${!collection ? 'text-fg underline decoration-2 underline-offset-4' : 'text-muted hover:text-fg'}`}
          >
            All photography
          </button>
          {photoCollections.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={collection === c.id}
              onClick={() => update('collection', c.id)}
              className={`label py-1 ${collection === c.id ? 'text-fg underline decoration-2 underline-offset-4' : 'text-muted hover:text-fg'}`}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}

      <p className="sr-only" role="status" aria-live="polite">
        Showing {visible.length} images
      </p>

      <PhotographyGallery items={visible} openId={openId} onOpenChange={(id) => update('image', id)} />
    </section>
  )
}
