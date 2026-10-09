import { useSearchParams } from 'react-router-dom'
import { PhotographyGallery } from '../components/PhotographyGallery'
import { PlaceholderNotice, SectionHeader } from '../components/ui'
import { artworkCategories, artworks } from '../content/artworks'
import type { ArtworkCategory } from '../types/content'
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
  const visible = category ? artworks.filter((a) => a.category === category) : artworks
  const openId = params.get('image')

  const update = (key: string, value: string | null, replace = true) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
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
        aside="Paintings, life drawing, observational drawing and 3D environments, with photography coming soon."
      />

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div role="group" aria-label="Filter by category" className="flex flex-wrap gap-2">
          <button type="button" className={chip(!category)} aria-pressed={!category} onClick={() => update('category', null)}>
            All
          </button>
          {artworkCategories.filter((c) => artworks.some((a) => a.category === c.id)).map((c) => (
            <button
              key={c.id}
              type="button"
              className={chip(category === c.id)}
              aria-pressed={category === c.id}
              onClick={() => update('category', c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
        {artworks.some((a) => a.placeholder) && <PlaceholderNotice>Placeholder images</PlaceholderNotice>}
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        Showing {visible.length} images
      </p>

      <PhotographyGallery items={visible} openId={openId} onOpenChange={(id) => update('image', id)} />
    </section>
  )
}
