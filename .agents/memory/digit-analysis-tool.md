---
name: Digit Analysis tool
description: Architecture of the native digit analysis component in the Analysis Tools tab
---

## Location
- Component: `src/pages/analysis-tools/DigitAnalysis.tsx`
- Styles: `src/pages/analysis-tools/digit-analysis.scss`
- Integrated into: `src/pages/analysis-tools/index.tsx` as first NATIVE_TOOLS entry (id: 'digit-analysis')

## Architecture
- Sends `ticks_history` request (count = tick window, style: 'ticks') to get historical data
- Subscribes to live `ticks` for real-time updates via `api_base.api.onMessage()`
- Uses MobX `reaction(() => store.chart_store?.symbol)` to auto-switch when bot market changes
- Markets list built from `DIGIT_SYMBOLS` constant, cross-referenced against `api_base.active_symbols` for pip_size + display names

## Markets covered
- 1HZ: 1HZ10V, 1HZ15V, 1HZ25V, 1HZ30V, 1HZ50V, 1HZ75V, 1HZ90V, 1HZ100V
- R_: R_10, R_25, R_50, R_75, R_100
- JD: JD10, JD25, JD50, JD75, JD100

## Analysis tabs
1. Distribution — reference-style digit circles plus bar chart, color ranked most/2nd/3rd most and 3rd/2nd/least
2. Even/Odd — percentage split with per-digit breakdown tables
3. Over/Under — grid of 8 thresholds (1-8) each showing over vs under percentages
4. Streaks — current/max streak, per-digit frequency vs expected 10%, hot/cold signals
5. Recent — last 100 digits as color-coded grid + matches/differs recommendations
6. Signals — frequency ranking, hot/cold, parity bias, and last-digit signal cards
7. Summary — market snapshot, coverage, recent sequence, and interpretation note

## Accuracy rules
- Default window is 1000 ticks.
- History digits are paired with `history.times`; live ticks are de-duplicated by epoch so the subscription's first tick does not count twice.
- Deriv pip sizes are normalized from either decimal places (`3`) or decimal increments (`0.001`) before extracting the last digit.
- The MobX `chart_store.symbol` is the source of truth; the analysis subscribes to the bot's current market immediately, including a non-digit fallback symbol.

## Native tool pattern in analysis-tools/index.tsx
- NATIVE_TOOLS array with `native: true` flag
- When activeTool.native === true, renders `<NativeComponent />` instead of an iframe
- `.analysis-page__native-area` CSS wraps native components (flex column, fills space, scrollable)

**Why:** Using native React avoids iframe cross-origin issues, enables MobX store access, and gives full theme integration via CSS custom properties.
