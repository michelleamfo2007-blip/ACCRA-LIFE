-- AccraLife data model for a later Supabase/Postgres move.
-- The app currently persists accounts, saves, reviews, and submissions in data/store.json.

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

create table places (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  categories text[] not null,
  area text not null,
  rating numeric,
  review_count integer not null default 0,
  price_range integer not null check (price_range between 1 and 4),
  summary text not null,
  description text not null,
  address text not null,
  lat double precision not null,
  lng double precision not null,
  phone text,
  whatsapp text,
  instagram text,
  website text,
  images text[] not null default '{}',
  tags text[] not null default '{}',
  vibes text[] not null default '{}',
  schedule jsonb not null default '{}',
  highlights text[] not null default '{}',
  featured boolean not null default false,
  verified boolean not null default false,
  claimed boolean not null default false,
  status text not null default 'published' check (status in ('published', 'pending', 'hidden'))
);

create table events (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  category text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  area text not null,
  venue text not null,
  place_id uuid references places (id),
  price_ghs integer not null default 0,
  summary text not null,
  description text not null,
  image text,
  lat double precision not null,
  lng double precision not null,
  vibes text[] not null default '{}',
  featured boolean not null default false,
  status text not null default 'published'
);

create table reviews (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references places (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  body text not null,
  photo text,
  status text not null default 'published' check (status in ('published', 'pending', 'hidden')),
  created_at timestamptz not null default now()
);

create table saves (
  user_id uuid not null references profiles (id) on delete cascade,
  kind text not null check (kind in ('place', 'event')),
  target_slug text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, kind, target_slug)
);

create table submissions (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('place', 'event', 'claim')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  submitted_by uuid references profiles (id),
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table reports (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references reviews (id) on delete cascade,
  user_id uuid not null references profiles (id),
  reason text not null,
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now()
);

create table reservations (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  user_id uuid references profiles (id),
  name text not null,
  email text not null,
  event_id uuid not null references events (id),
  quantity integer not null check (quantity between 1 and 8),
  created_at timestamptz not null default now()
);

create table search_logs (
  id bigint generated always as identity primary key,
  query text not null,
  created_at timestamptz not null default now()
);
