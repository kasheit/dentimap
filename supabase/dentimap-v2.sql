-- Dentimap v2: property / deed / entity registry.
-- The whole registry is stored as one owner-only JSON document (single-user app),
-- so the relational model in src/lib/types.ts can evolve without new migrations.
-- Run once in the Supabase SQL editor. The legacy `locations` table is left as-is.

create table if not exists public.dentimap_state (
  key text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.dentimap_state enable row level security;

drop policy if exists "Only the owner can access dentimap_state" on public.dentimap_state;

create policy "Only the owner can access dentimap_state"
  on public.dentimap_state
  for all
  using (auth.jwt() ->> 'email' = 'barnesnook610@gmail.com')
  with check (auth.jwt() ->> 'email' = 'barnesnook610@gmail.com');
