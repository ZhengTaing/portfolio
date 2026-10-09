import audioFiles from 'virtual:audio-files'
import type { MusicRelease } from '../types/content'
import type { PlayerTrack } from '../components/MediaPlayer'

/** Public URL of a release's audio file, if one with a matching name exists in public/media/audio/. */
export function findAudioUrl(release: MusicRelease, files: string[] = audioFiles): string | undefined {
  if (release.audioUrl) return release.audioUrl
  if (!release.audioFile) return undefined
  const file = files.find((f) => f.slice(0, f.lastIndexOf('.')).toLowerCase() === release.audioFile!.toLowerCase())
  return file ? `/media/audio/${encodeURIComponent(file)}` : undefined
}

/** Player tracks for the releases that have audio. */
export function releaseTracks(list: MusicRelease[], files: string[] = audioFiles): PlayerTrack[] {
  return list.flatMap((r) => {
    const audioUrl = findAudioUrl(r, files)
    if (!audioUrl) return []
    return [
      {
        id: r.id,
        title: r.title,
        audioUrl,
        subtitle: r.format === 'writing' ? `${r.artist} · Written by Zheng Taing` : r.artist,
        date: r.releaseDate?.slice(0, 4),
        artwork: { src: r.artwork.src, alt: r.artwork.alt },
      },
    ]
  })
}
