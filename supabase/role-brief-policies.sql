-- Role-based brief write access:
-- - all authenticated users can READ briefs (including viewers)
-- - only admin + editor can INSERT / UPDATE
-- - only admin can DELETE
--
-- Requires public.is_admin() from admin-policies.sql (re-creates a small helper).

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.can_edit_briefs()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'editor')
  );
$$;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.can_edit_briefs() to authenticated;

drop policy if exists "briefs_select" on public.briefs;
create policy "briefs_select"
  on public.briefs for select
  to authenticated
  using (true);

drop policy if exists "briefs_insert" on public.briefs;
create policy "briefs_insert"
  on public.briefs for insert
  to authenticated
  with check (public.can_edit_briefs());

drop policy if exists "briefs_update" on public.briefs;
create policy "briefs_update"
  on public.briefs for update
  to authenticated
  using (public.can_edit_briefs())
  with check (public.can_edit_briefs());

drop policy if exists "briefs_delete" on public.briefs;
create policy "briefs_delete"
  on public.briefs for delete
  to authenticated
  using (public.is_admin());
