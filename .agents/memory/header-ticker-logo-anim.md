---
name: Header ticker and logo text animation
description: How the live market tick display and brand-name animations are wired in the header
---

## HeaderTicker component
- File: `src/components/layout/app-logo/HeaderTicker.tsx`
- Rendered inside `LogoMark.tsx` below the logo mark inner row
- Gets current symbol via `useStore().chart_store.symbol` (MobX observable)
- Uses `reaction()` from mobx (not observer) + `useEffect` to subscribe/unsubscribe when symbol changes
- Tick subscription: `api_base.api?.send({ ticks: symbol, subscribe: 1 })` then `api_base.api?.onMessage().subscribe()`
- Unsubscribes with `api_base.api?.send({ forget: subId })` on cleanup
- Displays: symbol display_name (from api_base.active_symbols) + current price + ▲/▼/● direction arrow
- Flashes green/red CSS animation on each price update via --up/--down modifier class

**Why:** The symbol in chart_store is the MobX source of truth for the active market. Using a `reaction()` inside useEffect avoids needing observer() on LogoMark.

## Logo text animation
- New field `logoTextAnimation: TLogoTextAnimation` in `TAdminSettings` (AdminPortalContext.tsx)
- Options: none | pulse | glow | rainbow | neon | shimmer | wave | glitch
- LogoMark.tsx reads from localStorage on mount + listens to `admin_settings_updated` event for live updates
- Applied as CSS class `app-header__logo-text--{anim}` on the brand name span
- Wave animation splits text into per-character `<span class="logo-wave-char">` elements with staggered animationDelay
- Glitch animation uses `::before`/`::after` pseudo-elements reading `data-text={appName}` attribute
- Admin picker in SiteCustomization.tsx dispatches to localStorage + fires `admin_settings_updated` immediately for live preview (no save needed to see it)

## LogoMark structure change
- `app-header__logo-mark` is now `flex-direction: column` to stack logo row + ticker vertically
- New `app-header__logo-mark-inner` wraps the image/badge + text side-by-side (the original row)
