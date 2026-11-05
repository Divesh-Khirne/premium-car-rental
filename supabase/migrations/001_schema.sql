-- =====================================================================
-- 001_schema.sql  —  Tables, constraints and indexes
-- Run in: Supabase Dashboard -> SQL Editor -> New query -> paste -> Run
-- (Or run supabase/setup_all.sql once, which contains files 001–004.)
-- =====================================================================

create extension if not exists btree_gist;   -- needed for the double-booking guard

-- ---------- profiles (one row per auth user) ----------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null default '',
  email       text not null,
  phone       text,
  avatar_url  text,
  role        text not null default 'customer' check (role in ('customer','admin')),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ---------- cars ----------
create table if not exists public.cars (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  brand               text not null,
  model               text not null,
  year                integer not null check (year between 1990 and 2100),
  category            text not null check (category in ('Luxury','SUV','Sports','Sedan','Electric','Van','Convertible')),
  description         text not null default '',
  price_per_day       numeric(10,2) not null check (price_per_day > 0),
  transmission        text not null check (transmission in ('Automatic','Manual')),
  fuel_type           text not null check (fuel_type in ('Petrol','Diesel','Electric','Hybrid')),
  seating_capacity    integer not null check (seating_capacity between 1 and 20),
  mileage             text not null default '',
  features            text[] not null default '{}',
  image_urls          text[] not null default '{}',
  availability_status text not null default 'available' check (availability_status in ('available','maintenance','unavailable')),
  is_featured         boolean not null default false,
  bookings_count      integer not null default 0,
  created_at          timestamptz not null default now()
);

-- ---------- bookings ----------
create table if not exists public.bookings (
  id                     uuid primary key default gen_random_uuid(),
  customer_id            uuid not null references public.profiles(id) on delete cascade,
  car_id                 uuid not null references public.cars(id) on delete restrict,
  pickup_location        text not null check (char_length(pickup_location) between 2 and 200),
  pickup_date            date not null,
  return_date            date not null,
  pickup_time            time not null,
  return_time            time not null,
  total_days             integer not null default 1 check (total_days >= 1),
  price_per_day          numeric(10,2) not null default 0,
  total_amount           numeric(12,2) not null default 0,
  booking_status         text not null default 'pending' check (booking_status in ('pending','confirmed','cancelled','completed')),
  cancellation_requested boolean not null default false,
  customer_notes         text,
  created_at             timestamptz not null default now(),
  -- full timestamps derived from date + time (used by the overlap guard)
  pickup_at              timestamp generated always as (pickup_date + pickup_time) stored,
  return_at              timestamp generated always as (return_date + return_time) stored,
  constraint bookings_dates_valid check (return_at > pickup_at),
  -- DATABASE-LEVEL DOUBLE-BOOKING PROTECTION:
  -- two pending/confirmed bookings for the same car can never overlap in time.
  constraint bookings_no_overlap exclude using gist (
    car_id with =,
    tsrange(pickup_at, return_at, '[)') with &&
  ) where (booking_status in ('pending','confirmed'))
);

-- ---------- reviews ----------
create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  car_id      uuid not null references public.cars(id) on delete cascade,
  rating      integer not null check (rating between 1 and 5),
  comment     text not null default '' check (char_length(comment) <= 1000),
  created_at  timestamptz not null default now(),
  unique (customer_id, car_id)
);

-- ---------- payments ----------
create table if not exists public.payments (
  id             uuid primary key default gen_random_uuid(),
  booking_id     uuid not null references public.bookings(id) on delete cascade,
  customer_id    uuid not null references public.profiles(id) on delete cascade,
  amount         numeric(12,2) not null check (amount >= 0),
  payment_status text not null default 'pending' check (payment_status in ('pending','paid','failed','refunded')),
  payment_method text not null default 'pay_at_pickup',
  transaction_id text,
  created_at     timestamptz not null default now()
);

-- ---------- testimonials (shown on the home page) ----------
create table if not exists public.testimonials (
  id            uuid primary key default gen_random_uuid(),
  customer_name text not null,
  review        text not null,
  rating        integer not null default 5 check (rating between 1 and 5),
  is_featured   boolean not null default true,
  created_at    timestamptz not null default now()
);

-- ---------- newsletter ----------
create table if not exists public.newsletter_subscribers (
  id         uuid primary key default gen_random_uuid(),
  email      text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  created_at timestamptz not null default now()
);
create unique index if not exists newsletter_email_unique on public.newsletter_subscribers (lower(email));

-- ---------- promotional banners (Website Management) ----------
create table if not exists public.promo_banners (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  subtitle   text not null default '',
  cta_label  text not null default 'Book now',
  cta_href   text not null default '/cars',
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- indexes ----------
create index if not exists idx_cars_category      on public.cars (category);
create index if not exists idx_cars_brand         on public.cars (brand);
create index if not exists idx_cars_price         on public.cars (price_per_day);
create index if not exists idx_cars_featured      on public.cars (is_featured) where is_featured;
create index if not exists idx_bookings_customer  on public.bookings (customer_id, created_at desc);
create index if not exists idx_bookings_car       on public.bookings (car_id);
create index if not exists idx_bookings_status    on public.bookings (booking_status);
create index if not exists idx_reviews_car        on public.reviews (car_id);
create index if not exists idx_payments_booking   on public.payments (booking_id);
create index if not exists idx_profiles_role      on public.profiles (role);
