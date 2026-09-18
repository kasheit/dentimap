-- Adds a manual "no further data pull needed" override to locations, so a
-- record with unresolved placeholder fields (landlord "Not yet identified",
-- dates "Unknown", etc.) can be marked complete on purpose instead of
-- perpetually showing as a data gap.

alter table public.locations
  add column if not exists no_pull_needed boolean not null default false;
