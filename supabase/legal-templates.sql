-- Legal templates config (content backend for Legal section)
-- Run once in Supabase SQL Editor.

create table if not exists public.legal_templates (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label text not null,
  description text not null default '',
  body text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists legal_templates_sort_idx
  on public.legal_templates (sort_order asc, label asc);

alter table public.legal_templates enable row level security;

-- Helpers (safe if already defined)
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

drop policy if exists "legal_templates_select" on public.legal_templates;
create policy "legal_templates_select"
  on public.legal_templates for select
  to authenticated
  using (is_active = true or public.is_admin());

drop policy if exists "legal_templates_insert" on public.legal_templates;
create policy "legal_templates_insert"
  on public.legal_templates for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "legal_templates_update" on public.legal_templates;
create policy "legal_templates_update"
  on public.legal_templates for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "legal_templates_delete" on public.legal_templates;
create policy "legal_templates_delete"
  on public.legal_templates for delete
  to authenticated
  using (public.is_admin());

-- Seed defaults (skip if slug already exists)
insert into public.legal_templates (slug, label, description, body, sort_order)
values
(
  'standard',
  'Standard',
  'General promo legal language',
  'Offer valid at participating Pollo Campero locations only. While supplies last. No cash value. Not valid with any other offer, coupon, or discount. Pollo Campero reserves the right to modify or cancel this offer at any time. Valid only during the promotional period. See store for details.',
  10
),
(
  'bogoLoyalty',
  'BOGO / Loyalty',
  'Loyalty members only / rewards redemption',
  'Offer available exclusively to Pollo Campero Rewards members. Must be a registered Rewards member and signed in to redeem. Offer will be deposited into eligible Rewards accounts. Limit one redemption per member. Not valid with any other offer, coupon, or discount. No cash value. While supplies last. Offer valid only during the promotional period at participating locations. Pollo Campero reserves the right to modify or cancel this offer at any time. See campero.com/rewards for full Rewards program terms.',
  20
),
(
  'inStoreOnly',
  'In-Store Only',
  'In-store redemption only',
  'Offer valid for in-store purchases only at participating Pollo Campero locations. Not valid for online ordering, delivery, or third-party platforms. While supplies last. No cash value. Not valid with any other offer, coupon, or discount. Pollo Campero reserves the right to modify or cancel this offer at any time. Valid only during the promotional period. See store for details.',
  30
),
(
  'ews',
  'EWS',
  'Employee / internal or limited distribution',
  'Offer valid at participating Pollo Campero locations. Must present this communication or qualifying code at time of purchase where applicable. Limit one per person/transaction unless otherwise stated. Not valid with any other offer, coupon, or discount. No cash value. While supplies last. Pollo Campero reserves the right to modify or cancel this offer at any time. Valid only during the promotional period.',
  40
),
(
  'menuItemLimit',
  'Menu Item Limit',
  'Specific item quantity limits',
  'Offer applies to specified menu item(s) only. Limit one promotional item per transaction unless otherwise stated. Valid at participating Pollo Campero locations only. While supplies last. No cash value. Not valid with any other offer, coupon, or discount. Pollo Campero reserves the right to modify or cancel this offer at any time. Valid only during the promotional period. See store for details.',
  50
)
on conflict (slug) do nothing;
