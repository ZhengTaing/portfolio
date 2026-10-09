# Private demos

Files in this folder are **never** published as part of the public site.
They are only served by the password-checked `/api/demos` functions.

## Adding a demo

1. Drop the audio file in this folder (MP3, M4A or WAV).
   Name it the way you want it shown, e.g. `Song Name (ai demo).mp3` or `Song Name (v2).m4a`.
2. In the project folder, run:

   ```bash
   npm run demos
   ```

   This converts WAVs to small `.m4a` copies in `web/` (your originals stay as they are)
   and rebuilds `demos.json`. Titles, notes and dates you edited by hand in `demos.json` are kept.

## Deploying

Only `demos.json`, MP3/M4A files and the `web/` folder are uploaded with the site (see `vercel.json`).
The large WAV originals stay on your computer.

Keep the GitHub repository **private** if this folder is committed, or deploy
with the Vercel CLI from your computer so the files never go to GitHub.
