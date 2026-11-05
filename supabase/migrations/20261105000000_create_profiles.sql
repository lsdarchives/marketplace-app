-- Increment 0: public user profiles.
-- One row per auth user. Readable by everyone (seller info is public on a marketplace),
-- writable only by the owner. Rows are created server-side (signup trigger lands in Increment 1),
-- so there is deliberately no INSERT policy for clients.

create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  username     text unique
               check (username ~ '^[a-z0-9_]{3,30}$'),
  display_name text check (char_length(display_name) <= 60),
  avatar_url   text,
  region       text check (char_length(region) <= 80),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.profiles is 'Public marketplace profile for each auth user.';

-- Keep updated_at honest regardless of what the client sends.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Row-level security
alter table public.profiles enable row level security;

create policy "Profiles are publicly readable"
  on public.profiles for select
  to anon, authenticated
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Clients may only change the editable columns; id/timestamps stay server-controlled.
revoke update on public.profiles from anon, authenticated;
grant update (username, display_name, avatar_url, region) on public.profiles to authenticated;
