import { useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ProjectCard } from '../components/ProjectCard'
import { SectionHeader } from '../components/ui'
import { projectCategories, projects } from '../content/projects'
import type { ProjectCategory } from '../types/content'
import { useFlip } from '../lib/motion'
import { usePageMeta } from '../lib/usePageMeta'

export default function ProjectsPage() {
  usePageMeta({
    title: 'Projects',
    description: 'Software engineering, app development, game development and creative technology projects by Zheng Taing.',
    path: '/projects',
  })
  const [params, setParams] = useSearchParams()
  const active = params.get('category') as ProjectCategory | null
  const validActive = projectCategories.some((c) => c.id === active) ? active : null
  const visible = validActive ? projects.filter((p) => p.category === validActive) : projects
  const listRef = useRef<HTMLUListElement>(null)
  useFlip(listRef, visible.map((p) => p.id).join())
  // Only offer filters that actually have projects behind them.
  const categories = projectCategories.filter((c) => projects.some((p) => p.category === c.id))

  const select = (id: ProjectCategory | null) => {
    const next = new URLSearchParams(params)
    if (id) next.set('category', id)
    else next.delete('category')
    setParams(next, { replace: true })
  }

  const chip = (selected: boolean) =>
    `label border px-3 py-2 transition-colors ${selected ? 'bg-fg text-bg border-fg' : 'border-line hover:border-fg'}`

  return (
    <section className="px-4 pt-12 pb-24 sm:px-8">
      <SectionHeader
        as="h1"
        number="01"
        title="Selected Works"
        aside="Software engineering, applications, games and creative technology. Case studies cover the problem, my role and what I learned."
      />

      <div role="group" aria-label="Filter projects by category" className="mb-10 flex flex-wrap gap-2">
        <button type="button" className={chip(!validActive)} aria-pressed={!validActive} onClick={() => select(null)}>
          All <span className="opacity-60">({projects.length})</span>
        </button>
        {categories.map((c) => {
          const count = projects.filter((p) => p.category === c.id).length
          return (
            <button
              key={c.id}
              type="button"
              className={chip(validActive === c.id)}
              aria-pressed={validActive === c.id}
              onClick={() => select(c.id)}
            >
              {c.label} <span className="opacity-60">({count})</span>
            </button>
          )
        })}
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        Showing {visible.length} {visible.length === 1 ? 'project' : 'projects'}
      </p>

      {visible.length > 0 ? (
        <ul ref={listRef} data-reveal-stagger className="grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((p) => (
            <li key={p.id} data-flip={p.id} className="flex">
              <ProjectCard project={p} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="label border-line border p-6">No projects in this category yet.</p>
      )}
    </section>
  )
}
