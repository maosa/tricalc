# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TriCalc is a zero-dependency triathlon race time calculator deployed as a static site.

## No Build System

There is no npm, no Makefile, no test framework, and no linter. To "run" the app, open `index.html` in a browser. Netlify auto-deploys from the `main` branch on push — no build command is needed.

## Architecture

The app is split across three files:

- **`index.html`** — markup only. Loads `css/styles.css` in `<head>` and `js/app.js` with `defer` (the script assumes the DOM is parsed before it runs, so `defer` is required).
- **`css/styles.css`** — all styles. CSS variables in `:root` (dark mode default) and `[data-theme="light"]` define colors and typography. Sport accent colors: `--color-swim` (blue), `--color-bike` (green), `--color-run` (orange), `--color-trans` (silver). Mobile breakpoint at 768px; below it, the grid collapses and `data-label` pseudo-elements replace the header row.
- **`js/app.js`** — all logic.
  - `PRESETS` / `DROPDOWN_TEXTS` / `LABELS`: data objects keyed by `"metric"` / `"imperial"`
  - `els`: centralized DOM cache for all inputs and labels
  - Calculation functions follow the pattern `calculateSwimTime()` / `calculateSwimPace()`, `calculateBikeTime()` / `calculateBikeSpeed()`, `calculateRunTime()` / `calculateRunPace()`
  - `updateTotal()`: sums all segment times and updates the display
  - `addSmartListener()`: custom listener that tracks the original value on focus and only re-runs the handler if the value actually changed — use this instead of plain `addEventListener` for time/pace inputs to prevent rounding drift on tab-through
  - Swim/Run use pace (MM:SS per distance unit); Bike uses speed (km/h or mph); Transitions are time-only

The `media/` directory holds the Ironman and T100 logo images referenced from the "Find Your Next Race" section.

## Common Modifications

**Adding a race preset:** add entries to `PRESETS.metric`, `PRESETS.imperial`, `DROPDOWN_TEXTS.metric`, `DROPDOWN_TEXTS.imperial`, and a corresponding `<option>` in `#racePreset`.

**Adding a calculation segment:** add HTML inputs, create `calculate*()` and `calculate*Pace/Speed()` functions, attach them via `addSmartListener()`, and include the segment in `updateTotal()`.

**Changing theme colors:** edit CSS variables in `:root` and `[data-theme="light"]`.
