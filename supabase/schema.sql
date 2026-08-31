-- Dentimap: locations table
-- Mirrors src/types.ts Location interface.

create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  record_id text not null,
  name text not null,
  city text not null,
  state text not null,
  asset_type text not null check (asset_type in ('dental', 'asc', 'dual')),
  specialty text[] not null default '{}',
  date_established text not null,
  operating_footprint_sq_ft integer not null,
  landlord_entity text not null,
  deed_book_page text not null,
  previous_occupant text not null,
  original_land_owner text not null,
  original_land_value bigint not null,
  current_asset_valuation bigint not null,
  status text not null check (status in ('Operating', 'Under renovation', 'Lease review', 'Acquisition pending')),
  description text not null default '',
  created_at timestamptz not null default now()
);

alter table public.locations enable row level security;

-- Single-user app (Eshan is the only reader/writer) — anon key allows full access.
-- If this app ever gets more than one user, replace with auth-scoped policies.
create policy "Allow all access to locations"
  on public.locations
  for all
  using (true)
  with check (true);
