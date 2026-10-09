import { Link } from 'react-router-dom'
import { profile } from '../content/profile'
import { ContactLinks } from './ContactLinks'

const YEAR = new Date().getFullYear()

export function Footer() {
  return (
    <footer data-theme="ink" className="bg-bg text-fg px-4 py-10 sm:px-8">
      <div className="grid gap-8 md:grid-cols-[1fr_auto_1fr] md:items-end">
        <div>
          <p className="label mb-2">Contact / Inquiry</p>
          <a href={`mailto:${profile.email}`} className="link-underline text-base uppercase">
            {profile.email}
          </a>
          <ContactLinks links={profile.socialLinks.filter((l) => l.platform !== 'email')} className="mt-4" />
        </div>
        <p className="script text-center text-3xl sm:text-4xl">Designed for the present day</p>
        <div className="label text-muted flex flex-col gap-2 md:items-end">
          <Link to="/about" className="link-underline text-fg">
            About &amp; resume
          </Link>
          <span>
            © {YEAR} {profile.name}. No trackers, no cookies.
          </span>
        </div>
      </div>
    </footer>
  )
}
