-- Locks the locations table down to a single authenticated owner.
-- Replaces the "allow all access" policy (which let anyone with the public
-- anon key read/write the table, auth or not) with one that checks the
-- signed-in user's email against the owner's address.
--
-- This is the real access control — the app's login screen only ever offers
-- to email a code to that same address, but even if someone bypassed the UI
-- and authenticated with the Supabase auth API directly using their own
-- email, this policy would still deny them.

drop policy if exists "Allow all access to locations" on public.locations;

create policy "Only the owner can access locations"
  on public.locations
  for all
  using (auth.jwt() ->> 'email' = 'barnesnook610@gmail.com')
  with check (auth.jwt() ->> 'email' = 'barnesnook610@gmail.com');
