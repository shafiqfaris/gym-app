-- Run this once in Supabase: SQL Editor > New query.
create table if not exists public.gym_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{"routines":[],"visits":[],"evolt":[],"history":[]}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.gym_data enable row level security;

create policy "Users can read their own gym data"
  on public.gym_data for select using (auth.uid() = user_id);

create policy "Users can create their own gym data"
  on public.gym_data for insert with check (auth.uid() = user_id);

create policy "Users can update their own gym data"
  on public.gym_data for update using (auth.uid() = user_id);
