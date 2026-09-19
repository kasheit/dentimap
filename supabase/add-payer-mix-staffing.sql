-- Adds payer mix and staffing rotation fields to locations, and backfills
-- them for the 6 VFD dental offices currently on file. Valleygate ASCs are
-- left empty — no payer mix/staffing info has been reported for those yet.

alter table public.locations
  add column if not exists payer_mix text[] not null default '{}',
  add column if not exists staffing_notes text not null default '';

update public.locations
set
  payer_mix = array['30% military', '35-40% Medicaid'],
  staffing_notes = 'Pediatric dentists rotate across VFD''s offices — reported as 11 offices group-wide, though only 6 are on file here.'
where record_id in ('VFD-001', 'VFD-002', 'VFD-003', 'VFD-004', 'VFD-005', 'VFD-006');
