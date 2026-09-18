# Dentimap — VFD / Valleygate structural intelligence

## Project overview

Dentimap is an investigative dashboard mapping the corporate structure, real estate, finances, and acquisition timeline of Village Family Dental (VFD) and Valleygate, following VFD's acquisition by Park Dental Partners (NASDAQ: PARK). Single-user tool for "Eshan". Every data point carries a confirmation-tier badge (legal / reported / unverified) so speculative structural mapping is never confused with sourced fact.

## Tech stack

- **React 18 + TypeScript + Vite**
- **Tailwind CSS** for styling (dark theme only)
- **lucide-react** for icons
- Fully static — all data lives in `src/data.ts`, no backend. `@supabase/supabase-js` is an unused leftover dependency from the bolt.new starter template.

## Commands

- `npm run dev` — start dev server (Vite)
- `npm run build` — production build
- `npm run typecheck` — `tsc --noEmit`
- `npm run lint` — ESLint

## Path alias

`@/` maps to `src/` (configured in `vite.config.ts` and `tsconfig.app.json`).

## Architecture

### Entry points
- `src/main.tsx` — React root
- `src/App.tsx` — app shell, holds `activeTab` state, renders `NavBar` + `SourceLegend` + one of the four tabs

### Tabs (`src/tabs/`)
- `CorporateLineageTab.tsx` — beneficial owners, owned entities, acquisition consideration line items, the Village Care Group filing
- `RealEstateTab.tsx` — per-practice real estate matrix (simulated PINs, land/building value, landlord entity), filterable by county
- `FinancesTab.tsx` — payer mix, network scale (reported office count vs. job-listing count discrepancy)
- `TimelineTab.tsx` — milestone tracker from 1985 founding through the 2026 PARK acquisition

### Data layer (`src/data.ts`, `src/types.ts`)
- `ConfirmationTier` = `'legal' | 'reported' | 'unverified'` — the core sourcing model. `sourceTiers` defines color/label/examples per tier; `sourceTier(tier)` looks one up
- `owners`, `ownedEntities`, `acquisitionLineItems`, `acquisitionWithheldNote`, `villageCareGroup` — corporate lineage data
- `realEstateRows` — per-site real estate matrix; `counties` — filter list
- `timelineEntries` — acquisition timeline
- Every record carries a `badge: ConfirmationBadge` (tier + label) and a `completion: CompletionState` (fieldsFilled/fieldsTotal/manuallyCompleted)

### Components (`src/components/`)
- `NavBar.tsx` — top nav with brand wordmark + 4 tab buttons
- `SourceLegend.tsx` — collapsible legend explaining the three confirmation tiers
- `TierBadge.tsx` — renders a `ConfirmationBadge` as a colored pill
- `FlagBanner.tsx` — warning banner (e.g. "no confirmed real-estate holding entity found")
- `SectionCard.tsx` — shared card container
- `CompletionIndicator.tsx` — progress bar + "mark complete" control for a record's `CompletionState`
- `EditableText.tsx` — inline-editable text field

## Design system

- Dark theme only, `bg-page` background
- Tier colors are hardcoded per-tier in `src/data.ts` (`color`/`bgColor`/`textColor`) rather than as Tailwind theme tokens — legal = teal/green, reported = amber, unverified = red
- Max content width: `max-w-7xl`

## Conventions

- Import icons from `lucide-react`
- No comments unless explaining a non-obvious constraint
- Never state a fact without a `ConfirmationBadge` — the unverified/simulated tier exists precisely so speculative structure (e.g. simulated parcel PINs) is visually distinct from filed/reported fact

## Known issues / notes

- `@supabase/supabase-js` in `package.json` is unused dead weight from the starter template
- No `public/vite.svg` present — the favicon link in `index.html` 404s harmlessly
