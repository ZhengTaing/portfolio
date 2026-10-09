// Generates lightweight SVG placeholder media into public/media.
// Every file is clearly marked "PLACEHOLDER" so it is never mistaken for real
// work. Replace these files (or point the content data at new ones) when real
// screenshots, artwork and photographs are ready.
//
//   node scripts/generate-placeholders.mjs

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'media')

// Small deterministic PRNG so output is stable between runs.
function rng(seed) {
  let s = 0
  for (const c of seed) s = (s * 31 + c.charCodeAt(0)) >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 2 ** 32
  }
}

const palettes = {
  ink: ['#0e0e0e', '#1d1d1d', '#f5f0e8', '#e8492a'],
  signal: ['#e8492a', '#0e0e0e', '#f5f0e8', '#ff8a6e'],
  jade: ['#2e6a50', '#a7f0cf', '#0e0e0e', '#f6e7dd'],
  mono: ['#d4d3d8', '#6f6f78', '#2b2b2e', '#f2f2f2'],
}

function stripes(r, w, h, [bg, a, b]) {
  let out = `<rect width="${w}" height="${h}" fill="${bg}"/>`
  const n = 6 + Math.floor(r() * 10)
  for (let i = 0; i < n; i++) {
    const x = (i / n) * w
    const bh = h * (0.2 + r() * 0.7)
    out += `<rect x="${x.toFixed(1)}" y="${(h - bh).toFixed(1)}" width="${(w / n - 6).toFixed(1)}" height="${bh.toFixed(1)}" fill="${r() > 0.5 ? a : b}" opacity="${(0.35 + r() * 0.6).toFixed(2)}"/>`
  }
  return out
}

function circles(r, w, h, [bg, a, b, c]) {
  let out = `<rect width="${w}" height="${h}" fill="${bg}"/>`
  for (let i = 0; i < 5; i++) {
    out += `<circle cx="${(r() * w).toFixed(0)}" cy="${(r() * h).toFixed(0)}" r="${(Math.min(w, h) * (0.12 + r() * 0.35)).toFixed(0)}" fill="${[a, b, c][i % 3]}" opacity="${(0.25 + r() * 0.6).toFixed(2)}"/>`
  }
  return out
}

function grid(r, w, h, [bg, a, b]) {
  let out = `<rect width="${w}" height="${h}" fill="${bg}"/>`
  const cell = Math.min(w, h) / 10
  for (let y = 0; y < h; y += cell)
    for (let x = 0; x < w; x += cell)
      if (r() > 0.62)
        out += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(cell - 4).toFixed(1)}" height="${(cell - 4).toFixed(1)}" fill="${r() > 0.7 ? b : a}"/>`
  return out
}

function gradient(r, w, h, [bg, a, b]) {
  const id = `g${Math.floor(r() * 1e6)}`
  return `<defs><radialGradient id="${id}" cx="${(0.2 + r() * 0.6).toFixed(2)}" cy="${(0.2 + r() * 0.6).toFixed(2)}" r="0.9"><stop offset="0" stop-color="${a}"/><stop offset="0.55" stop-color="${bg}"/><stop offset="1" stop-color="${b}"/></radialGradient></defs><rect width="${w}" height="${h}" fill="url(#${id})"/>`
}

const patterns = { stripes, circles, grid, gradient }

function svg({ name, w, h, palette, pattern, label }) {
  const r = rng(name)
  const p = palettes[palette]
  const fg = palette === 'mono' ? '#0e0e0e' : p[2]
  const body = patterns[pattern](r, w, h, p)
  const fs = Math.round(Math.min(w, h) / 22)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${body}<rect x="${fs}" y="${h - fs * 3.2}" width="${fs * 11}" height="${fs * 2.2}" fill="${p[0]}" opacity="0.85"/><text x="${fs * 1.6}" y="${h - fs * 1.7}" font-family="monospace" font-size="${fs}" letter-spacing="2" fill="${fg}">PLACEHOLDER</text><text x="${fs}" y="${fs * 2}" font-family="monospace" font-size="${Math.round(fs * 0.8)}" letter-spacing="2" fill="${fg}" opacity="0.8">${label.toUpperCase()}</text></svg>`
}

const files = [
  // Release artwork (square)
  ...['release-a', 'release-b', 'release-c', 'release-d'].map((slug, i) => ({
    name: `music/${slug}`,
    w: 1200,
    h: 1200,
    palette: ['signal', 'ink', 'jade', 'mono'][i],
    pattern: ['stripes', 'circles', 'gradient', 'grid'][i],
    label: `${slug} / artwork`,
  })),
  // The social card is public/media/og-image.jpg (1200x630); replace it directly.
]

for (const f of files) {
  const path = join(root, `${f.name}.svg`)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, svg(f))
}
console.log(`Wrote ${files.length} placeholder files to public/media`)
