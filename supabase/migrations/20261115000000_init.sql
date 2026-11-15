-- Weight Gain Tracker: every table is private to the signed-in user.

create table public.consultations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  answers jsonb not null,
  created_at timestamptz not null default now()
);
create index consultations_user_created_idx on public.consultations (user_id, created_at desc);

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  consultation_id uuid references public.consultations (id) on delete set null,
  targets jsonb not null,
  plan jsonb not null,
  created_at timestamptz not null default now()
);
create index plans_user_created_idx on public.plans (user_id, created_at desc);
create index plans_consultation_idx on public.plans (consultation_id);

create table public.food_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  eaten_at timestamptz not null default now(),
  meal text not null check (meal in ('breakfast', 'lunch', 'dinner', 'snack', 'drink')),
  description text not null check (char_length(description) between 1 and 1000),
  calories integer check (calories between 0 and 10000),
  protein_g numeric(6,1) check (protein_g between 0 and 1000),
  carbs_g numeric(6,1) check (carbs_g between 0 and 2000),
  fat_g numeric(6,1) check (fat_g between 0 and 1000),
  created_at timestamptz not null default now()
);
create index food_logs_user_eaten_idx on public.food_logs (user_id, eaten_at desc);

create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  done_at timestamptz not null default now(),
  kind text not null check (kind in ('gym', 'walk', 'cardio', 'sport', 'yoga', 'other')),
  description text check (char_length(description) <= 1000),
  minutes integer not null check (minutes between 1 and 1440),
  intensity text not null default 'moderate' check (intensity in ('light', 'moderate', 'hard')),
  created_at timestamptz not null default now()
);
create index activity_logs_user_done_idx on public.activity_logs (user_id, done_at desc);

create table public.checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day date not null,
  weight_kg numeric(5,1) check (weight_kg between 20 and 300),
  sleep_hours numeric(3,1) check (sleep_hours between 0 and 24),
  sleep_quality smallint check (sleep_quality between 1 and 5),
  stress smallint check (stress between 1 and 5),
  skin smallint check (skin between 1 and 5),
  appetite smallint check (appetite between 1 and 5),
  energy smallint check (energy between 1 and 5),
  hips_cm numeric(5,1) check (hips_cm between 30 and 250),
  chest_cm numeric(5,1) check (chest_cm between 30 and 250),
  arm_cm numeric(5,1) check (arm_cm between 10 and 100),
  waist_cm numeric(5,1) check (waist_cm between 30 and 250),
  notes text check (char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  unique (user_id, day)
);

-- Row level security: a user can only ever see and change their own rows.
do $$
declare t text;
begin
  foreach t in array array['consultations', 'plans', 'food_logs', 'activity_logs', 'checkins'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format($p$create policy "own rows: select" on public.%I for select to authenticated using ((select auth.uid()) = user_id)$p$, t);
    execute format($p$create policy "own rows: insert" on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)$p$, t);
    execute format($p$create policy "own rows: update" on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)$p$, t);
    execute format($p$create policy "own rows: delete" on public.%I for delete to authenticated using ((select auth.uid()) = user_id)$p$, t);
  end loop;
end $$;
