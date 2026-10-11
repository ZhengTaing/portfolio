import { useEffect, useRef } from 'react'
import { prefersReducedMotion } from '../lib/motion'

type CaptureAudio = HTMLAudioElement & { captureStream?: () => MediaStream }

interface Props {
  audio: () => HTMLAudioElement | null
  playing: boolean
  /** Current song's URL; analysis restarts when it changes. */
  src?: string
  bars?: number
  className?: string
}

/** Same-origin files can be analysed; cross-origin ones (signed storage links) can't. */
const canAnalyse = (src?: string) => {
  if (!src) return false
  try {
    return new URL(src, window.location.href).origin === window.location.origin
  } catch {
    return false
  }
}

/**
 * Small equalizer for the song that's playing. Where the browser allows it
 * (Chrome and Edge, songs hosted on this site) the bars follow the real audio
 * through a copy of the stream, so playback itself is never rerouted. Elsewhere
 * they move with a smooth, music-like pattern. Bars settle when paused and hold
 * still with reduced motion.
 */
export function LiveEqualizer({ audio, playing, src, bars = 9, className = '' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const analysis = useRef<{ ctx: AudioContext; analyser: AnalyserNode; source?: MediaStreamAudioSourceNode } | null>(null)

  // Connect the analyser to a copy of the audio stream while playing.
  useEffect(() => {
    const el = audio() as CaptureAudio | null
    if (!el || !playing || !canAnalyse(src) || typeof el.captureStream !== 'function' || typeof AudioContext === 'undefined') return
    const connect = () => {
      try {
        const stream = el.captureStream!()
        if (stream.getAudioTracks().length === 0) return
        if (!analysis.current) {
          const ctx = new AudioContext()
          const analyser = ctx.createAnalyser()
          analyser.fftSize = 64
          analyser.smoothingTimeConstant = 0.8
          analysis.current = { ctx, analyser }
        }
        const a = analysis.current
        a.source?.disconnect()
        // Analyser only: it is not connected to the speakers, so nothing plays twice.
        a.source = a.ctx.createMediaStreamSource(stream)
        a.source.connect(a.analyser)
        void a.ctx.resume()
      } catch {
        analysis.current?.source?.disconnect()
        if (analysis.current) analysis.current.source = undefined
      }
    }
    connect()
    el.addEventListener('playing', connect)
    return () => {
      el.removeEventListener('playing', connect)
      analysis.current?.source?.disconnect()
      if (analysis.current) analysis.current.source = undefined
    }
  }, [audio, playing, src])

  useEffect(
    () => () => {
      void analysis.current?.ctx.close()
      analysis.current = null
    },
    [],
  )

  // Draw.
  useEffect(() => {
    const canvas = canvasRef.current
    const g = canvas?.getContext('2d')
    if (!canvas || !g) return
    const dpr = window.devicePixelRatio || 1
    const levels = new Float32Array(bars).fill(0.2)
    const data = new Uint8Array(32)
    const still = prefersReducedMotion()
    let color = '#ff6a4a'
    let frame = 0
    let n = 0
    let silent = 0

    const draw = (t: number) => {
      const { width, height } = canvas.getBoundingClientRect()
      if (canvas.width !== Math.round(width * dpr)) canvas.width = Math.round(width * dpr)
      if (canvas.height !== Math.round(height * dpr)) canvas.height = Math.round(height * dpr)
      if (n++ % 30 === 0) color = getComputedStyle(canvas).color || color

      let live = Boolean(playing && analysis.current?.source)
      if (live) {
        analysis.current!.analyser.getByteFrequencyData(data)
        // A protected (cross-origin) stream reads as silence: use the pattern instead.
        silent = data.some((v) => v > 0) ? 0 : silent + 1
        live = silent < 45
      }
      let settled = true
      for (let i = 0; i < bars; i++) {
        let target = 0.18
        if (playing && still) target = 0.35 + 0.4 * Math.abs(Math.sin(i * 1.7))
        else if (live) target = 0.12 + 0.88 * Math.pow(data[Math.min(1 + i * 2, data.length - 1)] / 255, 1.3)
        else if (playing) {
          const s = t / 1000
          target = 0.25 + 0.75 * Math.abs(Math.sin(s * (2.1 + i * 0.37) + i) * 0.6 + Math.sin(s * (3.3 + i * 0.21) + i * 2.3) * 0.4)
        }
        levels[i] += (target - levels[i]) * (still ? 1 : 0.22)
        if (Math.abs(levels[i] - target) > 0.01) settled = false
      }

      const w = canvas.width
      const h = canvas.height
      const step = w / bars
      const bw = Math.max(1, Math.floor(step * 0.5))
      g.clearRect(0, 0, w, h)
      g.fillStyle = color
      g.globalAlpha = playing ? 1 : 0.5
      for (let i = 0; i < bars; i++) {
        const bh = Math.max(dpr * 2, levels[i] * h)
        g.fillRect(Math.round(i * step), Math.round((h - bh) / 2), bw, Math.round(bh))
      }
      // Keep drawing while playing; when paused, stop once the bars have settled.
      frame = (playing && !still) || !settled ? requestAnimationFrame(draw) : 0
    }
    frame = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frame)
  }, [playing, bars])

  return <canvas ref={canvasRef} aria-hidden="true" className={`text-accent block ${className}`} />
}
