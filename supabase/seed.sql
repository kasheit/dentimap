-- Dentimap seed data: Village Family Dental (VFD) + Valleygate ASC locations.
-- Source: Synvarity card-spread dataset (C:\Users\eshan\synvarity\src\data\card-seed.ts).
-- Fields not tracked there (deed refs, sq ft, valuations, previous occupant,
-- record ID) are placeholder estimates for visual completeness, not sourced filings.

insert into public.locations
  (record_id, name, city, state, asset_type, specialty, date_established, operating_footprint_sq_ft,
   landlord_entity, deed_book_page, previous_occupant, original_land_owner, original_land_value,
   current_asset_valuation, status, description)
values
  ('VFD-001', 'Village Family Dental — St. Pauls', 'St. Pauls', 'NC', 'dental', array['General'],
   '1985-01-01', 2800, 'Not yet identified', 'On file — pending retrieval', 'Unknown', 'Unknown',
   450000, 980000, 'Operating',
   'Founding office, opened 1985 — the practice’s first location, in a county the group never returned to.'),

  ('VFD-002', 'Village Family Dental — Hope Mills', 'Hope Mills', 'NC', 'dental', array['General'],
   '1993-01-01', 3100, 'Not yet identified', 'On file — pending retrieval', 'Unknown', 'Unknown',
   620000, 1450000, 'Operating',
   'Opened 1993 — the first office in Cumberland County, four years ahead of the Fayetteville hub.'),

  ('VFD-003', 'Village Family Dental — Fayetteville', 'Fayetteville', 'NC', 'dental', array['General'],
   '1999-01-01', 4600, 'VFD Real Estate Partners LLC', 'On file — pending retrieval', 'Unknown', 'Unknown',
   1150000, 2680000, 'Operating',
   'Preparations began 1997; opened 1999. A specialty entity (Southeastern Dental Specialists) has been reported here but not mapped to a filing.'),

  ('VFD-004', 'Village Family Dental — Eastover', 'Eastover', 'NC', 'dental', array['General'],
   'Unknown', 2600, 'VFD Real Estate Partners LLC', 'On file — pending retrieval', 'Unknown', 'Unknown',
   380000, 890000, 'Operating',
   'Cumberland County office; opening date not yet confirmed.'),

  ('VFD-005', 'Village Family Dental — Raeford', 'Raeford', 'NC', 'dental', array['General'],
   'Unknown', 2400, 'Not yet identified', 'On file — pending retrieval', 'Unknown', 'Unknown',
   340000, 760000, 'Operating',
   'Hoke County office; opening date not yet confirmed.'),

  ('VFD-006', 'Village Family Dental — Laurinburg', 'Laurinburg', 'NC', 'dental', array['General'],
   'Unknown', 2500, 'Not yet identified', 'On file — pending retrieval', 'Unknown', 'Unknown',
   360000, 810000, 'Operating',
   'Scotland County office. Appears in one location list and not the other — unresolved record.'),

  ('VG-001', 'Valleygate ASC — Fayetteville', 'Fayetteville', 'NC', 'asc', array['OMFS', 'General'],
   '2017-01-01', 9200, 'VFD Real Estate Partners LLC', 'On file — pending retrieval', 'Unknown', 'Unknown',
   2200000, 5100000, 'Operating',
   'Opened 2017 · SOS filing 1505302 · NPI issued Dec 2017 — one of two centers issued NPIs the same month.'),

  ('VG-002', 'Valleygate ASC — Triad (Greensboro)', 'Greensboro', 'NC', 'asc', array['OMFS'],
   '2017-01-01', 8800, 'Not yet identified', 'On file — pending retrieval', 'Unknown', 'Unknown',
   2050000, 4700000, 'Operating',
   'Opened 2017 · NPI issued Dec 2017 — the same month as Fayetteville.'),

  ('VG-003', 'Valleygate ASC — The West', 'Unconfirmed', 'NC', 'asc', array['OMFS'],
   'Unknown', 7600, 'Not yet identified', 'On file — pending retrieval', 'Unknown', 'Unknown',
   1600000, 3400000, 'Operating',
   'Reported, not yet independently sourced — location details unverified.'),

  ('VG-004', 'Valleygate ASC — Garner', 'Garner', 'NC', 'asc', array['OMFS', 'General'],
   '2025-01-01', 9600, 'Not yet identified', 'On file — pending retrieval', 'Unknown', 'Unknown',
   2400000, 5300000, 'Operating',
   'Opened 2025 (reported) — the first center reported to open its rooms to providers outside the group.'),

  ('VG-005', 'Valleygate ASC — S. Charlotte', 'Charlotte', 'NC', 'asc', array['OMFS'],
   '2025-01-01', 9000, 'Not yet identified', 'On file — pending retrieval', 'Unknown', 'Unknown',
   2350000, 5150000, 'Operating',
   'Opened 2025 (reported).');
