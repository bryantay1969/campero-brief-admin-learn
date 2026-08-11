-- Align all asset catalogs with the same optional fields:
-- priority callout + link label + link URL
-- Run once in Supabase SQL Editor.

-- IT catalog (older table)
alter table public.it_asset_catalog
  add column if not exists priority_default text not null default '';
alter table public.it_asset_catalog
  add column if not exists link_label text not null default '';
alter table public.it_asset_catalog
  add column if not exists link_href text not null default '';

-- form_asset_catalog already has these columns from form-asset-catalogs.sql
-- (priority_default, link_label, link_href). No-op if present.
