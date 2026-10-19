-- Run once in Supabase > SQL Editor.
-- PUBLIC: read-only tournament data. ADMIN: authenticated users explicitly whitelisted below.
create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_tournament_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admin_users where user_id = (select auth.uid()));
$$;

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  short_name text not null,
  color text not null default '#baf76d',
  created_at timestamptz not null default now(),
  constraint team_short_name_length check (char_length(short_name) between 2 and 5)
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  team1_id uuid not null references public.teams(id) on delete restrict,
  team2_id uuid not null references public.teams(id) on delete restrict,
  stage text not null default 'League match',
  scheduled_at timestamptz,
  status text not null default 'upcoming' check (status in ('upcoming','live','completed')),
  team1_runs integer check (team1_runs between 0 and 9999),
  team1_wickets integer check (team1_wickets between 0 and 10),
  team1_overs numeric(5,1) check (team1_overs between 0 and 999.5),
  team2_runs integer check (team2_runs between 0 and 9999),
  team2_wickets integer check (team2_wickets between 0 and 10),
  team2_overs numeric(5,1) check (team2_overs between 0 and 999.5),
  winner_id uuid references public.teams(id) on delete restrict,
  result_summary text,
  created_at timestamptz not null default now(),
  constraint distinct_match_teams check (team1_id <> team2_id),
  constraint winner_is_competitor check (winner_id is null or winner_id = team1_id or winner_id = team2_id)
);

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  name text not null,
  role text not null default 'Player',
  created_at timestamptz not null default now(),
  unique(team_id,name)
);

create table if not exists public.player_performances (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  runs integer not null default 0 check (runs between 0 and 9999),
  wickets integer not null default 0 check (wickets between 0 and 10),
  catches integer not null default 0 check (catches between 0 and 10),
  created_at timestamptz not null default now(),
  unique(match_id, player_id)
);

alter table public.admin_users enable row level security;
alter table public.teams enable row level security;
alter table public.matches enable row level security;
alter table public.players enable row level security;
alter table public.player_performances enable row level security;

-- Re-runnable policies
DROP POLICY IF EXISTS "Admins see their membership" ON public.admin_users;
CREATE POLICY "Admins see their membership" ON public.admin_users FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['teams','matches','players','player_performances'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Public read" ON public.%I',t);
    EXECUTE format('CREATE POLICY "Public read" ON public.%I FOR SELECT TO anon, authenticated USING (true)',t);
    EXECUTE format('DROP POLICY IF EXISTS "Admin insert" ON public.%I',t);
    EXECUTE format('CREATE POLICY "Admin insert" ON public.%I FOR INSERT TO authenticated WITH CHECK ((select public.is_tournament_admin()))',t);
    EXECUTE format('DROP POLICY IF EXISTS "Admin update" ON public.%I',t);
    EXECUTE format('CREATE POLICY "Admin update" ON public.%I FOR UPDATE TO authenticated USING ((select public.is_tournament_admin())) WITH CHECK ((select public.is_tournament_admin()))',t);
    EXECUTE format('DROP POLICY IF EXISTS "Admin delete" ON public.%I',t);
    EXECUTE format('CREATE POLICY "Admin delete" ON public.%I FOR DELETE TO authenticated USING ((select public.is_tournament_admin()))',t);
  END LOOP;
END $$;

-- SECURITY SETUP (manual):
-- 1. Supabase > Authentication > Users > Add user; create your email + strong password.
-- 2. Replace the email in the command below and run it in SQL Editor.
--    (Do NOT grant admin access to any unknown email.)
--
-- insert into public.admin_users(user_id)
-- select id from auth.users where email = 'YOUR_EMAIL@example.com'
-- on conflict (user_id) do nothing;
--
-- NOTE: Supabase free-tier projects can pause after inactivity. For reliable live service, choose an appropriate plan.
