# Dentimap — Clinical Real Estate Dashboard

## Project overview

Dentimap is an internal operations dashboard for "Asterion," a multi-location dental group managing clinical real estate assets (dental practices, ambulatory surgical centers, and dual-purpose facilities). Single-user app for "Eshan" (Owner & Admin). Not a consumer product — institutional, enterprise real-estate/legal software aesthetic.

## Tech stack

- **React 18 + TypeScript + Vite** (build tool)
- **Tailwind CSS** for styling (class-based dark mode via `.dark` on `<html>`)
- **Framer Motion** for animations and transitions
- **Recharts** for data visualization (donut chart, bar chart)
- **lucide-react** for icons
- No backend/database — all data is mock data in `src/data.ts` (in-memory only, no persistence)

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

### Data layer (`src/data.ts`, `src/types.ts`)
- `Location` interface: id, recordId (e.g. "PR-014"), name, city, state, assetType ("dental"|"asc"|"dual"), specialty[], dateEstablished, operatingFootprintSqFt, landlordEntity, deedBookPage, previousOccupant, originalLandOwner, originalLandValue, currentAssetValuation, status, description
- 12 mock locations. Multiple locations share the same `landlordEntity` (e.g. "Harbor Medical Properties" owns 3 locations) — this relational grouping is intentional
- `landlords` array is derived from `locations` and sorted by location count descending
- `portfolioValueGrowth` — 12 months of trailing portfolio value (in $M)
- `priorYearPortfolioValue` — scalar for YoY comparison (in $M)

### Components (`src/components/`)
- `Sidebar.tsx` — collapsible fixed-left nav. Brand "Asterion — Clinical real estate", workspace switcher "Eshan's workspace", nav items (Portfolio overview, Locations w/ count badge, Landlords, Documents, Activity log), bottom (Settings, Help center, user profile). Exports `NavKey` type.
- `ThemeToggle.tsx` — light/dark toggle, persists to localStorage key `dentimap-theme`
- `KpiCard.tsx` — animated KPI card with label, value, sublabel, optional change indicator
- `PortfolioMixPanel.tsx` — Recharts donut chart showing asset composition (dental/asc/dual) with center total and legend
- `PortfolioGrowthPanel.tsx` — Recharts bar chart, trailing 12 months
- `LocationDirectory.tsx` — filterable list/table with tabs (All assets, Dental practices, ASCs, Dual-purpose), each row shows icon (differentiates dental vs ASC), name, city/state, badge
- `LocationDetailPanel.tsx` — Framer Motion slide-in from right (not a modal). Shows full location record: header with record ID + status badges, asset summary, asset profile (classification, specialty tags, date, footprint), ownership & title (landlord, deed ref, lease notes), site history (previous occupant, original land owner), asset valuation (original vs current with delta), "View document archive" CTA

### Lib (`src/lib/`)
- `format.ts` — currency/number/date formatters, time-aware greeting, asset type label helpers, percent change
- `useTheme.ts` — theme hook with localStorage persistence and system preference fallback

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
- `font-mono` = JetBrains Mono (record IDs, deed refs)
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
- Mock data only — do not add Supabase or any backend unless explicitly requested
- Keep files focused and at manageable size
- No comments unless explaining a non-obvious constraint

## Known issues / notes

- Build produces a chunk size warning (>500kB) due to Recharts — acceptable for this app, could code-split if needed
- The PortfolioOverview's LocationDirectory passes `onFilterChange={() => undefined}` (filter tabs are visual-only on the overview; full filtering lives in LocationsView)
