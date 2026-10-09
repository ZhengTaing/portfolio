import { Link } from 'react-router-dom'
import { navItems } from '../lib/site'
import { usePageMeta } from '../lib/usePageMeta'

export default function NotFoundPage({ message = 'This page does not exist, or has moved.' }: { message?: string }) {
  usePageMeta({ title: 'Not found', description: message, path: '/404' })
  return (
    <section className="px-4 py-24 sm:px-8">
      <p className="label">Error 404</p>
      <h1 className="display mt-4 text-[clamp(3.5rem,12vw,10rem)]">Lost signal</h1>
      <p className="mt-6 max-w-lg text-base uppercase">{message}</p>
      <ul className="mt-10 flex flex-wrap gap-3">
        {navItems.map((n) => (
          <li key={n.path}>
            <Link to={n.path} className="btn-outline">
              {n.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
