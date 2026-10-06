-- One row holds the live AccraLife directory: accounts, reviews, saves, submissions.
-- The service role reads and writes it from the server. The public anon key cannot.

create table if not exists public.app_store (
  id integer primary key default 1 check (id = 1),
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.app_store enable row level security;

revoke all on table public.app_store from public, anon, authenticated;
grant select, insert, update, delete on table public.app_store to service_role;
