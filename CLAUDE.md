# Dentimap — Clinical Real Estate Dashboard

## Project overview

Dentimap is an internal operations dashboard tracking the real clinical real estate portfolio of Village Family Dental (VFD, dental practices) and Valleygate (ambulatory surgical centers). Single-user app for "Eshan" (Owner & Admin). Not a consumer product — institutional, enterprise real-estate/legal software aesthetic.

## Tech stack

- **React 18 + TypeScript + Vite** (build tool)
- **Tailwind CSS** for styling (class-based dark mode via `.dark` on `<html>`)
- **Framer Motion** for animations and transitions
- **Recharts** for data visualization (donut chart, bar chart)
- **lucide-react** for icons (plus one custom icon, `src/components/icons/Tooth.tsx` — lucide has no tooth glyph)
- **Supabase** (`@supabase/supabase-js`) for the `locations` table — see `supabase/schema.sql` and `supabase/seed.sql`. `src/data.ts` is now only the offline fallback seed, consulted when Supabase env vars are missing or a request fails (see `src/lib/locations.ts`)

## Commands

- `npm run dev` — start dev server (Vite)
- `npm run build` — production build
- `npm run typecheck` — `tsc --noEmit` type checking
- `npm run lint` — ESLint

## Path alias

`@/` maps to `src/` (configured in `vite.config.ts` and `tsconfig.app.json`). Always use `@/` imports, never deep relative paths.

## Architecture

### Entry points
- `src/main.tsx` — React root
- `src/App.tsx` — main app shell, holds all view state (active nav, selected location, filters, search) and renders the 5 views: PortfolioOverview, LocationsView, LandlordsView, DocumentsView, ActivityView

### Data layer (`src/data.ts`, `src/types.ts`, `src/lib/locations.ts`)
- `Location` interface: id, recordId (e.g. "VFD-001"), name, city, state, assetType ("dental"|"asc"|"dual"), specialty[], dateEstablished, operatingFootprintSqFt, landlordEntity, deedBookPage, previousOccupant, originalLandOwner, originalLandValue, currentAssetValuation, status, description
- 11 real locations (6 VFD dental practices, 5 Valleygate ASCs), sourced from the Synvarity card-spread dataset (`C:\Users\eshan\synvarity`). `dateEstablished` is the literal string `"Unknown"` on several records where the opening date isn't confirmed — `formatDate()` passes that through as-is rather than parsing it as a date
- `src/lib/locations.ts` — `loadLocations()` fetches from Supabase, falling back to the seed in `src/data.ts` if unconfigured/failing; `updateLocation()` persists an edited record
- `landlords` (in `src/data.ts`, and re-derived from live state in `App.tsx`'s `deriveLandlords`) groups locations by `landlordEntity`, sorted by location count descending. Several locations have `landlordEntity: "Not yet identified"` — a real gap, not a placeholder bug
- `portfolioValueGrowth` — 12 months of trailing portfolio value (in $M)
- `priorYearPortfolioValue` — scalar for YoY comparison (in $M)

### Components (`src/components/`)
- `Sidebar.tsx` — collapsible fixed-left nav. Brand "Dentimap" (font-brand/Space Grotesk), workspace switcher "Eshan's workspace", nav items (Portfolio overview, Locations w/ count badge, Landlords, Documents, Activity log), bottom (Settings, Help center, user profile). Exports `NavKey` type.
- `ThemeToggle.tsx` — light/dark toggle, persists to localStorage key `dentimap-theme`
- `KpiCard.tsx` — animated KPI card with label, value, sublabel, optional change indicator
- `PortfolioMixPanel.tsx` — Recharts donut chart showing asset composition (dental/asc/dual) with center total and legend
- `PortfolioGrowthPanel.tsx` — Recharts bar chart, trailing 12 months
- `LocationDirectory.tsx` — filterable list/table with tabs (All assets, Dental practices, ASCs, Dual-purpose), each row shows an icon (`Tooth` for dental, `Hospital` for ASC), name, city/state, badge
- `LocationDetailPanel.tsx` — Framer Motion slide-in from right (not a modal). Has a read mode and an Edit mode (toggled by the header's Edit/Save/Cancel buttons) — editing covers every field except id/recordId/assetType, and Save calls `updateLocation()` then reports success back up to `App.tsx` so it can merge the result into state
- `icons/Tooth.tsx` — custom filled icon (lucide has no tooth glyph), matches the app's icon usage pattern (`className` sizing, `currentColor`)

### Lib (`src/lib/`)
- `format.ts` — currency/number/date formatters, time-aware greeting, asset type label helpers, percent change. `formatDate()` returns the input unchanged if it isn't a parseable date (covers the "Unknown" placeholder)
- `useTheme.ts` — theme hook with localStorage persistence and system preference fallback
- `supabase.ts` — client instance, `null` when `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` aren't set
- `locations.ts` — `loadLocations()` / `updateLocation()`, see Data layer above

## Design system

### Colors (Tailwind config)
- **navy** — primary dark/sidebar color (50–950 ramp, sidebar uses `navy-800`)
- **teal** — accent color for status, charts, interactive highlights (50–950 ramp, primary `#1ba877`)
- **accent** — shorthand teal variants
- Light mode: white/slate main content, navy sidebar
- Dark mode: `navy-950` background, `navy-800` cards, same teal accent
- NEVER use purple/indigo/violet hues

### Typography
- `font-sans` = Inter (body, 400–700)
- `font-display` = Sora (headings, 500–700)
- `font-mono` = Space Mono (record IDs, deed refs)
- `font-brand` = Space Grotesk (sidebar wordmark "Dentimap" only — sister family to Space Mono)
- Loaded via Google Fonts in `index.html`
- `.label-eyebrow` utility class = 11px uppercase tracked label (use for field names like "ASSET CLASSIFICATION")

### Spacing & layout
- 8px spacing system
- Sidebar: 264px expanded, 76px collapsed
- Max content width: 1500px
- Cards: `rounded-2xl`, `shadow-card`, hover `shadow-card-hover`
- Detail panel: `shadow-panel`, max-width 520px

### Animations
- KPI cards: fade/slide in on load (staggered)
- Detail panel: slide in from right with spring easing
- Donut/bar charts: animate in
- Nav active indicator: `layoutId` shared layout animation
- Theme toggle: spring-animated thumb
- All interactive rows/cards have hover states

## Conventions

- Import icons from `lucide-react`
- Use Framer Motion `motion.*` for animated elements
- Recharts tooltip formatters must accept `unknown` type (not `number`) to satisfy Recharts 3.x types
- Keep files focused and at manageable size
- No comments unless explaining a non-obvious constraint

## Known issues / notes

- Build produces a chunk size warning (>500kB) due to Recharts — acceptable for this app, could code-split if needed
- The PortfolioOverview's LocationDirectory passes `onFilterChange={() => undefined}` (filter tabs are visual-only on the overview; full filtering lives in LocationsView)
