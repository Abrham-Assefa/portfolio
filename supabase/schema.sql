-- Contact inbox schema for Supabase.
-- 1) Replace YOUR_ADMIN_EMAIL below with the email you will log in with.
-- 2) Run this whole file in Supabase → SQL Editor.
-- 3) Authentication → Users → "Add user" with that email + a password.
-- 4) Authentication → Sign In / Providers → turn OFF "Allow new users to sign up".

create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 2 and 80),
  email       text not null check (char_length(email) between 5 and 120 and email like '%@%'),
  message     text not null check (char_length(message) between 10 and 3000),
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists messages_created_idx on public.messages (created_at desc);

-- Admin check used by the policies below.
create or replace function public.is_admin() returns boolean
language sql stable as $$
  select coalesce(auth.jwt() ->> 'email', '') = 'YOUR_ADMIN_EMAIL'
$$;

alter table public.messages enable row level security;

-- Messages: anyone can send (insert only, can't mark as read), only the admin reads/updates/deletes.
drop policy if exists "anyone can send a message" on public.messages;
create policy "anyone can send a message" on public.messages
  for insert to anon, authenticated with check (read = false);

drop policy if exists "admin reads messages" on public.messages;
create policy "admin reads messages" on public.messages
  for select to authenticated using (public.is_admin());

drop policy if exists "admin updates messages" on public.messages;
create policy "admin updates messages" on public.messages
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin deletes messages" on public.messages;
create policy "admin deletes messages" on public.messages
  for delete to authenticated using (public.is_admin());
