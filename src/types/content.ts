/**
 * Content models (PRD §5.3). All site content lives in `src/content/*` and is
 * typed against these interfaces, so new work can be added without touching
 * any components.
 */

export type ProjectCategory = 'ios-ai' | 'apps' | 'games' | 'ml' | 'design' | 'tools' | 'creative-code'
export type ProjectStatus = 'complete' | 'in-progress' | 'prototype' | 'archived'

export interface MediaImage {
  src: string
  alt: string
  width: number
  height: number
  caption?: string
}

export interface Project {
  id: string
  slug: string
  title: string
  year: number
  summary: string
  description: string
  category: ProjectCategory
  technologies: string[]
  thumbnail: MediaImage
  gallery: MediaImage[]
  repositoryUrl?: string
  demoUrl?: string
  /** Label for the demo link, e.g. "Live demo", "TestFlight", "Download". */
  demoLabel?: string
  status: ProjectStatus
  featured: boolean
  /** Case-study sections for the detail page (PRD §3.2). */
  caseStudy: {
    problem: string
    features: string[]
    role: string
    process: string
    outcomes: string
  }
  /** Course, event or client the project was made for. */
  context?: string
  /** Everyone who worked on it (shown on the case study). */
  team?: string[]
  /** True while the entry still holds placeholder copy. */
  placeholder?: boolean
}

export type ReleaseStatus = 'released' | 'upcoming'
/** `writing` = a songwriting-only credit on another artist's release. */
export type ReleaseFormat = 'single' | 'ep' | 'album' | 'production' | 'feature' | 'writing'
export type MusicPlatform = 'spotify' | 'apple-music' | 'soundcloud' | 'youtube' | 'bandcamp'

export interface Credit {
  name: string
  role: string
}

export interface MusicRelease {
  id: string
  slug: string
  title: string
  artist: string
  format: ReleaseFormat
  artwork: MediaImage
  /** ISO date (YYYY-MM-DD). */
  releaseDate?: string
  description: string
  roles: string[]
  credits: Credit[]
  platformLinks: Partial<Record<MusicPlatform, string>>
  /**
   * Base name of the song's audio file in public/media/audio/ (any of
   * .mp3 / .m4a / .wav / .ogg). Picked up automatically when the file exists.
   */
  audioFile?: string
  /** Resolved public URL of the audio file; filled in by content/releases.ts. */
  audioUrl?: string
  status: ReleaseStatus
  /**
   * Only `public` releases are ever rendered. Unreleased or confidential
   * work must stay `private` (PRD §3.3 acceptance criteria).
   */
  visibility: 'public' | 'private'
  featured: boolean
  placeholder?: boolean
}

export type ArtworkCategory = 'photography' | '3d' | 'life-drawing' | 'painting' | 'drawing'
export type PhotoCollection = 'weddings' | 'portraits' | 'food' | 'travel'

export interface Artwork {
  id: string
  title: string
  imageUrl: string
  thumbnailUrl: string
  width: number
  height: number
  category: ArtworkCategory
  /** Photography only: which collection the photo belongs to. */
  collection?: PhotoCollection
  /** Shoot or project the piece belongs to, e.g. "Osaka 2025". */
  series?: string
  /** ISO date (YYYY-MM-DD) or year. */
  date: string
  caption?: string
  medium?: string
  altText: string
  featured: boolean
  placeholder?: boolean
}

export type SocialPlatform =
  | 'github'
  | 'linkedin'
  | 'instagram'
  | 'spotify'
  | 'apple-music'
  | 'soundcloud'
  | 'youtube'
  | 'tiktok'
  | 'email'

export interface SocialLink {
  platform: SocialPlatform
  label: string
  url: string
  /** Shown in the compact contact strip on the home page. */
  primary?: boolean
}

export interface TimelineEntry {
  title: string
  organization: string
  period: string
  detail?: string
}

export interface ProfilePhoto {
  src: string
  /** Smaller version for thumbnails and phones. */
  srcSmall: string
  alt: string
  width: number
  height: number
}

export interface Profile {
  name: string
  /** Portraits shown on the About page; the first is shown by default. */
  portraits: ProfilePhoto[]
  /** Wide, cinematic photo used as a full-width band on the home page. */
  feature: ProfilePhoto
  headline: string
  tagline: string
  location: string
  introduction: string
  biography: string[]
  practice: string
  resumeUrl?: string
  email: string
  availability: string
  socialLinks: SocialLink[]
  education: TimelineEntry[]
  experience: TimelineEntry[]
  achievements: string[]
  skills: string[]
}
