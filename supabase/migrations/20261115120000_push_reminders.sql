-- Push notification subscriptions, reminder settings and a send log.

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  endpoint text not null unique check (char_length(endpoint) <= 2000),
  p256dh text not null check (char_length(p256dh) <= 500),
  auth text not null check (char_length(auth) <= 500),
  user_agent text check (char_length(user_agent) <= 500),
  created_at timestamptz not null default now()
);
create index push_subscriptions_user_idx on public.push_subscriptions (user_id);

create table public.reminder_settings (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  time_zone text not null default 'Australia/Sydney' check (char_length(time_zone) <= 64),
  meal_nudges boolean not null default true,
  meal_times time[] not null default array['10:30'::time, '15:00'::time] check (cardinality(meal_times) <= 6),
  checkin boolean not null default true,
  checkin_time time not null default '20:00',
  weigh_in boolean not null default true,
  weigh_in_day smallint not null default 1 check (weigh_in_day between 0 and 6),
  weigh_in_time time not null default '07:30',
  weekly_summary boolean not null default true,
  summary_day smallint not null default 0 check (summary_day between 0 and 6),
  summary_time time not null default '18:00',
  updated_at timestamptz not null default now()
);

-- Written only by the sender (service role). One row per user, reminder and day stops duplicates.
create table public.push_log (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null,
  sent_on date not null,
  created_at timestamptz not null default now(),
  unique (user_id, kind, sent_on)
);

alter table public.push_log enable row level security;
revoke all on public.push_log from anon, authenticated;

do $$
declare t text;
begin
  foreach t in array array['push_subscriptions', 'reminder_settings'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format($p$create policy "own rows: select" on public.%I for select to authenticated using ((select auth.uid()) = user_id)$p$, t);
    execute format($p$create policy "own rows: insert" on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)$p$, t);
    execute format($p$create policy "own rows: update" on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)$p$, t);
    execute format($p$create policy "own rows: delete" on public.%I for delete to authenticated using ((select auth.uid()) = user_id)$p$, t);
  end loop;
end $$;
