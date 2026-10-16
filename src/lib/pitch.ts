/** Song-pitch data as sent by /api/demos (private fields are already removed by the server). */
export type PitchStatus = 'available' | 'on-hold' | 'reserved' | 'placed'

/** One recording of a song (AI demo, V1, V2…). */
export interface PitchVersion {
  id: string
  label: string
  duration?: string
  audioUrl: string
}

export interface Pitch {
  id: string
  title: string
  audioUrl: string
  coverUrl?: string
  duration?: string
  date?: string
  note?: string
  demoArtist?: string
  targetArtists?: string[]
  market?: string | string[]
  actType?: string | string[]
  genre?: string | string[]
  key?: string
  bpm?: number | null
  status: PitchStatus
  pitchNotes?: string
  holdUntil?: string
  placedWith?: string
  /** Only when the song has more than one version; shown as pills on its card. */
  versions?: PitchVersion[]
  defaultVersion?: string
}

/** The pitch as it plays with one version chosen (its link, length and label). */
export function withVersion(p: Pitch, versionId?: string): Pitch {
  const v = p.versions?.find((x) => x.id === versionId)
  return v ? { ...p, audioUrl: v.audioUrl, duration: v.duration ?? p.duration, note: v.label } : p
}

/** Which version is playing, worked out from the link. */
export const versionOf = (p: Pitch) => p.versions?.find((v) => v.audioUrl === p.audioUrl)?.id ?? p.defaultVersion

export interface PitchTags {
  market: string[]
  actType: string[]
  genre: string[]
}

export const statuses: { id: PitchStatus; label: string; color: string }[] = [
  { id: 'available', label: 'Available', color: '#3ddc84' },
  { id: 'on-hold', label: 'On hold', color: '#ffb020' },
  { id: 'reserved', label: 'Reserved', color: '#6ea8ff' },
  { id: 'placed', label: 'Placed', color: '#a3a3a3' },
]

/** Default filter options (the admin page can add, rename and remove). The values are exactly what to type in private-demos/demos.json. */
export const markets = ['K-pop', 'Western pop']
export const actTypes = ['Girl group', 'Boy group', 'Solo artist']
export const genres = [
  'Pop',
  'Dance pop',
  'Alt pop',
  'Dark pop',
  'R&B',
  'Ballad',
  'Pop ballad',
  'Acoustic',
  'EDM',
  'Synth pop',
  'City pop',
  'Jersey club',
  'Rap',
  'Folk',
  'Country',
  'Bossa nova',
]

export interface PitchFilters {
  status: PitchStatus[]
  market: string[]
  actType: string[]
  genre: string[]
}

export const emptyFilters: PitchFilters = { status: [], market: [], actType: [], genre: [] }

/** A field may hold one value or a list; always work with a list. */
export const asList = (v?: string | string[]) => (Array.isArray(v) ? v : v ? [v] : []).filter(Boolean)

const norm = (s: string) => s.trim().toLowerCase()
const hasAny = (selected: string[], values?: string | string[]) => {
  const have = asList(values).map(norm)
  return selected.some((s) => have.includes(norm(s)))
}

/** Within a group any selected value matches; across groups every group must match. */
export function matches(p: Pitch, f: PitchFilters) {
  return (
    (f.status.length === 0 || f.status.includes(p.status)) &&
    (f.market.length === 0 || hasAny(f.market, p.market)) &&
    (f.actType.length === 0 || hasAny(f.actType, p.actType)) &&
    (f.genre.length === 0 || hasAny(f.genre, p.genre))
  )
}

export function formatHold(iso?: string) {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00')
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** A stable generated cover (used until real artwork is added). */
export function generatedCover(id: string) {
  let h = 0
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0
  const hue = h % 360
  const hue2 = (hue + 40 + (h % 80)) % 360
  const x = 20 + (h % 60)
  const y = 20 + ((h >> 8) % 60)
  return `radial-gradient(circle at ${x}% ${y}%, hsl(${hue2} 90% 80%), hsl(${hue} 70% 45%) 55%, hsl(${hue} 60% 10%))`
}
