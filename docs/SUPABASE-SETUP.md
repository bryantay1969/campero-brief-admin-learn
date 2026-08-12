# Supabase setup (learning project)

Step-by-step for humans. No coding required until the end.

## 1. Create a Supabase account & project

1. Open [https://supabase.com](https://supabase.com)
2. **Start your project** / sign in (GitHub login is fine)
3. **New project**
4. Fill in:
   - **Name:** e.g. `campero-brief-learn`
   - **Database password:** invent a strong password → **save it somewhere safe**
   - **Region:** closest to you (e.g. US East)
5. Click **Create new project**
6. Wait until the dashboard says the project is ready (often 1–2 minutes)

## 2. Copy your API keys

1. Left sidebar: **Project Settings** (gear icon)
2. **API**
3. Copy and keep handy:
   - **Project URL** — looks like `https://abcdefgh.supabase.co`
   - **anon public** key — long string starting with `eyJ...`

Do **not** use the `service_role` key in the browser app.

## 3. Create the database tables

1. Left sidebar: **SQL Editor**
2. **New query**
3. Open the file in this repo: `supabase/schema.sql`
4. Copy **all** of its contents into the SQL editor
5. Click **Run** (or Cmd+Enter)
6. You should see success (no red errors)

Check: left sidebar **Table Editor** → you should see **profiles** and **briefs**.

## 4. Turn on Email login

1. Left sidebar: **Authentication**
2. **Providers** → **Email** should be enabled (default)
3. **URL configuration** (under Authentication):
   - **Site URL:** `http://localhost:3000` (for local learning)
   - Add redirect: `http://localhost:3000/**` if asked

For easier learning you can temporarily relax email confirmation:
**Authentication** → **Providers** → **Email** → disable “Confirm email” if you want instant sign-up (re-enable later for real use).

## 5. Put keys in the app (on your Mac)

In Terminal:

```bash
cd "/Users/admin/Desktop/Client Brief/campero-brief-admin-learn"
cp .env.local.example .env.local
```

Open `.env.local` in a text editor and paste your real values:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

Save the file. Restart `npm run dev` after changing env files.

## 6. Make yourself admin (after first user exists)

1. Create a user: **Authentication** → **Users** → **Add user**  
   (or sign up once the app has a login page)
2. **SQL Editor** → run (use your email):

```sql
update public.profiles
set role = 'admin'
where email = 'you@example.com';
```

## 7. Overview options — project leads & locations (optional but recommended)

Same admin pattern as IT / OLO and Form catalogs (Digital, Paid, PR).

1. **SQL Editor** → open `supabase/overview-options.sql`
2. Copy all → **Run**  
   (If “Running…” hangs: cancel, then run table+policies first, seeds second. Requires existing `is_admin()` from other catalog scripts.)
3. Open **Admin** → **Form catalogs** card → **Overview**  
   Or from the brief builder Overview tab → **Manage overview options** (admins only)
4. On one page: **Project leads** and **Locations** sections, each with **Add for everyone** / Edit / Delete

These power the Project Lead dropdown and Locations suggestions on the Overview tab.

## 8. Global form asset catalogs (optional but recommended)

**IT / OLO**

1. Run `supabase/it-asset-catalog.sql`
2. Run `supabase/catalog-fields-align.sql` (adds priority + link fields to IT)
3. Admin → **IT / OLO**

**Digital, Paid Media, In-Store, PR**

1. Run `supabase/form-asset-catalogs.sql`
2. Admin → **Form catalogs**

Every catalog shares the same admin fields: name, subtitle, priority callout, link label, link URL, description hint, and pre-filled description.

## 9. Public preview links (optional but recommended)

For **Copy preview link** (anyone with the link can view a read-only brief):

1. **SQL Editor** → open `supabase/public-preview.sql`
2. Copy all → **Run**

This adds a `share_token` column and a secure RPC so only people who have the token can load that one preview (not the whole library).

## 10. Service role key (for Admin add / edit / delete users)

User create/delete uses Supabase Auth Admin APIs, which need the **service role** key on the **server only**.

1. Supabase → **Project Settings** → **API Keys**
2. Copy **service_role** (legacy) or **secret** key — **not** the anon/publishable key
3. Add to `.env.local`:

```bash
SUPABASE_SERVICE_ROLE_KEY=paste_here
```

4. Restart `npm run dev`

Also run `supabase/admin-policies.sql` if you have not already, and set your user to `admin` in `profiles`.

## Done when

- [ ] Project is green / ready in Supabase
- [ ] You have Project URL + anon key
- [ ] You have service role key in `.env.local` (for full user admin)
- [ ] `profiles` and `briefs` tables exist
- [ ] `.env.local` exists on your Mac with real values (not committed to GitHub)
