import type { Artwork, ArtworkCategory } from '../types/content'
import { photos } from './photography'

export const artworkCategories: { id: ArtworkCategory; label: string }[] = [
  { id: 'photography', label: 'Photography' },
  { id: '3d', label: '3D Models' },
  { id: 'life-drawing', label: 'Life Drawing' },
  { id: 'painting', label: 'Painting' },
  { id: 'drawing', label: 'Observational Drawing' },
]

interface Entry {
  slug: string
  category: ArtworkCategory
  title: string
  medium: string
  width: number
  height: number
  featured: boolean
  series?: string
  altText: string
  caption?: string
}

// Images live in public/media/art/ as <slug>.jpg (large, max 2000px) and
// <slug>-thumb.jpg (small, max 800px). Keep width/height equal to the large
// image so the layout never jumps while images load.
// `featured: true` puts a piece in the homepage carousel.
// The order here is the order on the Visual Art page.
const entries: Entry[] = [
  { slug: 'portrait-in-red', category: 'painting', title: "Portrait in Red", medium: 'Painting', width: 1500, height: 2000, featured: true,
    altText: "Close-up painted portrait of a face in bold reds and pinks with streaks of teal, the eyes looking up and to the side" },
  { slug: 'figure-in-red-and-teal', category: 'painting', title: "Figure in Red and Teal", medium: 'Painting', width: 1612, height: 2000, featured: true,
    altText: "Painted figure holding their hands to their face, rendered in reds with teal and green accents on a pale background" },
  { slug: 'still-life-pitcher', category: 'drawing', title: "Still Life with Pitcher", medium: 'Charcoal', width: 1408, height: 2000, featured: true, series: "Observational",
    altText: "Charcoal still life of a reflective metal pitcher, a lantern, fern leaves and draped cloth on toned paper" },
  { slug: 'still-life-pitcher-detail-1', category: 'drawing', title: "Still Life with Pitcher (detail)", medium: 'Charcoal', width: 1500, height: 2000, featured: false, series: "Observational",
    altText: "Close-up of the charcoal pitcher drawing showing highlights on the metal and folds of cloth" },
  { slug: 'still-life-pitcher-detail-2', category: 'drawing', title: "Still Life with Pitcher (detail 2)", medium: 'Charcoal', width: 1500, height: 2000, featured: false, series: "Observational",
    altText: "Close-up of draped cloth and the pitcher handle in charcoal" },
  { slug: 'skull-still-life', category: 'drawing', title: "Skull Still Life", medium: 'Charcoal', width: 1440, height: 1800, featured: true, series: "Observational",
    altText: "Charcoal still life of two stacked skulls among leaves, a pot and small gourds" },
  { slug: 'skull-still-life-detail', category: 'drawing', title: "Skull Still Life (detail)", medium: 'Charcoal', width: 1440, height: 1800, featured: false, series: "Observational",
    altText: "Close-up of the skull drawing showing leaf shapes and blended charcoal tones" },
  { slug: 'theatre-perspective', category: 'drawing', title: "Theatre", medium: 'Line drawing', width: 1500, height: 2000, featured: true, series: "Observational",
    altText: "Black and white perspective line drawing of a theatre facade with a marquee sign" },
  { slug: 'stairwell-perspective', category: 'drawing', title: "Stairwell", medium: 'Line drawing', width: 1353, height: 1805, featured: false, series: "Observational",
    altText: "Black and white perspective line drawing looking down a curving stairwell with railings" },
  { slug: 'gesture-studies-1', category: 'life-drawing', title: "Gesture Studies 01", medium: 'Digital', width: 1414, height: 2000, featured: true,
    altText: "Sheet of quick colored gesture drawings of a figure model in kneeling, crouching and standing poses" },
  { slug: 'gesture-studies-2', category: 'life-drawing', title: "Gesture Studies 02", medium: 'Digital', width: 1414, height: 2000, featured: false,
    altText: "Sheet of colored gesture drawings of a figure model posing seated, crouching and leaping" },
  { slug: 'gesture-studies-3', category: 'life-drawing', title: "Gesture Studies 03", medium: 'Digital', width: 1414, height: 2000, featured: false,
    altText: "Sheet of colored gesture drawings of seated and standing figure poses" },
  { slug: 'cathedral-altar-render', category: '3d', title: "Cathedral Environment, Altar", medium: '3D render', width: 1280, height: 720, featured: true, series: "Cathedral Environment",
    altText: "Dim, sepia-lit render of a cathedral altar with columns and a figure under a domed ceiling" },
  { slug: 'cathedral-nave-render', category: '3d', title: "Cathedral Environment, Nave", medium: '3D render', width: 1280, height: 720, featured: true, series: "Cathedral Environment",
    altText: "Atmospheric render of a cathedral nave with rows of pews and hanging lanterns" },
  { slug: 'cathedral-aisle-render', category: '3d', title: "Cathedral Environment, Aisle", medium: '3D render', width: 1280, height: 720, featured: false, series: "Cathedral Environment",
    altText: "Render looking down a cathedral aisle toward a glowing altar" },
  { slug: 'cathedral-dome-render', category: '3d', title: "Cathedral Environment, Dome", medium: '3D render', width: 1280, height: 720, featured: false, series: "Cathedral Environment",
    altText: "Render of a cathedral dome with a radiating sunburst sculpture" },
  { slug: 'cathedral-lantern-render', category: '3d', title: "Cathedral Environment, Lantern", medium: '3D render', width: 1280, height: 720, featured: false, series: "Cathedral Environment",
    altText: "Close render of a hanging lantern inside a dim cathedral hall" },
  { slug: 'cathedral-arcade-render', category: '3d', title: "Cathedral Environment, Arcade", medium: '3D render', width: 1280, height: 720, featured: false, series: "Cathedral Environment",
    altText: "Render of arched arcades lit by small hanging lights in haze" },
  { slug: 'cathedral-camera-render', category: '3d', title: "Cathedral Environment, Film Set", medium: '3D render', width: 1280, height: 720, featured: false, series: "Cathedral Environment",
    altText: "Render of an old film camera on a tripod inside the cathedral, with light from an open doorway" },
  { slug: 'cathedral-hall-render', category: '3d', title: "Cathedral Environment, Hall", medium: '3D render', width: 1280, height: 720, featured: false, series: "Cathedral Environment",
    altText: "Dim render of a large hall with a film camera on a tripod" },
  { slug: 'cathedral-altar', category: '3d', title: "Cathedral Altar Model", medium: '3D model', width: 1920, height: 1080, featured: true, series: "Cathedral Environment",
    altText: "Untextured grey 3D model of an arched altar with a sunburst crown, serpent reliefs and candlesticks" },
  { slug: 'cathedral-altar-closeup', category: '3d', title: "Cathedral Altar Model (close-up)", medium: '3D model', width: 1920, height: 1080, featured: false, series: "Cathedral Environment",
    altText: "Close view of the untextured altar model showing columns, serpent heads and candlesticks" },
  { slug: 'cathedral-serpent-relief', category: '3d', title: "Serpent Relief Model", medium: '3D model', width: 1920, height: 1080, featured: false, series: "Cathedral Environment",
    altText: "Untextured 3D model of three serpent heads mounted on a fluted wall" },
  { slug: 'cathedral-dome-detail', category: '3d', title: "Dome Detail Model", medium: '3D model', width: 1920, height: 1080, featured: false, series: "Cathedral Environment",
    altText: "Untextured 3D model of a dome interior with a sunburst sculpture and serpent head" },
  { slug: 'cathedral-capital-detail', category: '3d', title: "Capital Detail Model", medium: '3D model', width: 1920, height: 1080, featured: false, series: "Cathedral Environment",
    altText: "Untextured 3D model of ornate column capitals with a serpent head" },
  { slug: 'cathedral-candlesticks', category: '3d', title: "Candlesticks Model", medium: '3D model', width: 1920, height: 1080, featured: false, series: "Cathedral Environment",
    altText: "Untextured 3D model of tall candlesticks standing on an altar platform" },
  { slug: 'camera-model-studio', category: '3d', title: "Film Camera Model", medium: '3D model', width: 1920, height: 1080, featured: true, series: "Film Camera",
    altText: "Untextured 3D model of a vintage film camera on a tripod in a softly lit studio" },
  { slug: 'camera-model-spotlight', category: '3d', title: "Film Camera Model, Spotlight", medium: '3D model', width: 1920, height: 1080, featured: false, series: "Film Camera",
    altText: "The film camera model on its tripod under a single spotlight on a dark floor" },
  { slug: 'camera-model-low-angle', category: '3d', title: "Film Camera Model, Low Angle", medium: '3D model', width: 1920, height: 1080, featured: false, series: "Film Camera",
    altText: "Low-angle view of the film camera model and its tripod mount against black" },
  { slug: 'camera-tripod-head', category: '3d', title: "Tripod Head Model", medium: '3D model', width: 1920, height: 1080, featured: false, series: "Film Camera",
    altText: "Close view of the tripod head and legs of the film camera model" },
  { slug: 'camera-tripod-detail', category: '3d', title: "Tripod Detail Model", medium: '3D model', width: 1920, height: 1080, featured: false, series: "Film Camera",
    altText: "Detail of the camera lens and tripod legs of the film camera model" },
  { slug: 'camera-lens-detail-1', category: '3d', title: "Lens Detail Model", medium: '3D model', width: 1920, height: 1080, featured: false, series: "Film Camera",
    altText: "Close-up of the ridged lens barrel of the film camera model" },
  { slug: 'camera-lens-detail-2', category: '3d', title: "Lens Detail Model 02", medium: '3D model', width: 1920, height: 1080, featured: false, series: "Film Camera",
    altText: "Dramatic close-up of the lens barrel of the film camera model against black" },
  { slug: 'camera-body-detail', category: '3d', title: "Camera Body Detail Model", medium: '3D model', width: 1920, height: 1080, featured: false, series: "Film Camera",
    altText: "Detail of the film camera body and film reel housing" },
]

const artPieces: Artwork[] = entries.map((e) => ({
  id: `a-${e.slug}`,
  title: e.title,
  imageUrl: `/media/art/${e.slug}.jpg`,
  thumbnailUrl: `/media/art/${e.slug}-thumb.jpg`,
  width: e.width,
  height: e.height,
  category: e.category,
  date: '',
  medium: e.medium,
  caption: e.caption ?? e.series,
  series: e.series,
  altText: e.altText,
  featured: e.featured,
}))

const photoPieces: Artwork[] = photos.map((p) => ({
  id: `a-${p.slug}`,
  title: p.title,
  imageUrl: `/media/art/photo/${p.slug}.jpg`,
  thumbnailUrl: `/media/art/photo/${p.slug}-thumb.jpg`,
  width: p.width,
  height: p.height,
  category: 'photography',
  collection: p.collection,
  series: p.series,
  date: '',
  medium: 'Photography',
  caption: p.series,
  altText: p.altText,
  featured: p.featured,
}))

/**
 * Deal items out one group at a time (A1, B1, C1, A2, B2, …) so a list mixes
 * kinds of work instead of showing one category in a long run.
 */
export function interleave<T>(items: T[], groupOf: (item: T) => string): T[] {
  const groups = new Map<string, T[]>()
  for (const item of items) {
    const key = groupOf(item)
    groups.set(key, [...(groups.get(key) ?? []), item])
  }
  const queues = [...groups.values()]
  const out: T[] = []
  for (let i = 0; out.length < items.length; i++) {
    for (const q of queues) if (q[i]) out.push(q[i])
  }
  return out
}

/** Every piece in source order (each shoot or series kept together). */
export const artworksInOrder: Artwork[] = [...photoPieces, ...artPieces]

/** Every piece, mixed across categories (and photo collections) for the "All" view. */
export const artworks: Artwork[] = interleave([...photoPieces, ...artPieces], (a) => a.collection ?? a.category)

/** Featured pieces for the homepage carousel, alternating between kinds of work. */
const carouselPhotoOrder = ['weddings', 'travel', 'portraits', 'food']

export const featuredArtworks = () =>
  interleave(
    [
      // Lead with a different kind of photo each time photography comes round.
      ...interleave(
        photoPieces.filter((a) => a.featured),
        (a) => a.collection ?? '',
      ).sort((a, b) => carouselPhotoOrder.indexOf(a.collection ?? '') - carouselPhotoOrder.indexOf(b.collection ?? '')),
      ...artPieces.filter((a) => a.featured),
    ],
    (a) => a.category,
  )
