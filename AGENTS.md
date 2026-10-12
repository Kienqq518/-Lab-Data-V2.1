# AGENTS.md

## Cursor Cloud specific instructions

### Overview
This repo is a **single front-end product**: a Vite 7 + React 19 design system and clickable inspector-app prototype (`数蚕 Lab Data`). It is client-side only — there is **no backend, database, or environment variables** to configure. The referenced production LIMS/web admin live outside this repo and are out of scope.

### Services
There is exactly one runnable service: the **Vite dev server**.

- Install: `npm install` (uses `package-lock.json`; run by the startup update script).
- Dev: `npm run dev` — serves on `0.0.0.0:5173` (see `package.json`).
- Build: `npm run build` — outputs to `dist/`.
- Preview built output: `npm run preview`.

### Lint / Test
- There is **no lint script** wired up. `_adherence.oxlintrc.json` exists but `oxlint` is not installed or referenced in `package.json` scripts.
- There is **no test framework or test scripts**. Do not expect `npm test` to work.

### Notes / gotchas
- The app is a phone-sized prototype centered in the viewport; it uses mock data (`src/mock.js`, `src/screens/collect-model.js`). No login is required — the `登录` button just enters the app.
- Hello-world flow: open `http://localhost:5173/` → click `登录` → `检测` tab → pick a device/task → data collection screen → submit.
- Icons in the standalone prototypes under `ui_kits/` load Lucide from a CDN; this is optional and the main app works offline without it.
