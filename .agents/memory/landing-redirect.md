---
name: Landing page redirect pattern
description: How the app routes fresh visitors to the landing page and lets them enter the app
---

## Redirect mechanism
- `app-content.jsx` checks `sessionStorage.getItem('app_entered')` on mount
- If the flag is NOT set → `navigate('/landing', { replace: true })`
- The `/landing` route is a top-level sibling of the `/` Layout route (not nested inside it), so it renders standalone without the app header

## Entry flag
- All "Continue to Site" and "Enter Platform" buttons in `src/pages/landing/index.tsx` call `sessionStorage.setItem('app_entered', '1')` before `navigate('/')`
- sessionStorage clears on tab/browser close, so each new session starts at the landing page

**Why:** Gives the admin a public-facing marketing page that every fresh visitor sees. Users who are already in the app session are unaffected.
