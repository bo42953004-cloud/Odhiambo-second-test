---
name: Announcement ticker context placement
description: Why AnnouncementTicker reads localStorage instead of using the AdminPortal context
---

Layout (src/components/layout/index.tsx) is a React Router route element rendered OUTSIDE AdminPortalProvider (which lives in app-content.jsx). Any component rendered inside Layout cannot use useAdminPortal().

**Why:** AdminPortalProvider is nested inside the router tree but Layout is the route wrapper — the two are siblings in the tree, not parent/child.

**How to apply:** Any component placed in layout/index.tsx that needs admin settings must read from localStorage directly and listen to the 'admin_settings_updated' window event (dispatched by applyColors() in AdminPortalContext). Do not call useAdminPortal() from layout-level components.
