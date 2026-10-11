import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { PlayerProvider, usePlayer } from '../lib/player'
import { themeForPath } from '../lib/site'
import { useScrollReveal } from '../lib/useScrollReveal'
import { CustomCursor } from './CustomCursor'
import { Footer } from './Footer'
import { Navigation } from './Navigation'
import { NowPlayingBar } from './NowPlayingBar'

/** Leaves room under the footer so the now-playing bar never covers it. */
function PlayerSpacer() {
  const { current } = usePlayer()
  return current ? <div aria-hidden="true" className="h-[4.5rem] bg-[#0b0b0b]" /> : null
}

function SideRail() {
  return (
    <div
      aria-hidden="true"
      className="bg-paper text-ink border-ink fixed inset-y-0 left-0 z-20 hidden w-14 items-center justify-center border-r-2 md:flex"
    >
      <span className="rotate-180 text-[0.625rem] font-bold tracking-[0.18em] uppercase [writing-mode:vertical-rl]">
        Engineering — Music — Visual Art · Portfolio v1.0
      </span>
    </div>
  )
}

export function SiteLayout() {
  const { pathname } = useLocation()
  const theme = themeForPath(pathname)
  const mainRef = useRef<HTMLElement>(null)
  const firstRender = useRef(true)
  const shellRef = useRef<HTMLDivElement>(null)
  useScrollReveal(shellRef)

  // Each section is its own "room": apply its palette to the whole document
  // so overscroll areas match too.
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  // On navigation: scroll to top and move focus to the new page for screen readers.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    window.scrollTo({ top: 0 })
    mainRef.current?.focus({ preventScroll: true })
  }, [pathname])

  return (
    <PlayerProvider>
    <div data-theme={theme} className="bg-bg text-fg min-h-screen transition-colors duration-300">
      <a href="#main" className="skip-link label">
        Skip to content
      </a>
      <SideRail />
      <div ref={shellRef} className="relative md:pl-14">
        <Navigation overlay={pathname === '/'} />
        <main id="main" ref={mainRef} tabIndex={-1} className="outline-none">
          <div key={pathname} className="page-enter">
            <Outlet />
          </div>
        </main>
        <Footer />
        <PlayerSpacer />
      </div>
      <NowPlayingBar />
      <CustomCursor />
    </div>
    </PlayerProvider>
  )
}
