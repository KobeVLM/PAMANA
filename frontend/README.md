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
| `npm run preview` | Preview the production build |

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
