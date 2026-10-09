import { profile } from '../content/profile'
import type { SocialLink } from '../types/content'
import { ExternalLink } from './ui'

interface Props {
  links?: SocialLink[]
  variant?: 'large' | 'compact'
  className?: string
}

/** Contact email and professional / music profiles. */
export function ContactLinks({ links = profile.socialLinks, variant = 'compact', className = '' }: Props) {
  const large = variant === 'large'
  return (
    <ul className={`flex flex-wrap ${large ? 'gap-x-6 gap-y-4' : 'gap-x-5 gap-y-2'} ${className}`}>
      {links.map((link) => (
        <li key={link.platform}>
          <ExternalLink
            href={link.url}
            className={
              large
                ? 'font-display inline-block border-b-[3px] border-current text-xl font-extrabold tracking-[-0.02em] uppercase transition-opacity hover:opacity-70 sm:text-2xl'
                : 'link-underline label'
            }
          >
            {link.label}
          </ExternalLink>
        </li>
      ))}
    </ul>
  )
}
