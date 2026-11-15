-- Chat with the Nourish assistant. Private to each user.
create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) <= 20000),
  actions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index chat_messages_user_created_idx on public.chat_messages (user_id, created_at desc);

alter table public.chat_messages enable row level security;
revoke all on public.chat_messages from anon;
grant select, insert, delete on public.chat_messages to authenticated;
create policy "own rows: select" on public.chat_messages for select to authenticated using ((select auth.uid()) = user_id);
create policy "own rows: insert" on public.chat_messages for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "own rows: delete" on public.chat_messages for delete to authenticated using ((select auth.uid()) = user_id);
