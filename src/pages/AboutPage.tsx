import { ContactLinks } from '../components/ContactLinks'
import { PortraitSheet } from '../components/PortraitSheet'
import { ExternalLink, PlaceholderNotice } from '../components/ui'
import { profile } from '../content/profile'
import type { TimelineEntry } from '../types/content'
import { usePageMeta } from '../lib/usePageMeta'

function Stamp({ children }: { children: string }) {
  return <h2 className="label bg-fg text-bg mb-5 inline-block px-2.5 py-1.5 font-bold">{children}</h2>
}

function Timeline({ entries }: { entries: TimelineEntry[] }) {
  return (
    <ul>
      {entries.map((e) => (
        <li
          key={e.title + e.organization}
          className="border-line grid gap-1 border-b py-3 uppercase sm:grid-cols-[1fr_1fr_auto] sm:gap-4"
        >
          <span className="font-bold">{e.title}</span>
          <span>
            {e.organization}
            {e.detail && <span className="text-muted block normal-case">{e.detail}</span>}
          </span>
          <span className="text-muted">{e.period}</span>
        </li>
      ))}
    </ul>
  )
}

export default function AboutPage() {
  usePageMeta({
    title: 'About & Contact',
    description: `About ${profile.name}: background, experience, resume and how to get in touch.`,
    path: '/about',
  })

  return (
    <div className="px-4 pt-12 pb-24 sm:px-8">
      <div className="grid gap-10 lg:grid-cols-[1fr_minmax(18rem,26rem)] lg:items-end lg:gap-14">
        <div>
          <p className="label mb-5">04 / About &amp; Contact</p>
          <h1 className="display display-wide text-[clamp(2.5rem,9.5vw,9rem)]">
            Let&rsquo;s
            <br />
            Connect
          </h1>
          <p className="script mt-1 ml-[6%] text-[clamp(2.25rem,4.5vw,4.5rem)] leading-none" aria-hidden="true">
            technology, sound &amp; image
          </p>
        </div>
        <PortraitSheet photos={profile.portraits} />
      </div>

      <section aria-label="Contact" data-reveal className="border-line mt-12 grid gap-10 border-t pt-10 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <p className="label mb-3">Email</p>
          <a
            href={`mailto:${profile.email}`}
            className="font-display block text-[clamp(1.75rem,4.5vw,3.75rem)] leading-none font-extrabold tracking-[-0.03em] break-all hover:underline"
          >
            {profile.email}
          </a>
          <p className="label mt-4">{profile.availability}</p>
        </div>
        <div className="flex flex-col gap-6">
          <ContactLinks links={profile.socialLinks.filter((l) => l.platform !== 'email')} variant="large" />
          {profile.resumeUrl ? (
            <ExternalLink href={profile.resumeUrl} className="btn-outline self-start">
              Download resume (PDF) <span aria-hidden="true">↓</span>
            </ExternalLink>
          ) : (
            <a href={`mailto:${profile.email}?subject=Resume%20request`} className="btn-outline self-start">
              Request resume by email
            </a>
          )}
        </div>
      </section>

      <div data-reveal className="mt-20 grid gap-14 lg:grid-cols-[1.3fr_1fr]">
        <section>
          <div className="flex items-start justify-between gap-4">
            <Stamp>Biography</Stamp>
            <PlaceholderNotice />
          </div>
          <div className="max-w-[62ch] space-y-4 text-[0.9375rem] leading-relaxed">
            {profile.biography.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </section>
        <section>
          <Stamp>Practice</Stamp>
          <p className="script text-[clamp(1.5rem,2.4vw,2.125rem)] leading-snug">{profile.practice}</p>
        </section>
      </div>

      <div data-reveal className="mt-20 grid gap-14 lg:grid-cols-2">
        <section>
          <Stamp>Experience</Stamp>
          <Timeline entries={profile.experience} />
        </section>
        <section>
          <Stamp>Education</Stamp>
          <Timeline entries={profile.education} />
          <div className="mt-12">
            <Stamp>Selected achievements &amp; credits</Stamp>
            <ul className="space-y-2 uppercase">
              {profile.achievements.map((a) => (
                <li key={a} className="border-line border-b pb-2">
                  {a}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  )
}
