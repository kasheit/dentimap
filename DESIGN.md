---
name: Dentimap
description: A clean light operator app where owner of record and assessed value lead every screen and each fact shows its source.
colors:
  primary: "#0F766E"
  canvas: "#F6FAF9"
  surface: "#FFFFFF"
  raised: "#ECF4F2"
  hover: "#E9F2F0"
  hairline: "#E1E9E7"
  ink: "#1B1C20"
  ink-muted: "#545860"
  ink-dim: "#6C7078"
  state-verified: "#16804C"
  state-unverified: "#A86000"
  state-error: "#C42C24"
typography:
  display:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 600
    lineHeight: "34px"
    letterSpacing: "-0.015em"
  hero-figure:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "44px"
    fontWeight: 600
    lineHeight: "50px"
    letterSpacing: "-0.03em"
    fontFeature: "'tnum'"
  headline:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 600
    lineHeight: "28px"
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: "24px"
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "22px"
    fontFeature: "'cv11', 'ss03', 'tnum'"
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: "18px"
  caption:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: "16px"
  identifier:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: "18px"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "20px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "6px 12px"
  button-default:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-muted}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "6px 12px"
  button-default-hover:
    backgroundColor: "{colors.hover}"
    textColor: "{colors.ink}"
  field:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "6px 10px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "20px"
  table-row:
    height: "36px"
    textColor: "{colors.ink}"
  table-head:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.ink-dim}"
    typography: "{typography.caption}"
---

# Design System: Dentimap

## Overview

**Creative North Star: "The Sourced Ledger"**

Dentimap is a quiet, light operator tool for one person doing research at a desk. Owner of record and assessed value are the two loudest things on any screen, and every figure prints where it came from beside it. The category standard is played straight: a Linear-style dense grouped list for browsing locations, and a Stripe-style dossier hero (one large figure, soft cards) for a single location. The drafting-sheet direction that was rolled was not built; the user chose the category standard.

Chrome recedes so data can lead. The canvas is a soft teal-tinted off-white with pure-white cards floating on top of it, structure is hairline borders plus a real two-layer lift, text is near-black, and one teal carries the interface's only voice. Color otherwise appears only as state (green, amber, red), never as decoration. Numbers use tabular numerals so columns align; identifiers such as the parcel PIN use a monospace.

**Key Characteristics:**
- Soft teal-tinted canvas, white cards that actually float (two-layer shadow, not a 1px whisper), hairline borders.
- One teal accent, spent on primary action, active nav/tab underline, and the verified hero figure.
- Provenance printed inline; an unsourced value says "No source" instead of looking authoritative.
- Dense 36px list rows; detail on demand, not on screen by default.
- Missing data stays visibly missing (an em dash in dim ink).

## Colors

A near-monochrome cool-neutral palette with a single teal and three state colors. Channel triplets live as `--dm-*` custom properties in `src/index.css`; the frontmatter hex values are their exact equivalents.

### Primary
- **Trust Teal** (`--dm-blue`, #0F766E): primary button fill (with a soft colored contact shadow), active nav underline (2px), active tab underline, focus ring and outline, link text (source links, "Add"), the verified assessed-value hero figure, last-deed chip tint (at 5% fill / 50% border). Never a background wash, never a state color. (Token name stays `--dm-blue`/`dm-blue` in code — historical, not worth a find-replace across the whole codebase for a hue swap.)

### Neutral
- **Canvas** (`--dm-bg`, #F6FAF9): page background only — a soft teal-tinted off-white, not pure white, so cards visibly float above it.
- **Paper White** (`--dm-surface`, #FFFFFF): cards, table, inputs — stays pure white regardless of canvas.
- **Raised Wash** (`--dm-raised`, #ECF4F2): table header and group-label rows (used at 60% opacity).
- **Hover Wash** (`--dm-hover`, #E9F2F0): row hover, button hover, selected filter chip fill.
- **Hairline** (`--dm-border`, #E1E9E7): every border and divider; inner row dividers drop to 60-70% opacity.
- **Ink** (`--dm-text`, #1B1C20): primary text, verified values. About 16:1 on white.
- **Ink Muted** (`--dm-muted`, #545860): secondary text, unverified values, default button text. About 7:1.
- **Ink Dim** (`--dm-dim`, #6C7078): labels, placeholders, missing-value dashes, metadata. About 4.9:1; the floor for readable text.

### State (only for state)
- **Verified Green** (`--dm-green`, #16804C): verified icon, active-status dot, matching excise-stamp formula chip, pulse ring.
- **Unverified Amber** (`--dm-amber`, #A86000): unverified label and icon, "No source", chain gaps and stamp mismatches, open-note counts.
- **Error Red** (`--dm-red`, #C42C24): sync conflict, failed stamp formula, form errors.

### Named Rules
**The One Voice Rule.** Teal is the only non-state hue. If a new element wants color and is not an action, an active location marker, or a verified hero figure, it stays ink.

**The State-Only Rule.** Green, amber and red mean verification or system state. They are never used for category, decoration, or emphasis.

**The Earned Figure Rule.** The hero assessed value turns teal only when verified; unverified it renders in Ink Muted, missing it is a dim dash. Color is evidence, not styling.

## Typography

**Display / Body Font:** Inter (with ui-sans-serif, system-ui, sans-serif), weights 400, 450, 500, 600
**Identifier Font:** JetBrains Mono (with ui-monospace), weights 400, 500

**Character:** Inter at small sizes with tabular numerals turned on globally (plus `cv11`, `ss03`) gives ledger-like alignment. Mono is reserved for machine identifiers, which makes them read as records to copy.

### Hierarchy
- **Hero figure** (600, 44px, 50px line, -0.03em): the assessed value on the dossier Financials card. One per screen.
- **Display** (600, 28px, 34px): the location name at the top of a dossier.
- **Headline** (600, 22px, 28-32px, tight tracking): page title "Locations" and the owner-of-record name in the Ownership card.
- **Title** (600, 16px, 24px): secondary figures (Land, Building, Last sale, Investment) and dropzone heading.
- **Body** (400, 14px, 22px): card titles (600), tab labels, detail values (500), empty states.
- **Label** (500, 13px, 18px): buttons, table cells, chips, provenance text, filter chips, nav.
- **Caption** (500, 12px, dim): column heads, detail-row labels, group headings, sub-lines.
- **Identifier** (JetBrains Mono, 13px): parcel PIN, SOS ID, deed book/page only.

### Named Rules
**The Tabular Rule.** Every number, amount, date and count is tabular (`tnum`). Money is compact (`$1.2M`) with the exact figure in the title attribute.

**The Mono-For-Identifiers Rule.** Monospace marks an identifier the operator might copy into a county site. It is not a general accent face.

## Layout

Desktop-first, keyboard-first. Content is centered at a 1280px maximum (header spans 1680px), with 16px padding on small screens stepping to 24px and 32px horizontally on large. The Locations page is one full-width grouped table under a title line, a filter row and a search row. The dossier is: name header, a two-column hero row (`3fr / 2fr`: Financials and Ownership), a tab strip, then the active panel. Vertical rhythm between major blocks is 20px (`space-y-5`); inside cards, 20px padding and 12-16px between elements. Detail rows are a three-column grid (6rem label, flexible value, auto status) with 8px vertical padding and a 60% hairline between rows.

The list groups by facility type (Valleygate ASC, VFD practice, affiliate, then Closed), with a state-icon column first and Owner of record and Assessed as the leading data columns. Extra columns (County, Investment, Last deed) appear only behind a "More columns" toggle. On small screens the owner drops under the location name and secondary columns hide. Arrow keys move between rows.

Children of the hero row rise in with a 40ms stagger (400ms, ease `cubic-bezier(0.16, 1, 0.3, 1)`, 8px travel); reduced-motion removes all animation and transitions.

## Elevation & Depth

Nearly flat: depth is a hairline border first and a whisper of shadow second. Cards and the table carry one soft shadow; only floating layers (menus, confirm popover, drop overlay) lift higher. The sticky header uses a 90% white with backdrop blur and a bottom hairline.

### Shadow Vocabulary
- **Card** (`box-shadow: 0 1px 2px rgb(20 22 30 / 0.05)`): cards, panels, the locations table.
- **Pop** (`box-shadow: 0 8px 24px rgb(20 22 30 / 0.12), 0 2px 6px rgb(20 22 30 / 0.06)`): Data menu, inline confirm popover, drop overlay.

### Named Rules
**The Border-First Rule.** Separation comes from a 1px hairline; shadow only softens it. No stacked or offset shadows.

## Shapes

Gently rounded and consistent, one notch more than before: cards, the table and menus use 10px; buttons, inputs, filter chips and ownership-chain chips use 8px; sort buttons use the 4px default. Status dots are fully round (6px). Borders are always 1px hairline; the only 2px borders are the active teal underlines and the dashed drop target.

## Components

### Buttons
- **Shape:** 8px radius, 1px border, 13px medium label, 6px 12px padding, 6px icon gap.
- **Primary:** Trust Teal fill and border, white text, a soft teal contact shadow; hover at 90% opacity with a deeper shadow. One per view (Add location, Save changes, Confirm).
- **Default:** white fill, hairline border, Ink Muted text; hover fills Hover Wash and text goes to Ink.
- **States:** pressed scales to 0.97; disabled 40% opacity; keyboard focus is a 2px teal outline with 2px offset.
- **Text buttons:** row names, "More columns", and "Add" are unbordered; links in teal underline on hover.

### Chips and status
- **Filter chips:** unbordered 6px-radius text buttons with a dim count; selected takes Hover Wash fill and Ink medium text (no teal).
- **Status marks:** 6px dot plus a text label (Verified, Unverified, Not found, Recheck). Text carries the state color for verified and unverified; not-found text stays muted. The list uses a 16px state icon column instead (check circle, dashed circle, empty circle).
- **Formula chip:** bordered 6px chip with 10% state tint for the NC excise-stamp check, green when matching, red with the expected value when not.

### Cards / Containers
- **Corner Style:** 10px. **Background:** white, floating above the teal-tinted canvas. **Border:** 1px hairline. **Shadow:** Card (two-layer — a tight contact shadow plus a soft diffused lift). **Padding:** 20px. Financials and Ownership additionally lift and deepen their shadow on hover (`.lift`).
- Card header: 14px semibold title left, a state label right. Sub-section titles inside are 12-13px medium muted with a 70% hairline underneath.

### Inputs / Fields
- White fill, 1px hairline, 8px radius, 14px text (13px in dense forms), dim placeholder.
- **Focus:** border shifts to teal plus a 2px teal ring at 25%. Errors are a 13px red line beneath.
- Source and as-of date sit beside fields so provenance is entered with the value.

### Navigation
- Top bar: logo (its own natural steel-blue, no longer forced black), then Locations, Entities, People, Deeds as 13px medium text with a 14px icon. Active is Ink with a 2px teal underline inset 8px; inactive is Ink Dim, hover Ink Muted. Search and Data are default buttons at the right, with a save-state text label.
- Dossier tabs: 14px, bottom border hairline, active tab has a 2px teal underline and Ink text; badges are dim, amber for open notes. Left/Right arrows switch tabs.

### Locations table
- 36px rows, 13px text, hairline row dividers at 70%, hover Hover Wash. Header is Raised Wash at 60% with 12px dim sortable heads (active head is Ink with an arrow). Owner text is Ink if verified, Muted if not, Dim "No owner on file" if absent; assessed follows the same three-step rule. Money right-aligned and tabular; a dash for missing.

### Provenance tag and confirm label
Every figure is followed by a 13px source line ("County tax card · Mar 2026") in Ink Muted; with no source it reads "No source" in amber, dashed-underlined. Unverified facts expose an inline label that opens a popover asking for a source and as-of date before marking verified.

### Dossier hero
Financials card: 52px assessed value with provenance (eases from its previous value on change, not on every open — see `useCountUp`), then a two-up strip of 16px figures (Last sale, Investment). Ownership card: 22px owner-of-record name with "since date · source", up to three recent grantees as small chain chips (latest outlined in teal at 50%), then the practice's own operating-entity detail rows (a different legal party from the owner of record, labeled "Operating entity" so the two don't read as the same thing).

## Do's and Don'ts

### Do:
- **Do** lead every screen with owner of record and assessed value, and show each fact's source and as-of date beside it.
- **Do** use teal only for primary action, active nav/tab underline, links, focus, and the verified hero figure.
- **Do** use `tnum` for all figures and compact USD with the exact value on hover.
- **Do** separate with 1px hairlines and the Card shadow; use Pop only for floating layers.
- **Do** show missing data as a dim em dash or "No owner on file"; never fabricate or fill.
- **Do** keep lists dense (36px rows) and put extra fields behind a toggle.

### Don't:
- **Don't** add KPI tile strips or hero-metric clutter; one hero figure per dossier.
- **Don't** reintroduce building details, the county-owner block, a preview pane, a separate Matrix view, REID, land class, acres, description or a specifications panel; the user removed these deliberately.
- **Don't** use green, amber or red as decoration or category color.
- **Don't** add glow or gradient chrome, in either theme. (Dark mode itself — a charcoal canvas following the OS's `prefers-color-scheme`, no in-app toggle — shipped; see the `--dm-*` tokens' dark values in `src/index.css`. Same restraint rules apply: one accent, state colors reserved for verification only, no stark OLED black.)
- **Don't** use monospace for anything but identifiers.
- **Don't** let an unverified value present in the verified color or weight.
