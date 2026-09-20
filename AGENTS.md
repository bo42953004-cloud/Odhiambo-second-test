# Base44 Dev Environment

## Overview
Deriv trading bot SPA (React + Rsbuild) with an Express settings API (`server.js`).
The frontend dev server runs on port 5000 inside the container, mapped to host port 3000.
The Express settings API runs on port 3001 inside the container (proxied via rsbuild's `/api` proxy).

## Running
```bash
docker compose -f docker-compose.base44.yml up -d --build
```
The first build installs dependencies with pnpm (npm 10.x crashes on this project's lockfile).
A named Docker volume preserves `node_modules` across restarts.

If `package.json` dependencies change, force a rebuild:
```bash
docker compose -f docker-compose.base44.yml down -v && docker compose -f docker-compose.base44.yml build --no-cache && docker compose -f docker-compose.base44.yml up -d
```

## Architecture
- **Frontend**: Rsbuild dev server (`rsbuild dev --port 5000`), React SPA entry at `src/main.tsx`
- **Backend**: Express (`server.js`) — settings API at `/api/settings` (GET/POST), stores to `admin-settings.json`
- **rsbuild proxy**: `/api` requests proxy to `http://localhost:3001` (the Express server)

## Key files
- `rsbuild.config.ts` — bundler config, aliases, smartcharts asset copying, dev proxy
- `server.js` — Express settings API
- `src/external/bot-skeleton/` — vendored Deriv bot engine (uses `immutable`, `lodash.debounce`, `rxjs`)
- `brand.config.json` — brand colors/theme, generates CSS via `scripts/generate-brand-css.js`

## Secrets
- `NEXT_PUBLIC_DERIV_APP_ID` — Deriv app ID for OAuth/WebSocket. Optional at boot; get from https://developers.deriv.com/dashboard/

## Notes
- pnpm is used instead of npm due to npm 10.x install crashes on bind mounts
- The rsbuild bin symlink is manually created in the Dockerfile (`node_modules/.bin/rsbuild`)
- HMR WebSocket may fail through the preview proxy — this doesn't affect the app rendering
