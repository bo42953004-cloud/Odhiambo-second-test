---
name: Global admin settings architecture
description: How admin settings are persisted server-side and served to all visitors
---

Two-layer persistence: Express backend (server.js, port 3001) writes to admin-settings.json on POST /api/settings; AdminPortalContext.tsx fetches on mount and POSTs on every save. rsbuild proxies /api to localhost:3001 in dev.

**Why:** localStorage is per-browser so settings were never shared across visitors.

**How to apply:** For production, ensure server.js is running alongside the frontend (autoscale deployment, not static). The same /api proxy config works because static files are served by Express too when NODE_ENV=production.
