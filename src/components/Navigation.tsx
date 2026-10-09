import { useEffect, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { navItems } from '../lib/site'

export function Navigation({ overlay = false }: { overlay?: boolean }) {
  const [open, setOpen] = useState(false)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // Escape closes the menu; focus moves into it when it opens.
  useEffect(() => {
    if (!open) return
    panelRef.current?.querySelector<HTMLElement>('a')?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        toggleRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `group flex justify-end gap-2 py-0.5 uppercase transition-colors hover:text-accent ${isActive ? 'text-accent underline decoration-2 underline-offset-4' : ''}`

  return (
    <header
      className={`z-30 flex items-start justify-between px-4 pt-5 sm:px-8 sm:pt-6 ${overlay ? 'absolute inset-x-0 top-0 text-white [text-shadow:0_1px_12px_rgb(0_0_0/0.4)] md:left-14' : 'relative'}`}
    >
      <Link to="/" className="font-display text-[1.375rem] leading-[0.9] font-black tracking-[-0.04em]" aria-label="Zheng Taing, home">
        ZHENG
        <br />
        TAING
      </Link>

      <nav aria-label="Primary" className="hidden text-right text-[0.8125rem] leading-loose md:block">
        <ul>
          {navItems.slice(1).map((item) => (
            <li key={item.path}>
              <NavLink to={item.path} className={linkClass}>
                <span aria-hidden="true">
                  {item.number}
                </span>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <button
        ref={toggleRef}
        type="button"
        className="label border-2 border-current px-3 py-2 md:hidden"
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? 'Close' : 'Menu'}
      </button>

      {open && (
        <div
          id="mobile-menu"
          ref={panelRef}
          className="bg-ink text-paper fixed inset-0 z-40 flex flex-col px-4 pt-5 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
        >
          <div className="flex items-start justify-between">
            <span className="font-display text-[1.375rem] leading-[0.9] font-black tracking-[-0.04em]" aria-hidden="true">
              ZHENG
              <br />
              TAING
            </span>
            <button
              type="button"
              className="label border-2 border-current px-3 py-2"
              onClick={() => {
                setOpen(false)
                toggleRef.current?.focus()
              }}
            >
              Close
            </button>
          </div>
          <nav aria-label="Primary mobile" className="mt-auto mb-10">
            <ul>
              {navItems.map((item) => (
                <li key={item.path} className="border-b border-[#333]">
                  <NavLink
                    to={item.path}
                    end={item.path === '/'}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      `display flex items-baseline gap-3 py-4 text-[2.75rem] ${isActive ? 'text-signal' : ''}`
                    }
                  >
                    <span className="font-mono text-sm font-normal tracking-normal" aria-hidden="true">
                      {item.number}
                    </span>
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </header>
  )
}
