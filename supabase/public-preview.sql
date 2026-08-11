-- Public read-only brief previews (anyone with the share link)
-- Run once in Supabase SQL Editor after schema.sql.

-- Unguessable token per brief (used in /preview/<token>)
alter table public.briefs
  add column if not exists share_token text;

-- Backfill existing rows
update public.briefs
set share_token = replace(gen_random_uuid()::text, '-', '')
  || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)
where share_token is null or share_token = '';

create unique index if not exists briefs_share_token_uidx
  on public.briefs (share_token);

alter table public.briefs
  alter column share_token set default (
    replace(gen_random_uuid()::text, '-', '')
    || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)
  );

-- Secure read by token only (does not allow listing all briefs as anon)
create or replace function public.get_public_brief_preview(p_token text)
returns table (
  id uuid,
  name text,
  data jsonb,
  updated_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select b.id, b.name, b.data, b.updated_at
  from public.briefs b
  where b.share_token = p_token
    and p_token is not null
    and length(trim(p_token)) >= 16
  limit 1;
$$;

revoke all on function public.get_public_brief_preview(text) from public;
grant execute on function public.get_public_brief_preview(text) to anon, authenticated;
