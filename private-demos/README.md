# Private demos (song pitches)

Files in this folder are **never** published to GitHub. They are only served by the
password-checked `/api/demos` functions on Vercel.

## Adding a demo

1. Drop the audio file here (MP3, M4A or WAV), named how you want it shown,
   e.g. `Song Name (ai demo).mp3`.
2. Run `npm run demos`. It adds the song to `demos.json` with blank pitch fields
   and makes small streaming copies of WAVs. Everything you've already filled in is kept.
3. Run `npm run deploy` to publish.

## Pitch fields in `demos.json`

```json
{
  "title": "Moonlight",
  "demoArtist": "Zheng Taing",                 // who recorded / is on the demo
  "targetArtists": ["Artist A", "Artist B"],   // who you're pitching to ([] = "Open pitch")
  "market": ["K-pop", "Western pop"],          // K-pop | Western pop (one or more)
  "actType": ["Girl group"],                   // Girl group | Boy group | Solo artist (one or more)
  "genre": ["Dance pop", "EDM"],               // Pop | Dance pop | Alt pop | Dark pop | R&B | Ballad | Pop ballad | EDM | Synth pop | Jersey club | Rap | Folk
  "key": "D major",
  "bpm": 118,
  "status": "available",                       // available | on-hold | reserved | placed
  "holdUntil": "2026-10-30",                   // on-hold only (shown on the card)
  "placedWith": "Artist C",                    // placed only (shown as "Cut by →")
  "pitchNotes": "Short note shown on the card.",
  "cover": "covers/moonlight-ai-demo.jpg",     // optional image in private-demos/covers/
  "privateNotes": "Only for you.",             // NEVER sent to visitors
  "reservation": "Who / terms"                 // NEVER sent to visitors
}
```

Spell market, act type and genre exactly as listed so the filters pick them up.
Without a `cover`, the site shows a generated color cover.
