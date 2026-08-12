-- Overview options: project leads + location suggestions
-- Run once in Supabase SQL Editor (after profiles + is_admin already exist).
--
-- Tip: If the editor hangs on “Running…”, cancel and run this file in two steps:
--   1) table + index + RLS policies only
--   2) seed inserts only
-- Do not re-create is_admin if it already exists from other catalog scripts.

create table if not exists public.overview_options (
  id uuid primary key default gen_random_uuid(),
  kind text not null
    check (kind in ('project_lead', 'location')),
  label text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (kind, label)
);

create index if not exists overview_options_kind_sort_idx
  on public.overview_options (kind, sort_order asc, label asc);

alter table public.overview_options enable row level security;

-- Policies (reuse existing public.is_admin() from form/IT/legal catalogs)
drop policy if exists "overview_options_select" on public.overview_options;
create policy "overview_options_select"
  on public.overview_options for select
  to authenticated
  using (is_active = true or public.is_admin());

drop policy if exists "overview_options_insert" on public.overview_options;
create policy "overview_options_insert"
  on public.overview_options for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "overview_options_update" on public.overview_options;
create policy "overview_options_update"
  on public.overview_options for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "overview_options_delete" on public.overview_options;
create policy "overview_options_delete"
  on public.overview_options for delete
  to authenticated
  using (public.is_admin());

-- Seed default project leads
insert into public.overview_options (kind, label, sort_order)
values
  ('project_lead', 'Alex Rivera', 10),
  ('project_lead', 'Jordan Lee', 20),
  ('project_lead', 'Sam Patel', 30),
  ('project_lead', 'Morgan Chen', 40),
  ('project_lead', 'Taylor Brooks', 50)
on conflict (kind, label) do nothing;

-- Seed default location suggestions
insert into public.overview_options (kind, label, sort_order)
values
  ('location', 'National', 10),
  ('location', 'LA / Southern California', 20),
  ('location', 'Houston', 30),
  ('location', 'Dallas / Fort Worth', 40),
  ('location', 'Miami / South Florida', 50),
  ('location', 'Washington DC / Maryland / Virginia', 60),
  ('location', 'New York / New Jersey', 70)
on conflict (kind, label) do nothing;
