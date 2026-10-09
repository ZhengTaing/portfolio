import { platformLabels } from '../content/releases'
import type { MusicRelease } from '../types/content'
import { ExternalLink } from './ui'

/** Buttons linking a release to its streaming platforms. Renders nothing if there are none. */
export function PlatformLinks({ release, className = '' }: { release: MusicRelease; className?: string }) {
  const entries = Object.entries(release.platformLinks).filter(([, url]) => Boolean(url))
  if (entries.length === 0) return null
  return (
    <ul className={`flex flex-wrap gap-2 ${className}`} aria-label={`Listen to ${release.title}`}>
      {entries.map(([platform, url]) => (
        <li key={platform}>
          <ExternalLink href={url} className="btn-outline px-3 py-2 text-[0.6875rem]">
            {platformLabels[platform] ?? platform} <span aria-hidden="true">↗</span>
          </ExternalLink>
        </li>
      ))}
    </ul>
  )
}
