---
name: Deriv OAuth wiring
description: How Deriv app ID and callback domain flow from env var → admin settings override → OAuth URL generation
---

# Deriv OAuth Wiring

## The rule
`NEXT_PUBLIC_DERIV_APP_ID` (set in Replit shared env vars, value `33FxewyqGJ899zO3Tjwzt`) is the build-time default. Admin can override both the app ID and callback domain via the 🔑 Deriv Login tab in the admin portal — no redeploy needed.

**Why:** Replit prohibits writing `.env.production` (security anti-pattern). The env var system is used instead. The admin override gives the operator runtime control without touching code or env vars.

## How to apply
- `generateOAuthURL` in `config.ts` calls `getAdminDerivSettings()` which reads `admin_portal_settings` from localStorage
- `App.tsx` OAuth callback handler (`handleOAuthCallback`) does the same inline localStorage read
- Both fall back to `process.env.NEXT_PUBLIC_DERIV_APP_ID` / `window.location.origin` when admin fields are blank
- The 🔑 Deriv Login admin tab (`DerivIntegration.tsx`) writes to settings via `updateSettings({ derivAppId, derivCallbackDomain })`
- Settings persist to `admin-settings.json` via the Express backend (port 3001) and also to localStorage

## What to register in Deriv developer portal
The redirect URI must match exactly what is configured (admin override OR `window.location.origin` if blank). The admin tab shows the exact active URL to copy into the Deriv portal.
