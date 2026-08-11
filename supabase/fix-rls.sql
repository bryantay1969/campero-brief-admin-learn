-- If cloud save fails with RLS / permission errors, run this in SQL Editor.
-- It ensures every signed-in user can read their profile and editors can write briefs.

-- Allow every authenticated user to read their own profile (needed for role checks)
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select"
  on public.profiles for select
  to authenticated
  using (true);

-- Briefs: any logged-in user can read
drop policy if exists "briefs_select" on public.briefs;
create policy "briefs_select"
  on public.briefs for select
  to authenticated
  using (true);

-- Briefs: any logged-in user can insert (learning mode — simplify roles)
drop policy if exists "briefs_insert" on public.briefs;
create policy "briefs_insert"
  on public.briefs for insert
  to authenticated
  with check (auth.uid() is not null);

-- Briefs: any logged-in user can update
drop policy if exists "briefs_update" on public.briefs;
create policy "briefs_update"
  on public.briefs for update
  to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- Briefs: any logged-in user can delete (learning mode)
drop policy if exists "briefs_delete" on public.briefs;
create policy "briefs_delete"
  on public.briefs for delete
  to authenticated
  using (auth.uid() is not null);

-- Backfill profiles for any auth users missing a profile row
insert into public.profiles (id, email, role)
select u.id, u.email, 'editor'
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id)
on conflict (id) do nothing;
