import { Link } from 'react-router-dom'
import type { Project } from '../types/content'
import { SmartImage, StatusBadge, Tag } from './ui'

/** Grid card used on the Projects index. The whole card links to its detail page. */
export function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="group border-line relative flex w-full flex-col border-t pt-4">
      <div className="bg-surface overflow-hidden">
        <SmartImage
          image={project.thumbnail}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </div>
      <div className="mt-4 flex items-start justify-between gap-4">
        <h2 className="font-display group-hover:text-accent text-3xl leading-none font-extrabold tracking-[-0.035em] transition-colors">
          <Link to={`/projects/${project.slug}`} className="after:absolute after:inset-0">
            {project.title}
          </Link>
        </h2>
        <span className="text-muted label pt-1">{project.year}</span>
      </div>
      <p className="text-muted mt-3 leading-relaxed">{project.summary}</p>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {project.status !== 'complete' && <StatusBadge status={project.status} />}
        {project.technologies.map((t) => (
          <Tag key={t}>{t}</Tag>
        ))}
      </div>
    </article>
  )
}

/** Compact editorial row used for featured projects on the home page. */
export function ProjectRow({ project }: { project: Project }) {
  return (
    <article className="group border-line relative grid gap-4 border-t py-8 md:grid-cols-[4rem_1fr_16rem_auto] md:items-center md:gap-6">
      <span className="text-muted label">{project.year}</span>
      <div>
        <h3 className="font-display group-hover:text-accent text-[clamp(2rem,4.5vw,4rem)] leading-[0.9] font-extrabold tracking-[-0.035em] transition-colors">
          <Link to={`/projects/${project.slug}`} className="after:absolute after:inset-0">
            {project.title}
          </Link>
        </h3>
        <p className="text-muted mt-3 max-w-[56ch] leading-relaxed">{project.summary}</p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {project.status !== 'complete' && <StatusBadge status={project.status} />}
        {project.technologies.slice(0, 3).map((t) => (
          <Tag key={t}>{t}</Tag>
        ))}
      </div>
      <span className="btn-outline pointer-events-none justify-self-start md:justify-self-end" aria-hidden="true">
        Case study →
      </span>
    </article>
  )
}
