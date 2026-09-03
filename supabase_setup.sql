-- Run this in your Supabase project's SQL Editor (Project → SQL Editor → New query).
-- This creates a table scoped to this app (safe to run alongside other
-- apps' tables in the same Supabase project) and locks it down so each
-- user can only ever see or modify their own row.

create table if not exists public.kitchen_companion_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  recipes jsonb not null default '[]'::jsonb,
  to_try jsonb not null default '[]'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  meal_plan jsonb not null default '{}'::jsonb,
  checked_items jsonb not null default '{}'::jsonb,
  pantry jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.kitchen_companion_data enable row level security;

create policy "Users can view their own data"
  on public.kitchen_companion_data for select
  using (auth.uid() = user_id);

create policy "Users can insert their own data"
  on public.kitchen_companion_data for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own data"
  on public.kitchen_companion_data for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own data"
  on public.kitchen_companion_data for delete
  using (auth.uid() = user_id);
