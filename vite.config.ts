/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { existsSync, readdirSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { resolve } from 'node:path'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import { projects } from './src/content/projects'
import { releases } from './src/content/releases'
import { SITE_URL as DEFAULT_SITE_URL } from './src/lib/site'

const SITE_URL = process.env.SITE_URL || DEFAULT_SITE_URL

/** Emits sitemap.xml and robots.txt from the content data at build time. */
function seoFiles(): Plugin {
  return {
    name: 'seo-files',
    apply: 'build',
    generateBundle() {
      const paths = [
        '/',
        '/projects',
        '/music',
        '/visual-art',
        '/about',
        ...projects.map((p) => `/projects/${p.slug}`),
        ...releases.map((r) => `/music/${r.slug}`),
      ]
      const urls = paths.map((p) => `  <url><loc>${new URL(p, SITE_URL)}</loc></url>`).join('\n')
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
      })
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: `User-agent: *\nAllow: /\n\nSitemap: ${new URL('/sitemap.xml', SITE_URL)}\n`,
      })
    },
  }
}

/**
 * Runs the same /api/demos handlers that Vercel uses, inside the dev server,
 * so the password-protected demos page works with `npm run dev`.
 */
function demosApi(): Plugin {
  const routes: Record<string, Record<string, string>> = {
    '/api/demos': { GET: 'list' },
    '/api/demos/login': { POST: 'login' },
    '/api/demos/logout': { POST: 'logout' },
    '/api/demos/audio': { GET: 'audio' },
  }
  return {
    name: 'demos-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next) => {
        const url = new URL(req.url ?? '/', 'http://localhost')
        // Never let the dev server hand out the private files directly.
        if (url.pathname.startsWith('/private-demos') || url.pathname.startsWith('/server/')) {
          res.statusCode = 404
          return res.end()
        }
        const handlerName = routes[url.pathname]?.[req.method ?? 'GET']
        if (!handlerName) return next()
        const mod = await server.ssrLoadModule('/server/demos.ts')
        const chunks: Buffer[] = []
        for await (const c of req) chunks.push(c as Buffer)
        const headers = new Headers()
        for (const [k, v] of Object.entries(req.headers)) if (typeof v === 'string') headers.set(k, v)
        const request = new Request(new URL(req.url ?? '/', `http://${req.headers.host}`), {
          method: req.method,
          headers,
          body: chunks.length ? Buffer.concat(chunks) : undefined,
        })
        const response: Response = await mod[handlerName](request)
        res.statusCode = response.status
        response.headers.forEach((v, k) => res.setHeader(k, v))
        res.end(Buffer.from(await response.arrayBuffer()))
      })
    },
  }
}

/**
 * `virtual:audio-files` lists the files in public/media/audio/, so a song's
 * player appears as soon as its audio file is dropped in. The dev server
 * reloads when that folder changes.
 */
function audioFiles(): Plugin {
  const id = 'virtual:audio-files'
  const resolved = '\0' + id
  const dir = resolve(process.cwd(), 'public/media/audio')
  const list = () =>
    existsSync(dir) ? readdirSync(dir).filter((f) => /\.(mp3|m4a|aac|wav|ogg)$/i.test(f)) : []
  return {
    name: 'audio-files',
    resolveId: (source) => (source === id ? resolved : undefined),
    load: (moduleId) => (moduleId === resolved ? `export default ${JSON.stringify(list())}` : undefined),
    configureServer(server) {
      server.watcher.add(dir)
      const refresh = (file: string) => {
        if (!file.startsWith(dir)) return
        const mod = server.moduleGraph.getModuleById(resolved)
        if (mod) server.moduleGraph.invalidateModule(mod)
        server.ws.send({ type: 'full-reload' })
      }
      server.watcher.on('add', refresh)
      server.watcher.on('unlink', refresh)
    },
  }
}

export default defineConfig(({ mode }) => {
  // Make .env.local values (DEMOS_PASSWORD, DEMOS_SESSION_SECRET) visible to the dev API.
  Object.assign(process.env, loadEnv(mode, process.cwd(), 'DEMOS_'))
  return {
  plugins: [react(), tailwindcss(), seoFiles(), demosApi(), audioFiles()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
  }
})
