-- Campero Brief Admin (learning) — run this once in Supabase SQL Editor
-- Dashboard: https://supabase.com/dashboard → your project → SQL Editor → New query

-- 1) Profiles (one row per signed-up user)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  role text not null default 'editor'
    check (role in ('admin', 'editor', 'viewer')),
  created_at timestamptz not null default now()
);

-- 2) Shared briefs library (form data stored as JSON)
create table if not exists public.briefs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  data jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version int not null default 1
);

create index if not exists briefs_updated_at_idx on public.briefs (updated_at desc);

-- 3) Auto-create a profile when someone signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'editor')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4) Row Level Security
alter table public.profiles enable row level security;
alter table public.briefs enable row level security;

-- Profiles: see your own; admins see all
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select"
  on public.profiles for select
  to authenticated
  using (
    id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Briefs: any logged-in user can read
drop policy if exists "briefs_select" on public.briefs;
create policy "briefs_select"
  on public.briefs for select
  to authenticated
  using (true);

-- Briefs: editors + admins can create
drop policy if exists "briefs_insert" on public.briefs;
create policy "briefs_insert"
  on public.briefs for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'editor')
    )
  );

-- Briefs: editors + admins can update
drop policy if exists "briefs_update" on public.briefs;
create policy "briefs_update"
  on public.briefs for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'editor')
    )
  );

-- Briefs: admins can delete
drop policy if exists "briefs_delete" on public.briefs;
create policy "briefs_delete"
  on public.briefs for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- After you create your first user (Auth → Users, or sign up in the app),
-- make yourself admin (edit the email):
--
--   update public.profiles
--   set role = 'admin'
--   where email = 'you@example.com';
