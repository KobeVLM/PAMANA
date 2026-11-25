# PAMANA — Frontend

React 18 + TypeScript single-page app (Vite) for **PAMANA: Heritage Quest**, a gamified Filipino language-learning app for Grade 2 learners.

## Tech stack
- **React 19** + **Vite 8** + **TypeScript**
- **Tailwind CSS 3.4** + shadcn/ui primitives
- **react-router-dom 7**, **axios**, **recharts**, **react-dnd**
- Context-based state (`AuthContext`, `AudioContext`) — no Redux

## Getting started
```bash
npm install
npm run dev      # http://localhost:5173 (proxies /api -> http://localhost:8080)
```

## Scripts
| Script | Purpose |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check (`tsc -b`) + production build |
| `npm run lint` | ESLint |
| `npm run normalize:audio` | Peak-normalize all voiceover MP3s (see below) |
| `npm run preview` | Preview the production build |

## Audio normalization

All voiceover/SFX and NPC MP3 assets are peak-normalized to **−1.0 dBFS** with
a clear vocal EQ, so a child hears the same loudness in every module.

```bash
npm run normalize:audio             # rewrite all 173 MP3s in place
npm run normalize:audio -- --check  # verify peaks, change nothing (non-zero exit if any drift)
npm run normalize:audio -- --dry-run# print the gain plan without writing
```

`scripts/normalize-audio.mjs` runs two ffmpeg passes per file: `volumedetect`
measures the EQ'd peak, then the inverse gain is encoded at 192 kbps / 44.1 kHz
through a −1 dBFS limiter. If MP3 overshoot pushes the result outside ±0.3 dBFS,
it re-encodes from the **original** (never stacking EQ twice) with extra
headroom. `--check` measures the raw peak because the EQ is already baked in.

ffmpeg is resolved from `FFMPEG_PATH`, then the local `ffmpeg-static`
devDependency, then the system `PATH`; the binary needs `libmp3lame`. Re-run the
normalizer after adding or replacing any `.mp3` under `public/audio/`,
`public/static/assets/audio/npc/`, or `src/components/music/`.

## Project layout
```
src/
  components/   layout, game components, shadcn ui primitives
  contexts/     AuthContext, AudioContext
  lib/          axios api client, utils
  pages/        auth, landing, home, trail, modules, mastery, dashboard, settings
  types/        shared TypeScript types
```

## Deployment
Production deploys to **Vercel**; `vercel.json` rewrites `/api/*` to the Spring Boot backend on Render and serves `index.html` for client-side routing.
