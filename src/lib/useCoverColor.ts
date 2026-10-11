import { useEffect, useState } from 'react'

const cache = new Map<string, string>()

/**
 * Picks a vivid, readable accent color from a cover image (most saturated
 * mid-tone, lifted so it stays legible on a dark page). Falls back to the
 * site's signal orange while loading or if the image can't be read.
 */
export function useCoverColor(src: string | undefined, fallback = '#ff6a4a') {
  // Re-render once a color has been extracted; the value itself lives in the cache.
  const [, setVersion] = useState(0)

  useEffect(() => {
    if (!src || cache.has(src)) return
    let cancelled = false
    const img = new Image()
    img.decoding = 'async'
    // Demo covers may be served from cloud storage; ask for CORS so the colors can be read.
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        cache.set(src, extract(img))
        if (!cancelled) setVersion((v) => v + 1)
      } catch {
        /* unreadable image: keep the fallback */
      }
    }
    img.src = src
    return () => {
      cancelled = true
    }
  }, [src])

  return (src && cache.get(src)) || fallback
}

function extract(img: HTMLImageElement) {
  const size = 32
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(img, 0, 0, size, size)
  const data = ctx.getImageData(0, 0, size, size).data
  let best = { score: -1, h: 10, s: 0.8 }
  for (let i = 0; i < data.length; i += 4) {
    const [h, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2])
    // Prefer saturated colors that aren't near black or white.
    const score = s * (1 - Math.abs(l - 0.55) * 1.6)
    if (score > best.score) best = { score, h, s }
  }
  // Lift lightness so text and buttons stay readable on the dark backdrop.
  const s = Math.max(0.45, Math.min(best.s, 0.85))
  return `hsl(${Math.round(best.h)} ${Math.round(s * 100)}% 68%)`
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  h *= 60
  return [h, s, l]
}
