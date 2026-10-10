import type { MusicRelease } from '../types/content'

const cover = (file: string, title: string) => ({
  src: `/media/music/covers/${file}.jpg`,
  alt: `Cover artwork for ${title}`,
  width: 1200,
  height: 1200,
})

const SPOTIFY_ARTIST = 'https://open.spotify.com/artist/4Uk3l2GWB8dG0v4OaImCw7'
const APPLE_MUSIC_ARTIST = 'https://music.apple.com/ca/artist/zheng-taing/1451245421'

// Audio: drop a file named after `audioFile` into public/media/audio/
// (e.g. rose.mp3) and the site's player picks it up; no code change needed.
// Never add confidential, unreleased work to this file: everything here ships
// in the client bundle. Unreleased demos belong in private-demos/ instead.
const allReleases: MusicRelease[] = [
  // ---- Zheng Taing's own releases ----
  {
    id: 'r-rose',
    slug: 'rose',
    audioFile: 'rose',
    title: 'rose',
    artist: 'Zheng Taing',
    format: 'single',
    artwork: cover('rose', 'rose by Zheng Taing'),
    releaseDate: '2026-03-22',
    description: 'Single by Zheng Taing, released March 2026.',
    roles: ['Artist', 'Songwriter'],
    credits: [{ name: 'Zheng Taing', role: 'Artist, songwriter' }],
    platformLinks: {
      spotify: 'https://open.spotify.com/track/4TIACgwnCmY5YAUjNQfjnz',
      'apple-music': APPLE_MUSIC_ARTIST,
    },
    status: 'released',
    visibility: 'public',
    featured: true,
  },
  {
    id: 'r-romeo',
    slug: 'romeo-midnight-sessions',
    audioFile: '01 romeo (midnight sessions version)',
    title: 'romeo (midnight sessions version)',
    artist: 'Zheng Taing',
    format: 'single',
    artwork: cover('romeo', 'romeo (midnight sessions version) by Zheng Taing'),
    releaseDate: '2020-12-05',
    description: 'The midnight sessions version of romeo, released as a single in December 2020.',
    roles: ['Artist', 'Songwriter'],
    credits: [{ name: 'Zheng Taing', role: 'Artist, songwriter' }],
    platformLinks: {
      spotify: 'https://open.spotify.com/track/7ysnuInYRW6p7Cyi6GOrvS',
      'apple-music': APPLE_MUSIC_ARTIST,
    },
    status: 'released',
    visibility: 'public',
    featured: true,
  },
  {
    id: 'r-ily',
    slug: 'ily',
    audioFile: 'ily.',
    title: 'ily.',
    artist: 'Zheng Taing',
    format: 'single',
    artwork: cover('ily', 'ily. by Zheng Taing'),
    releaseDate: '2020-02-20',
    description: 'Single by Zheng Taing, released February 2020.',
    roles: ['Artist', 'Songwriter'],
    credits: [{ name: 'Zheng Taing', role: 'Artist, songwriter' }],
    platformLinks: {
      spotify: 'https://open.spotify.com/track/2XRqhSthW51dNcguAubHCi',
      'apple-music': APPLE_MUSIC_ARTIST,
    },
    status: 'released',
    visibility: 'public',
    featured: true,
  },

  // ---- Songs written for other artists (songwriting credit only) ----
  // TODO: confirm artist names, release dates and streaming links.
  {
    id: 'r-proxy',
    slug: 'proxy',
    audioFile: 'proxy',
    title: 'Proxy',
    artist: 'ROCKY',
    format: 'writing',
    artwork: cover('proxy', 'UNSAID by ROCKY, which includes Proxy'),
    releaseDate: '2026-08-11',
    description: 'Co-written by Zheng Taing (composer and lyricist) for ROCKY. Released via Universal Music Ltd. Distributed Labels.',
    roles: ['Composer', 'Lyricist'],
    credits: [
      { group: 'Composition & Lyrics', name: 'ROCKY', role: 'Lyricist' },
      { group: 'Composition & Lyrics', name: 'Kkannu', role: 'Recording Arranger · Composer' },
      { group: 'Composition & Lyrics', name: '39', role: 'Recording Arranger · Composer' },
      { group: 'Composition & Lyrics', name: 'R.M.T', role: 'Recording Arranger · Composer' },
      { group: 'Composition & Lyrics', name: 'Tencer', role: 'Recording Arranger · Composer · Lyricist' },
      { group: 'Composition & Lyrics', name: 'Pobee', role: 'Recording Arranger · Composer' },
      { group: 'Composition & Lyrics', name: 'iKaY', role: 'Recording Arranger · Composer' },
      { group: 'Composition & Lyrics', name: 'JOHNN!E', role: 'Recording Arranger · Composer' },
      { group: 'Composition & Lyrics', name: 'LaVit', role: 'Composer' },
      { group: 'Composition & Lyrics', name: 'BIGGType', role: 'Composer' },
      { group: 'Composition & Lyrics', name: 'Koa DelaCerna', role: 'Composer · Lyricist' },
      { group: 'Composition & Lyrics', name: 'Keang Zheng Taing', role: 'Composer · Lyricist' },
      { group: 'Composition & Lyrics', name: 'ssuVy', role: 'Lyricist' },
      { group: 'Production & Engineering', name: 'Kkannu', role: 'Mixing Engineer · Producer' },
      { group: 'Production & Engineering', name: 'Nam Woo Kwon', role: 'Mastering Engineer' },
      { group: 'Performers', name: 'ROCKY', role: 'Vocalist' },
    ],
    platformLinks: {},
    status: 'released',
    visibility: 'public',
    featured: false,
    placeholder: true,
  },
  {
    id: 'r-karma',
    slug: 'karma',
    audioFile: 'karma',
    title: 'Karma',
    artist: 'PRION HEART, Koa',
    format: 'writing',
    artwork: cover('karma', 'Karma by PRION HEART and Koa'),
    releaseDate: '2026-07-10',
    description: 'Co-written by Zheng Taing (composer and lyricist) for PRION HEART and Koa. Released via Gahara.',
    roles: ['Composer', 'Lyricist'],
    credits: [
      { group: 'Composition & Lyrics', name: 'Kim Seung Hoon', role: 'Composer · Lyricist' },
      { group: 'Composition & Lyrics', name: 'Cameron Koa Delacerna', role: 'Composer · Lyricist' },
      { group: 'Composition & Lyrics', name: 'Keang Zheng Taing', role: 'Composer · Lyricist' },
      { group: 'Production & Engineering', name: 'PRION HEART', role: 'Studio Producer' },
      { group: 'Performers', name: 'PRION HEART', role: 'Original Artist' },
      { group: 'Performers', name: 'Koa', role: 'Original Artist' },
      { group: 'Performers', name: 'Kim Seung Hoon', role: 'Programming' },
      { group: 'Performers', name: 'Cameron Koa Delacerna', role: 'Vocalist' },
    ],
    platformLinks: {},
    status: 'released',
    visibility: 'public',
    featured: false,
    placeholder: true,
  },
]

export const artistLinks = { spotify: SPOTIFY_ARTIST, appleMusic: APPLE_MUSIC_ARTIST }
 
/** Public releases only, newest first; undated entries keep their order at the end. */
export const publicReleases = (list: MusicRelease[]) =>
  list
    .filter((r) => r.visibility === 'public')
    .sort((a, b) => (b.releaseDate ?? '').localeCompare(a.releaseDate ?? ''))

export const releases: MusicRelease[] = publicReleases(allReleases)

export const getRelease = (slug: string) => releases.find((r) => r.slug === slug)
export const featuredReleases = () => releases.filter((r) => r.featured)

export const platformLabels: Record<string, string> = {
  spotify: 'Spotify',
  'apple-music': 'Apple Music',
  soundcloud: 'SoundCloud',
  youtube: 'YouTube',
  bandcamp: 'Bandcamp',
}

export const formatLabels: Record<MusicRelease['format'], string> = {
  single: 'Single',
  ep: 'EP',
  album: 'Album',
  production: 'Production',
  feature: 'Feature',
  writing: 'Songwriting',
}
