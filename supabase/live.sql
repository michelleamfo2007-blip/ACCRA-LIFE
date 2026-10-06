create table if not exists public.places (
  id text primary key,
  name text not null,
  emoji text not null,
  x double precision not null,
  y double precision not null,
  area_group text not null,
  blurb text not null,
  soon boolean not null default false,
  actions jsonb not null default '[]'::jsonb
);

alter table public.places enable row level security;

drop policy if exists "Anyone can read places" on public.places;
create policy "Anyone can read places"
  on public.places for select
  to anon, authenticated
  using (true);

grant select on public.places to anon, authenticated;
grant select, insert, update, delete on public.places to service_role;

create table if not exists public.players (
  username text primary key,
  name text not null,
  email text not null default '',
  password_hash text not null,
  birth_id text not null,
  life jsonb,
  created_at timestamptz not null default now()
);

alter table public.players enable row level security;
revoke all on table public.players from anon, authenticated;
grant select, insert, update, delete on table public.players to service_role;
