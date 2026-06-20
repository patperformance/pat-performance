-- ============================================================
-- PAT PERFORMANCE ATHLETE TRACKER — SUPABASE SCHEMA
-- Run this entire file in Supabase SQL Editor (one paste).
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. PROFILES (links to Supabase auth.users, holds role)
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('coach', 'athlete')),
  email text not null,
  created_at timestamptz default now()
);

-- ============================================================
-- 2. ATHLETES (extra profile info, one row per athlete)
-- ============================================================
create table if not exists public.athletes (
  id uuid primary key references public.profiles(id) on delete cascade,
  sport text,
  weight_class text,
  date_of_birth date,
  coach_id uuid references public.profiles(id) on delete set null,
  avatar_url text,
  created_at timestamptz default now()
);

-- ============================================================
-- 3. DAILY CHECKINS
-- ============================================================
create table if not exists public.daily_checkins (
  id uuid primary key default uuid_generate_v4(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  checkin_date date not null,
  sleep_score int not null check (sleep_score between 1 and 5),
  readiness_score int not null check (readiness_score between 1 and 5),
  comments text,
  created_at timestamptz default now(),
  unique (athlete_id, checkin_date)
);

-- ============================================================
-- 4. TRAINING SESSIONS
-- ============================================================
create table if not exists public.training_sessions (
  id uuid primary key default uuid_generate_v4(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  session_date date not null,
  session_type text not null,
  duration_minutes int not null check (duration_minutes > 0),
  rpe int not null check (rpe between 1 and 10),
  session_load int generated always as (duration_minutes * rpe) stored,
  comments text,
  created_at timestamptz default now()
);

-- ============================================================
-- 5. IMPORTANT DATES
-- ============================================================
create table if not exists public.important_dates (
  id uuid primary key default uuid_generate_v4(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  event_date date not null,
  event_type text not null check (event_type in ('Fight','Competition','Holiday','Injury','Other')),
  title text not null,
  notes text,
  created_at timestamptz default now()
);

-- ============================================================
-- 6. COACH NOTES
-- ============================================================
create table if not exists public.coach_notes (
  id uuid primary key default uuid_generate_v4(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  coach_id uuid not null references public.profiles(id) on delete cascade,
  note text not null,
  created_at timestamptz default now()
);

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists idx_checkins_athlete_date on public.daily_checkins(athlete_id, checkin_date desc);
create index if not exists idx_sessions_athlete_date on public.training_sessions(athlete_id, session_date desc);
create index if not exists idx_dates_athlete on public.important_dates(athlete_id, event_date);
create index if not exists idx_athletes_coach on public.athletes(coach_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles enable row level security;
alter table public.athletes enable row level security;
alter table public.daily_checkins enable row level security;
alter table public.training_sessions enable row level security;
alter table public.important_dates enable row level security;
alter table public.coach_notes enable row level security;

-- Helper: is the current user a coach?
create or replace function public.is_coach()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'coach'
  );
$$;

-- PROFILES policies
create policy "profiles_select_own_or_coach" on public.profiles
  for select using (id = auth.uid() or public.is_coach());
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid());
create policy "profiles_insert_own" on public.profiles
  for insert with check (id = auth.uid());

-- ATHLETES policies
create policy "athletes_select_own_or_coach" on public.athletes
  for select using (id = auth.uid() or public.is_coach());
create policy "athletes_update_own_or_coach" on public.athletes
  for update using (id = auth.uid() or public.is_coach());
create policy "athletes_insert_coach" on public.athletes
  for insert with check (id = auth.uid() or public.is_coach());

-- DAILY CHECKINS policies
create policy "checkins_select_own_or_coach" on public.daily_checkins
  for select using (athlete_id = auth.uid() or public.is_coach());
create policy "checkins_insert_own" on public.daily_checkins
  for insert with check (athlete_id = auth.uid());
create policy "checkins_update_own" on public.daily_checkins
  for update using (athlete_id = auth.uid());

-- TRAINING SESSIONS policies
create policy "sessions_select_own_or_coach" on public.training_sessions
  for select using (athlete_id = auth.uid() or public.is_coach());
create policy "sessions_insert_own" on public.training_sessions
  for insert with check (athlete_id = auth.uid());
create policy "sessions_update_own" on public.training_sessions
  for update using (athlete_id = auth.uid());
create policy "sessions_delete_own" on public.training_sessions
  for delete using (athlete_id = auth.uid());

-- IMPORTANT DATES policies
create policy "dates_select_own_or_coach" on public.important_dates
  for select using (athlete_id = auth.uid() or public.is_coach());
create policy "dates_insert_own_or_coach" on public.important_dates
  for insert with check (athlete_id = auth.uid() or public.is_coach());
create policy "dates_update_own_or_coach" on public.important_dates
  for update using (athlete_id = auth.uid() or public.is_coach());
create policy "dates_delete_own_or_coach" on public.important_dates
  for delete using (athlete_id = auth.uid() or public.is_coach());

-- COACH NOTES policies (coach only)
create policy "notes_select_coach" on public.coach_notes
  for select using (public.is_coach());
create policy "notes_insert_coach" on public.coach_notes
  for insert with check (public.is_coach());
create policy "notes_delete_coach" on public.coach_notes
  for delete using (public.is_coach());

-- ============================================================
-- AUTO-CREATE PROFILE + ATHLETE ROW ON SIGNUP
-- New users sign up with role metadata: {"role": "athlete"|"coach", "full_name": "..."}
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'New User'),
    coalesce(new.raw_user_meta_data->>'role', 'athlete'),
    new.email
  );

  if coalesce(new.raw_user_meta_data->>'role', 'athlete') = 'athlete' then
    insert into public.athletes (id) values (new.id);
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- DONE. Next: create your coach account by signing up through
-- the app with role = "coach", then create athlete accounts
-- (or let athletes self-register with role = "athlete") and
-- set their coach_id in the athletes table to your coach id.
-- ============================================================
