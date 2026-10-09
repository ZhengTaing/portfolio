# Zheng Taing — Portfolio

A personal portfolio for software engineering, music and photography.
React + Vite + TypeScript + Tailwind CSS + React Router, with all content in typed data files.

## Local development

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # Vitest + Testing Library (routing, filters, lightbox, embeds, privacy)
npm run lint       # oxlint
npm run build      # type-check + production build into dist/ (also emits sitemap.xml and robots.txt)
npm run preview    # serve the production build locally
```

> If `npm install` fails with `Cannot read properties of null (reading 'edgesOut')`,
> your npm is older than 11. Run `npx npm@11 install` or upgrade npm.

## Design system

Each section is a "room" with its own palette, set with `data-theme` and defined in `src/index.css`:

| Section     | Theme      | Feel                                   |
| ----------- | ---------- | -------------------------------------- |
| Home        | `paper`    | Warm off-white, ink type, red script   |
| Projects    | `ink`      | Black, white type                      |
| Music       | `signal`   | Signal orange, ink type                |
| Visual Art  | `graphite` | Charcoal, so images carry the color    |
| About       | `jade`     | Green and cream editorial poster       |

Type: **Archivo** (variable width, headlines), **Space Mono** (labels and body), **Instrument Serif Italic** (script accents).
Fonts are self-hosted through Fontsource, so there are no third-party font requests.
Components only use semantic colors (`bg`, `fg`, `accent`, `muted`, `line`, `surface`), so a new theme is a few CSS variables.

The original direction mockup is in `design/mockup.html`.

## Adding content

Everything lives in `src/content/`. No component changes needed.

| File           | What it holds                                                    |
| -------------- | ---------------------------------------------------------------- |
| `profile.ts`   | Name, bio, email, social links, experience, education, resume    |
| `projects.ts`  | Projects and case studies (`featured: true` shows on Home)       |
| `releases.ts`  | Music releases, credits, streaming links and embed URLs          |
| `artworks.ts`  | Photography and visual art                                       |

Types for every field are in `src/types/content.ts`.

**Everything currently marked `[Placeholder]`, and every image under `public/media/`, is stand-in content.**
Entries with `placeholder: true` show a yellow "Placeholder" tag so nothing ships by accident.
Remove the flag when the real content is in.

### Images

- Put files in `public/media/...` and reference them as `/media/...`.
- Always set accurate `width` and `height` (prevents layout shift) and meaningful `alt` text.
- For photos, export a large file (~2400px long edge) for `imageUrl` and a small one (~800px) for `thumbnailUrl`, as WebP or AVIF.
- `npm run placeholders` / `node scripts/generate-placeholders.mjs` regenerates the stand-in SVGs.
- Replace `public/media/og-image.png` (1200×630) with a real social sharing card.

### Song audio (released music)

Released songs play in the site's own media player, not a Spotify embed.
Drop the audio into `public/media/audio/`, named after the release's `audioFile` in `releases.ts`
(e.g. `rose.mp3`, `romeo.m4a`). The player picks it up automatically, with no code change needed.
MP3 or M4A around 256 kbps is a good balance of quality and size. These files are public, so only add finished, released songs.

### Unreleased demos (password protected)

The Music page has a **Released** section (public) and an **Unreleased** section that links to `/music/unreleased`.
That page asks for a password, and the check happens **on the server**, not in the browser:

- Demo audio and its list live in `private-demos/` (see the README there). That folder is never part of the public site.
- `api/demos/*` are Vercel functions that check the password, set a signed, HttpOnly cookie for 7 days, and only then return the demo list and stream the audio.
- The password is the `DEMOS_PASSWORD` environment variable. `DEMOS_SESSION_SECRET` signs the cookie.
  - Locally: they are in `.env.local` (not committed). Change the password there.
  - On Vercel: add both under **Settings → Environment Variables**, then redeploy.
- Keep the GitHub repo **private** if you commit `private-demos/`, or deploy with the Vercel CLI from your computer.
- Changing the password logs everyone out the next time you also change `DEMOS_SESSION_SECRET`.

Anyone with the password can still record what they hear, so share it only with people you trust.

### Resume

Add `public/resume.pdf` and set `resumeUrl: '/resume.pdf'` in `profile.ts`. Until then, the About page offers a "Request resume by email" button.

## Deployment (Vercel)

The code lives on GitHub; the live site is deployed to Vercel from this computer:

```bash
npm run deploy      # runs the tests, builds, then publishes to Vercel (production)
```

Deploying from this computer (not from GitHub) is deliberate: it uploads the private demo
audio in `private-demos/` straight to Vercel, so it never goes to GitHub. `.vercelignore`
keeps the WAV masters, photo originals and screenshots out of the upload.

The demo password lives in Vercel → Project → Settings → Environment Variables
(`DEMOS_PASSWORD`, `DEMOS_SESSION_SECRET`). Change it there and redeploy.
`vercel.json` adds the single-page-app rewrite, caching and security headers.

## Pre-launch checklist

- [ ] Replace all placeholder copy, links and images (search for `[Placeholder]`, `placeholder: true`, `example.com`)
- [ ] Real email, GitHub, LinkedIn, Spotify and other profile URLs in `profile.ts`
- [ ] Resume PDF
- [ ] Production domain in `src/lib/site.ts` and `index.html`
- [ ] Real social card image
- [ ] `npm test && npm run build` pass
