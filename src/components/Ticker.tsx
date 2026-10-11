import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'

/**
 * One line of text that scrolls sideways like a music-player marquee when it's
 * too long to fit, so every detail can be read without shrinking or wrapping.
 * It moves while `running` (the song is playing) and holds still when paused.
 * With reduced motion it becomes a line you can scroll by hand instead.
 */
export function Ticker({ children, running, className = '', speed = 40 }: { children: ReactNode; running: boolean; className?: string; speed?: number }) {
  const boxRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)
  const [overflow, setOverflow] = useState(0)

  useLayoutEffect(() => {
    const box = boxRef.current
    const text = textRef.current
    if (!box || !text) return
    const measure = () => setOverflow(text.scrollWidth > box.clientWidth + 1 ? text.scrollWidth : 0)
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(measure)
    ro.observe(box)
    ro.observe(text)
    return () => ro.disconnect()
  }, [children])

  const gap = 64
  return (
    <div
      ref={boxRef}
      className={`ticker relative overflow-hidden whitespace-nowrap ${overflow ? (running ? 'ticker-fade' : 'ticker-fade-end') : ''} ${className}`}
    >
      <div
        className={`inline-flex ${overflow ? 'ticker-track' : ''}`}
        style={
          overflow
            ? {
                animationDuration: `${(overflow + gap) / speed}s`,
                animationPlayState: running ? 'running' : 'paused',
                ['--ticker-distance' as string]: `-${overflow + gap}px`,
              }
            : undefined
        }
      >
        <span ref={textRef}>{children}</span>
        {overflow > 0 && (
          <span aria-hidden="true" style={{ paddingLeft: gap }}>
            {children}
          </span>
        )}
      </div>
    </div>
  )
}
