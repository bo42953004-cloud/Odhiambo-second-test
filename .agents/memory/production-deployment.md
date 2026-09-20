---
name: Production deployment architecture
description: The production serving requirement for the SPA and admin settings API
---

The published app must run the Express server after building the frontend. The server serves `dist`, provides `/api/settings`, and handles SPA history fallback; a static-only deployment cannot preserve admin settings or themes across sessions.

**Why:** Admin settings are persisted through the API, and direct routes such as `/landing` need an SPA fallback. A static deployment can serve the assets but cannot run the settings API.

**How to apply:** Keep the deployment build as `npm run build`, run `node server.js`, and make the server honor Replit's assigned `PORT`. Use the dedicated settings port only for development when no deployment `PORT` is present.