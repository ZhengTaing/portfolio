import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ExternalLink, PlaceholderNotice, SmartImage, StatusBadge, Tag } from '../components/ui'
import { getProject, projectCategories, projects } from '../content/projects'
import { usePageMeta } from '../lib/usePageMeta'
import NotFoundPage from './NotFoundPage'

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section data-reveal className="border-line grid gap-4 border-t py-8 md:grid-cols-[14rem_1fr] md:gap-10">
      <h2 className="label pt-1">{title}</h2>
      <div className="max-w-[68ch] text-[0.9375rem] leading-relaxed">{children}</div>
    </section>
  )
}

export default function ProjectDetailPage() {
  const { slug = '' } = useParams()
  const project = getProject(slug)

  usePageMeta({
    title: project?.title ?? 'Project not found',
    description: project?.summary ?? 'This project could not be found.',
    path: `/projects/${slug}`,
    image: project?.thumbnail.src,
  })

  if (!project) return <NotFoundPage message="That project could not be found. It may have been renamed." />

  const index = projects.findIndex((p) => p.id === project.id)
  const next = projects[(index + 1) % projects.length]
  const category = projectCategories.find((c) => c.id === project.category)?.label
  const { caseStudy } = project

  return (
    <article className="px-4 pt-12 pb-24 sm:px-8">
      <nav aria-label="Breadcrumb" className="label mb-8">
        <Link to="/projects" className="link-underline">
          Projects
        </Link>{' '}
        / <span aria-current="page">{project.title}</span>
      </nav>

      <header className="border-fg border-b-[3px] pb-8">
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="label text-muted">
            {project.year} · {category}
          </span>
          <StatusBadge status={project.status} />
          {project.placeholder && <PlaceholderNotice />}
        </div>
        <h1 className="font-display text-[clamp(2.75rem,8.5vw,8rem)] leading-[0.88] font-extrabold tracking-[-0.045em] [font-stretch:112%]">
          {project.title}
        </h1>
        <p className="mt-8 max-w-3xl text-lg leading-snug sm:text-2xl">{project.description}</p>
        {(project.context || project.team) && (
          <dl className="label text-muted mt-6 grid gap-1.5">
            {project.context && (
              <div>
                <dt className="sr-only">Context</dt>
                <dd>{project.context}</dd>
              </div>
            )}
            {project.team && (
              <div>
                <dt className="inline">Team: </dt>
                <dd className="inline">{project.team.join(', ')}</dd>
              </div>
            )}
          </dl>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          {project.repositoryUrl && (
            <ExternalLink href={project.repositoryUrl} className="btn-outline">
              View repository <span aria-hidden="true">↗</span>
            </ExternalLink>
          )}
          {project.demoUrl && (
            <ExternalLink href={project.demoUrl} className="btn-outline">
              {project.demoLabel ?? 'Live demo'} <span aria-hidden="true">↗</span>
            </ExternalLink>
          )}
          {!project.repositoryUrl && !project.demoUrl && (
            <p className="label text-muted">Source is private. Happy to walk through it on request.</p>
          )}
        </div>
      </header>

      <figure data-reveal className="bg-surface my-10">
        <SmartImage image={project.thumbnail} eager sizes="100vw" />
      </figure>

      <Block title="Technologies">
        <ul className="flex flex-wrap gap-1.5">
          {project.technologies.map((t) => (
            <li key={t}>
              <Tag>{t}</Tag>
            </li>
          ))}
        </ul>
      </Block>
      <Block title="Problem / motivation">
        <p>{caseStudy.problem}</p>
      </Block>
      <Block title="Features">
        <ul className="list-['—_'] space-y-1 pl-5">
          {caseStudy.features.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      </Block>
      <Block title="My role">
        <p>{caseStudy.role}</p>
      </Block>
      <Block title="Process & decisions">
        <p>{caseStudy.process}</p>
      </Block>

      {project.gallery.length > 0 && (
        <section className="border-line border-t py-8">
          <h2 className="label mb-6">Screens & evidence</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {project.gallery.map((img) => (
              <figure key={img.src}>
                <SmartImage image={img} sizes="(min-width: 768px) 50vw, 100vw" />
                {img.caption && <figcaption className="label text-muted mt-2">{img.caption}</figcaption>}
              </figure>
            ))}
          </div>
        </section>
      )}

      <Block title="Outcomes & lessons">
        <p>{caseStudy.outcomes}</p>
      </Block>

      <Link
        to={`/projects/${next.slug}`}
        className="group border-fg mt-12 flex items-end justify-between gap-6 border-t-[3px] pt-6"
      >
        <span>
          <span className="label block">Next project</span>
          <span className="font-display group-hover:text-accent mt-2 block text-[clamp(2rem,6vw,4.5rem)] leading-none font-extrabold tracking-[-0.04em] transition-colors">
            {next.title}
          </span>
        </span>
        <span aria-hidden="true" className="text-4xl">
          →
        </span>
      </Link>
    </article>
  )
}
