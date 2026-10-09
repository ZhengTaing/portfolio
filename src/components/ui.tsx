import { useState, type AnchorHTMLAttributes, type ReactNode } from 'react'
import type { MediaImage, ProjectStatus } from '../types/content'

/** External link that always opens safely in a new tab and announces it. */
export function ExternalLink({ children, className, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const isMail = rest.href?.startsWith('mailto:')
  return (
    <a {...rest} className={className} {...(isMail ? {} : { target: '_blank', rel: 'noopener noreferrer' })}>
      {children}
      {!isMail && <span className="sr-only"> (opens in a new tab)</span>}
    </a>
  )
}

/**
 * Image with intrinsic dimensions (no layout shift), lazy loading by default,
 * and a graceful fallback if the file is missing.
 */
export function SmartImage({
  image,
  className = '',
  eager = false,
  sizes,
}: {
  image: Pick<MediaImage, 'src' | 'alt' | 'width' | 'height'>
  className?: string
  eager?: boolean
  sizes?: string
}) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return (
      <div
        role="img"
        aria-label={image.alt}
        className={`bg-ink label flex items-center justify-center text-[#c9c9c9] ${className}`}
        style={{ aspectRatio: `${image.width} / ${image.height}` }}
      >
        Image unavailable
      </div>
    )
  }
  return (
    <img
      src={image.src}
      alt={image.alt}
      width={image.width}
      height={image.height}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      sizes={sizes}
      onError={() => setFailed(true)}
      className={`block w-full ${className.includes('h-full') ? '' : 'h-auto'} ${className}`}
    />
  )
}

const statusLabels: Record<ProjectStatus, string> = {
  complete: 'Complete',
  'in-progress': 'In progress',
  prototype: 'Prototype',
  archived: 'Archived',
}

export function StatusBadge({ status }: { status: ProjectStatus }) {
  const highlight = status === 'in-progress' || status === 'prototype'
  return (
    <span className={`label border px-2 py-1 ${highlight ? 'border-accent text-accent' : 'border-line text-muted'}`}>
      {statusLabels[status]}
    </span>
  )
}

export function Tag({ children }: { children: ReactNode }) {
  return <span className="label border-line border px-2 py-1">{children}</span>
}

export function PlaceholderNotice({ children = 'Placeholder content' }: { children?: ReactNode }) {
  return (
    <span className="label inline-block bg-[#ffe600] px-2 py-1 text-[#0e0e0e]" title="Replace before launch">
      {children}
    </span>
  )
}

export function SectionHeader({
  number,
  title,
  as: Tag = 'h2',
  aside,
}: {
  number: string
  title: ReactNode
  as?: 'h1' | 'h2'
  aside?: ReactNode
}) {
  return (
    <header data-reveal className="mb-10 flex flex-col gap-6 border-b-[3px] border-current pb-6 md:mb-14 md:flex-row md:items-end md:justify-between">
      <div className="flex items-baseline gap-3">
        <span className="text-fg text-sm" aria-hidden="true">
          {number}
        </span>
        <Tag className="display text-[clamp(2.25rem,6.5vw,6.5rem)] break-words">{title}</Tag>
      </div>
      {aside && <div className="max-w-md text-sm leading-relaxed uppercase md:text-right">{aside}</div>}
    </header>
  )
}
