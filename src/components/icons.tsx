/**
 * Player and UI icons as SVG. Text symbols like ⏮ ⏭ ▶ turn into colourful
 * emoji on iPhone, so the controls use these instead. They take the text
 * colour and size (1em) of the button they sit in.
 */
interface IconProps {
  className?: string
}

const base = { width: '1em', height: '1em', viewBox: '0 0 16 16', 'aria-hidden': true, focusable: false } as const

export function PrevIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} fill="currentColor">
      <rect x="2" y="3" width="2" height="10" />
      <path d="M14 3v10L5 8z" />
    </svg>
  )
}

export function NextIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} fill="currentColor">
      <rect x="12" y="3" width="2" height="10" />
      <path d="M2 3v10l9-5z" />
    </svg>
  )
}

export function PlayIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} fill="currentColor">
      <path d="M4 2.5v11L13.5 8z" />
    </svg>
  )
}

export function PauseIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} fill="currentColor">
      <rect x="3.5" y="2.5" width="3" height="11" />
      <rect x="9.5" y="2.5" width="3" height="11" />
    </svg>
  )
}

export function PlayPauseIcon({ playing, className }: IconProps & { playing: boolean }) {
  return playing ? <PauseIcon className={className} /> : <PlayIcon className={className} />
}

export function LockIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="7" width="10" height="7.25" />
      <path d="M5.25 7V4.75a2.75 2.75 0 0 1 5.5 0V7" />
      <path d="M8 9.75v2" strokeLinecap="square" />
    </svg>
  )
}
