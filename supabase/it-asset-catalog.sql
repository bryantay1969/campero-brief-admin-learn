-- IT / OLO global asset catalog (content config for IT section)
-- Run once in Supabase SQL Editor.

create table if not exists public.it_asset_catalog (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  specs text not null default '',
  notes_default text not null default '',
  notes_placeholder text not null default '',
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists it_asset_catalog_sort_idx
  on public.it_asset_catalog (sort_order asc, title asc);

alter table public.it_asset_catalog enable row level security;

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

grant execute on function public.is_admin() to authenticated;

drop policy if exists "it_asset_catalog_select" on public.it_asset_catalog;
create policy "it_asset_catalog_select"
  on public.it_asset_catalog for select
  to authenticated
  using (is_active = true or public.is_admin());

drop policy if exists "it_asset_catalog_insert" on public.it_asset_catalog;
create policy "it_asset_catalog_insert"
  on public.it_asset_catalog for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "it_asset_catalog_update" on public.it_asset_catalog;
create policy "it_asset_catalog_update"
  on public.it_asset_catalog for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "it_asset_catalog_delete" on public.it_asset_catalog;
create policy "it_asset_catalog_delete"
  on public.it_asset_catalog for delete
  to authenticated
  using (public.is_admin());

-- Seed current built-in IT assets (skip if slug exists)
insert into public.it_asset_catalog
  (slug, title, specs, notes_default, notes_placeholder, sort_order)
values
(
  'oloKoalaImage',
  'OLO / Koala Image',
  'Static Product Images',
  E'Static Product Image\n• OLO: 900 x 600px PNG image(s)\n• Koala: 2000 x 2000px PNG image(s)',
  'Specs, sizes, or other image details…',
  10
),
(
  'oloDescription',
  'OLO Description',
  'Category, Title, and Description for online ordering',
  E'• Category: Under XXX\n• Title:\n• Description:',
  'Category, title, description for OLO…',
  20
),
(
  'ezCaterImage',
  'EZ Cater Image',
  'Static Product Image - 1200 x 800px PNG image(s)',
  '',
  'Specs, copy, timing, or other details…',
  30
)
on conflict (slug) do nothing;
