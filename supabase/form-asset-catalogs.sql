-- Global form asset catalogs: Digital, Paid Media, Physical, PR
-- Run once in Supabase SQL Editor (after profiles/is_admin exist).

create table if not exists public.form_asset_catalog (
  id uuid primary key default gen_random_uuid(),
  section text not null
    check (section in ('digital', 'paid', 'physical', 'pr')),
  slug text not null,
  title text not null,
  specs text not null default '',
  notes_default text not null default '',
  notes_placeholder text not null default '',
  priority_default text not null default '',
  link_label text not null default '',
  link_href text not null default '',
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (section, slug)
);

create index if not exists form_asset_catalog_section_sort_idx
  on public.form_asset_catalog (section, sort_order asc, title asc);

alter table public.form_asset_catalog enable row level security;

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

drop policy if exists "form_asset_catalog_select" on public.form_asset_catalog;
create policy "form_asset_catalog_select"
  on public.form_asset_catalog for select
  to authenticated
  using (is_active = true or public.is_admin());

drop policy if exists "form_asset_catalog_insert" on public.form_asset_catalog;
create policy "form_asset_catalog_insert"
  on public.form_asset_catalog for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "form_asset_catalog_update" on public.form_asset_catalog;
create policy "form_asset_catalog_update"
  on public.form_asset_catalog for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "form_asset_catalog_delete" on public.form_asset_catalog;
create policy "form_asset_catalog_delete"
  on public.form_asset_catalog for delete
  to authenticated
  using (public.is_admin());

-- ========== DIGITAL ==========
insert into public.form_asset_catalog
  (section, slug, title, specs, notes_default, notes_placeholder, priority_default, sort_order)
values
('digital', 'organicPosts', 'Organic Post(s)', '1080×1080, 1080×1350', '', 'Specs, copy, timing, or other details…', '', 10),
('digital', 'email', 'Email', 'Main Module, Rich Image, Secondary Module (Static)', '', 'Notes for email creative…',
  'Priority asset as we need to submit to Punchh 4 business days in advance', 20),
('digital', 'websiteCarousel', 'Website Carousel',
  'Static (unless noted otherwise), Save files as WebP Lossy 75 high', '', 'Specs, copy, timing, or other details…', '', 30),
('digital', 'smsCopy', 'SMS Copy', '160 character limit', '', '160 character limit', '', 40),
('digital', 'whatsappCopy', 'WhatsApp Copy', 'No character limit - cannot be segmented', '', 'No character limit - cannot be segmented', '', 50),
('digital', 'socialHeaders', 'Social Headers', 'Static (unless noted otherwise)', '', 'Specs, copy, timing, or other details…', '', 60)
on conflict (section, slug) do nothing;

-- ========== PAID ==========
insert into public.form_asset_catalog
  (section, slug, title, specs, notes_default, notes_placeholder, priority_default, sort_order)
values
('paid', 'metaPaidSocial', 'Meta Paid Social',
  '1080×1080 / 1080×1920, Animated (unless noted otherwise)',
  E'• Headline: 27 characters (including spaces)\n• Primary text/body: 125 characters (including spaces)',
  'Headline / primary text copy…', 'Due to Tru 1 week early', 10),
('paid', 'pmaxGoogle', 'PMAX / Google',
  '1200x1200; 1200x628, Optional 960x1200 - Animated (unless noted otherwise)',
  '', 'Specs, copy, timing…', 'Due to Tru 1 week early', 20),
('paid', 'tiktok', 'TikTok Paid Media', 'Primary text ≤100 characters',
  'Primary Text: 100 Characters', 'Primary text copy…', '', 30),
('paid', 'olvYoutube', 'OLV / YouTube', '',
  E'3 Short headlines:\n• 30 characters max: • 30 characters max: • 15 characters max\n\n1 Long headline:\n• 90 characters max:\n\n2 Description:\n• 90 characters max: • 60 characters max\n\n1 CTA',
  'Headlines, descriptions, CTA…', '', 40)
on conflict (section, slug) do nothing;

-- ========== PHYSICAL / IN-STORE ==========
insert into public.form_asset_catalog
  (section, slug, title, specs, notes_default, notes_placeholder, sort_order)
values
('physical', 'menuBoard', 'Menu Board', '', '', 'Production notes…', 10),
('physical', 'mtvScreen', 'MTV Screen', '', '', 'Production notes…', 20),
('physical', 'dtScreen', 'DT Screen', '', '', 'Production notes…', 30),
('physical', 'lto4thScreen', 'LTO / 4th Screen', '', '', 'Production notes…', 40),
('physical', 'bouncebackFront', 'Bounceback (Front)', '', '', 'Production notes…', 50),
('physical', 'bouncebackBack', 'Bounceback (Back)', '', '', 'Production notes…', 60),
('physical', 'bouncebackInstructions', 'Bounceback Instruction Sheet', '', '', 'Production notes…', 70),
('physical', 'windowClings', 'Window Clings', '24×32 / 36×48', '', 'Production notes…', 80),
('physical', 'doorClings', 'Door Clings', '', '', 'Production notes…', 90),
('physical', 'dtTopper', 'DT Topper', '', '', 'Production notes…', 100),
('physical', 'registerDangler', 'Register Dangler', '', '', 'Production notes…', 110),
('physical', 'resSign', 'RES Sign', '', '', 'Production notes…', 120),
('physical', 'counterCard', 'Counter Card', '', '', 'Production notes…', 130),
('physical', 'digitalAFrame', 'Digital A Frame', '', '', 'Production notes…', 140),
('physical', 'aFrame', 'A Frame', '', '', 'Production notes…', 150),
('physical', 'posOrderScreen', 'POS Order Screen', '', '', 'Production notes…', 160),
('physical', 'kioskHomepage', 'Kiosk Homepage Screen / Menu Cover', '1080×1920 JPEG/GIF ≤20MB', '', 'Production notes…', 170)
on conflict (section, slug) do nothing;

-- ========== PR ==========
insert into public.form_asset_catalog
  (section, slug, title, specs, notes_default, notes_placeholder, link_label, link_href, sort_order)
values
(
  'pr', 'blogPost', 'Blog Post – Campero Website', '',
  '', 'Description / notes for the blog post…',
  'Link to specs example files',
  'https://www.dropbox.com/scl/fo/fkc1yxaywf20md6c9uaav/AFJUPGCH1u9-bhIGRW0vjxg?rlkey=gvlc3ojb5nuli8ibzddfcjblu&st=cnyiifzq&e=1&dl=0',
  10
),
(
  'pr', 'pressRelease', 'Press Release',
  'Only needed if it will be on the wire',
  '', 'Description / notes for the press release…',
  '', '', 20
)
on conflict (section, slug) do nothing;
