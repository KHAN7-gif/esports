-- THE ELITE · GT7 · production schema for Supabase
-- Run in the Supabase SQL Editor after creating your project.
create table if not exists public.elite_admins (
 user_id uuid primary key references auth.users(id) on delete cascade,
 created_at timestamptz not null default now()
);
create table if not exists public.elite_drivers (
 id integer primary key check (id between 1 and 10000),
 is_dummy boolean not null default false,
 n text not null check (char_length(n) between 1 and 60),
 state text not null default 'WP Labuan',
 club text not null default 'MAIDA ESPORTS',
 photo text not null default '',
 q integer check (q is null or (q > 0 and q < 6000000)),
 s integer check (s is null or (s > 0 and s < 6000000)),
 p integer check (p is null or (p > 0 and p < 6000000)),
 f integer check (f is null or (f > 0 and f < 6000000)),
 recorded jsonb not null default '{"q":null,"s":null,"p":null,"f":null}'::jsonb,
 updated_at timestamptz not null default now()
);
create unique index if not exists elite_drivers_name_unique on public.elite_drivers (lower(n));
alter table public.elite_admins enable row level security;
alter table public.elite_drivers enable row level security;
drop policy if exists "Admin may read self" on public.elite_admins;
create policy "Admin may read self" on public.elite_admins for select to authenticated using (user_id=auth.uid());
drop policy if exists "Public can read drivers" on public.elite_drivers;
create policy "Public can read drivers" on public.elite_drivers for select to anon,authenticated using (true);
drop policy if exists "Only authorized admin can insert" on public.elite_drivers;
create policy "Only authorized admin can insert" on public.elite_drivers for insert to authenticated with check (exists (select 1 from public.elite_admins a where a.user_id=auth.uid()));
drop policy if exists "Only authorized admin can update" on public.elite_drivers;
create policy "Only authorized admin can update" on public.elite_drivers for update to authenticated using (exists (select 1 from public.elite_admins a where a.user_id=auth.uid())) with check (exists (select 1 from public.elite_admins a where a.user_id=auth.uid()));
drop policy if exists "Only authorized admin can delete" on public.elite_drivers;
create policy "Only authorized admin can delete" on public.elite_drivers for delete to authenticated using (exists (select 1 from public.elite_admins a where a.user_id=auth.uid()));
grant select on public.elite_drivers to anon, authenticated;
grant insert,update,delete on public.elite_drivers to authenticated;
grant select on public.elite_admins to authenticated;
-- AFTER creating an admin user in Supabase Authentication > Users,
-- grant access using that user's exact UUID (never expose this SQL in public UI):
-- insert into public.elite_admins(user_id) values ('<ADMIN-USER-UUID>') on conflict do nothing;
-- Keep email confirmation and MFA enabled for actual admin accounts.

-- Migration for databases created with earlier versions.
alter table public.elite_drivers add column if not exists is_dummy boolean not null default false;
-- Existing unidentified records are deliberately NOT marked dummy.
-- The application also recognizes unmodified legacy seed profiles for safe cleanup.
