/** Song-pitch data as sent by /api/demos (private fields are already removed by the server). */
export type PitchStatus = 'available' | 'on-hold' | 'reserved' | 'placed'

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
  market?: string
  actType?: string
  genre?: string
  bpm?: number | null
  status: PitchStatus
  pitchNotes?: string
  holdUntil?: string
  placedWith?: string
}

export const statuses: { id: PitchStatus; label: string; color: string }[] = [
  { id: 'available', label: 'Available', color: '#3ddc84' },
  { id: 'on-hold', label: 'On hold', color: '#ffb020' },
  { id: 'reserved', label: 'Reserved', color: '#6ea8ff' },
  { id: 'placed', label: 'Placed', color: '#a3a3a3' },
]

/** Filter options. The values are exactly what to type in private-demos/demos.json. */
export const markets = ['K-pop', 'Western pop']
export const actTypes = ['Girl group', 'Boy group', 'Solo artist']
export const genres = ['Pop', 'Dance pop', 'Alt pop', 'R&B', 'Ballad', 'EDM', 'Pop ballad', 'Folk', 'Synth pop']

export interface PitchFilters {
  status: PitchStatus[]
  market: string[]
  actType: string[]
  genre: string[]
}

export const emptyFilters: PitchFilters = { status: [], market: [], actType: [], genre: [] }

const same = (a?: string, b?: string) => (a ?? '').trim().toLowerCase() === (b ?? '').trim().toLowerCase()

/** Within a group any selected value matches; across groups every group must match. */
export function matches(p: Pitch, f: PitchFilters) {
  return (
    (f.status.length === 0 || f.status.includes(p.status)) &&
    (f.market.length === 0 || f.market.some((m) => same(m, p.market))) &&
    (f.actType.length === 0 || f.actType.some((a) => same(a, p.actType))) &&
    (f.genre.length === 0 || f.genre.some((g) => same(g, p.genre)))
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
