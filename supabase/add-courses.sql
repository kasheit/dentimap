-- Dentimap: courses table (personal academic course planning — unrelated
-- to the VFD/Valleygate real estate data, just living in the same app).

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null check (status in ('completed', 'in-progress', 'needed')),
  notes text not null default '',
  created_at timestamptz not null default now()
);

alter table public.courses enable row level security;

create policy "Only the owner can access courses"
  on public.courses
  for all
  using (auth.jwt() ->> 'email' = 'barnesnook610@gmail.com')
  with check (auth.jwt() ->> 'email' = 'barnesnook610@gmail.com');

insert into public.courses (name, status, notes) values
  ('General Biology I', 'completed', ''),
  ('General Biology II', 'completed', 'Two-part sequence — Part B completed. Technically Anatomy & Physiology.'),
  ('General Chemistry I', 'completed', ''),
  ('General Chemistry II', 'completed', ''),
  ('Physics I', 'in-progress', ''),
  ('Organic Chemistry I', 'needed', ''),
  ('Organic Chemistry II', 'needed', ''),
  ('Biochemistry', 'needed', ''),
  ('Physics II', 'needed', '');
