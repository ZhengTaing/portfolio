# How to edit your portfolio

A beginner's guide. You don't need to know React to change your content.

## 1. Open the project

1. Install [VS Code](https://code.visualstudio.com) if you don't have it.
2. In VS Code, choose **File → Open Folder…** and pick `Documents/portfolio`.
3. Open the built-in terminal with **View → Terminal**.

## 2. See the site while you edit

Type this in the terminal and press Enter:

```bash
npm run dev
```

Then open **http://localhost:5173** in your browser.
Leave it running. Each time you save a file, the page updates on its own.
To stop it, click in the terminal and press `Ctrl + C`.

## 3. Where everything lives

Almost everything you'll want to change is in **4 files** inside `src/content/`:

| To change…                                     | Open this file           |
| ---------------------------------------------- | ------------------------ |
| Your name, bio, email, social links, jobs      | `src/content/profile.ts` |
| Your coding projects                           | `src/content/projects.ts`|
| Your songs and releases                        | `src/content/releases.ts`|
| Your photos and artwork (Visual Art page)      | `src/content/artworks.ts`|
| Your secret demos (Unreleased page)            | `private-demos/demos.json` + audio files in `private-demos/` |

Images go in `public/media/` (for example `public/media/gallery/`).
You can leave everything else alone.

## 4. Your first edit (try this now)

1. Open `src/content/profile.ts`.
2. Find this line:
   ```ts
   location: '[City, State]',
   ```
3. Change it to your city, keeping the quotes and the comma:
   ```ts
   location: 'Los Angeles, CA',
   ```
4. Save (`Cmd + S`). The top of the homepage now shows your city.

That's the whole pattern: **find the text between quotes, replace it, save.**

## 5. The three rules that prevent most errors

1. **Keep the quotes.** Text always sits inside `'single quotes'`.
   If your text has an apostrophe, put a backslash before it: `'Let\'s go'`.
2. **Keep the commas** at the end of lines, and the `{ }` and `[ ]` brackets in pairs.
3. **Don't rename the words on the left** of the colon (`title:`, `summary:`…). Only change the values on the right.

If the browser shows a red error after you save, press `Cmd + Z` to undo, save again, and look for a missing quote or comma.

## 6. Common tasks

### Change a project

In `projects.ts`, each project is a block between `{` and `},`. Edit `title`, `summary`, `technologies`, the `caseStudy` text, and so on.

- `featured: true` shows the project on the homepage.
- `status` can be `'complete'`, `'in-progress'`, `'prototype'` or `'archived'`.
- No GitHub link? Delete the `repositoryUrl` line. The page handles it.
- Delete `placeholder: true` once the project is real. That removes the yellow tag.

**To add a project:** copy a whole block from `{` to `},`, paste it below, then give it a new `id` and a new `slug`. The slug becomes the web address (`/projects/your-slug`), so use lowercase letters and dashes.

### Add a photo

1. Drop the file into `public/media/gallery/`, for example `sunset.jpg`.
2. In `artworks.ts`, add a line to the `seeds` list:
   ```ts
   ['sunset', 2400, 1600, 'street', 'Sunset', '35mm film', 'Orange sunset over a parking lot'],
   ```
   In order, that's: file name, width, height, category, title, medium and a description for screen readers.
3. The list currently expects `.svg` files. Change `.svg` to `.jpg` in the two `imageUrl` / `thumbnailUrl` lines, or ask Claude to set it up for mixed file types.

To find a photo's width and height on a Mac, open it in Preview and choose **Tools → Show Inspector**.

### Add a song

1. In `releases.ts`, copy a release block and edit it. Set `audioFile: 'my-song'`.
2. Put the audio in `public/media/audio/` named `my-song.mp3` (or `.m4a`).
   The music player shows it right away.
3. Add Spotify and Apple Music links under `platformLinks` so people can also stream it there.

### Edit an Unreleased demo (pitch info and cover)

Everything for the password page lives in the `private-demos/` folder (it never goes to GitHub).

**Change the info:** open `private-demos/demos.json`, find the song by its `"title"`, and edit the values:

```json
"title": "Moonlight",
"targetArtists": ["TXT", "NCT DREAM", "SEVENTEEN"],
"market": ["K-pop"],
"actType": ["Boy group"],
"genre": ["Pop"],
"key": "D major",
"bpm": 123,
"status": "available",
"pitchNotes": "One or two sentences shown on the card.",
```

- `status` is one of `available`, `on-hold`, `reserved`, `placed`.
  For `on-hold` add `"holdUntil": "2026-11-30",`; for `placed` add `"placedWith": "Artist name",`.
- Market, act type and genre must be spelled like the filter buttons (e.g. `"Dance pop"`, `"Girl group"`).
- `"privateNotes"` and `"reservation"` are for you only; visitors never see them.

**Change a cover:** save the image (JPG or PNG) into `private-demos/covers/`, named after the song's `"id"`
(e.g. `moonlight-ai-demo.jpg`), replacing the old one. For a brand-new cover file, also set
`"cover": "covers/your-file.jpg",` on that song.

**Add a new demo:** drop the audio into `private-demos/`, run `npm run demos`, then fill in its fields.

**See it locally:** `npm run dev` → http://localhost:5173/music/unreleased (refresh after saving).

**Publish it:** `npm run deploy` (or just ask Claude to deploy).

### Songs and credits

In `src/content/releases.ts`, your own songs use `format: 'single'` and appear under **My releases**.
Songs you wrote for someone else use `format: 'writing'` and appear under **Written for other artists**.
Song titles keep the exact capitalization you type (`ily.`, `rose`).

### Add your resume

Save your PDF as `public/resume.pdf`, then in `profile.ts` change
`resumeUrl: undefined,` to `resumeUrl: '/resume.pdf',`.

## 7. Check your work before publishing

```bash
npm test        # automated checks; it should say "passed"
npm run build   # makes sure the site builds without errors
```

## 8. Going further

- **Colors and fonts:** `src/index.css` (the `@theme` and `[data-theme=…]` sections at the top).
- **Page layouts:** `src/pages/` (one file per page).
- **Reusable pieces** (cards, nav, footer): `src/components/`.

These use React and Tailwind, so they're a good next step once content editing feels easy.
You can also ask Claude in this project to make any change for you or to explain a file line by line.
