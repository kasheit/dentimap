# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Eshan, sole operator (confirmed). Works at a desktop in research sessions: pasting details from county property sites, uploading deeds, and checking who holds title to each location. Private tool behind a sign-in gate, not indexed (`noindex`).

## Product Purpose

Dentimap tracks who owns the real estate behind each location in the Valleygate ASC, VFD practice and affiliate portfolio: deeds and title chains, county tax records, legal entities, and the people attached to them. Success is opening a location and immediately seeing what it is worth and who owns it, with every fact traceable to where it came from.

## Positioning

A single-operator dossier tool built around this portfolio's ownership questions, not a general CRM or GIS. Each fact carries its source and verification state, and title chains are checked (for example NC excise-tax stamps against consideration).

## Operating Context

- Records are hand-entered or pasted from county sites (Wake County Real Estate, Cumberland County property search, and similar) and from recorded deeds (PDF upload with OCR).
- Facts carry a verification state (verified, unverified, unknown) with source and as-of date, plus per-field confirm labels.
- Locations are North Carolina properties; facility types are Valleygate ASC, VFD practice, affiliate.

## Capabilities and Constraints

- Views: Locations (table with preview, location dossier), Matrix, Entities, People, Deeds.
- Location dossier: financials, ownership, property record with source links, title chain, people and notes, activity log.
- Deed intake: clipboard parsing of county pages and deed text, PDF upload with OCR, ingestion buffer before saving.
- Data lives in Supabase as one JSON document, with JSON and CSV export; sync conflicts are surfaced.
- Stack: React, Vite, Tailwind, zustand, Supabase.
- Deliberately removed: building details (heated area, year built, use type) and the county-owner block. Do not reintroduce them without asking; too much information was the complaint.

## Brand Commitments

Name: Dentimap. Logo in `public/dentimap-logo.png`. Look (chosen by the user, 2026-09-23): light theme; a Linear-style dense, quiet list (grouped rows, state icon column, keyboard-first) with a Stripe-style dossier hero (assessed value as the large figure, soft cards). The user rejected the Notion/Airtable look as basic, and called the drafting-sheet, abstract-of-title and timetable concepts unappealing.

## Evidence on Hand

Seed data in `supabase/dentimap-seed.json`. No testimonials, customers or benchmarks exist; do not invent any.

## Product Principles

1. The two questions come first: what is it worth, and who owns it.
2. Every fact shows where it came from; unsourced facts look unsourced.
3. Less on screen beats completeness; surface detail on demand.
4. Fast, keyboard-friendly desktop research over decoration.
5. Never fabricate records; missing data stays visibly missing.
