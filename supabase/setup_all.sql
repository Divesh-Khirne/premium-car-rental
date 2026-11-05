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
-- =====================================================================
-- 002_functions_triggers.sql  —  Business rules enforced inside the DB
-- =====================================================================

-- Is the current logged-in user an active admin? (SECURITY DEFINER avoids RLS recursion)
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin' and p.is_active
  );
$$;

-- Create a profile automatically for every new auth user. ROLE IS ALWAYS 'customer'.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, email, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.email, ''),
    nullif(new.raw_user_meta_data->>'phone', ''),
    'customer'
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Stop customers from escalating their own role / reactivating themselves / changing email.
create or replace function public.guard_profile_update()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  -- auth.uid() is null when running from the SQL editor: allowed (that is how you create the first admin).
  if auth.uid() is not null and not public.is_admin() then
    new.role := old.role;
    new.is_active := old.is_active;
    new.email := old.email;
  end if;
  return new;
end $$;

drop trigger if exists trg_guard_profile_update on public.profiles;
create trigger trg_guard_profile_update before update on public.profiles
  for each row execute function public.guard_profile_update();

-- Keep profile email in sync if the auth email changes.
create or replace function public.sync_profile_email()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles set email = coalesce(new.email, email) where id = new.id;
  return new;
end $$;
drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed after update of email on auth.users
  for each row execute function public.sync_profile_email();

-- ---------------------------------------------------------------------
-- BOOKINGS: prices, days and totals are ALWAYS computed here, never trusted from the browser.
-- ---------------------------------------------------------------------
create or replace function public.bookings_before_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_car public.cars%rowtype;
  v_start timestamp := new.pickup_date + new.pickup_time;
  v_end   timestamp := new.return_date + new.return_time;
begin
  if auth.uid() is not null and not public.is_admin() then
    new.customer_id := auth.uid();
    new.booking_status := 'pending';
    new.cancellation_requested := false;
  end if;

  if not exists (select 1 from public.profiles where id = new.customer_id and is_active) then
    raise exception 'Account is not active' using errcode = 'P0001';
  end if;

  select * into v_car from public.cars where id = new.car_id;
  if not found then raise exception 'Vehicle not found' using errcode = 'P0001'; end if;
  if v_car.availability_status <> 'available' then
    raise exception 'This vehicle is currently not available for booking' using errcode = 'P0001';
  end if;

  if v_end <= v_start then raise exception 'Return must be after pickup' using errcode = 'P0001'; end if;
  -- 1-day tolerance so users in other time zones are not rejected for "today"
  if new.pickup_date < current_date - 1 then raise exception 'Pickup date cannot be in the past' using errcode = 'P0001'; end if;
  if v_end - v_start > interval '90 days' then raise exception 'Maximum rental length is 90 days' using errcode = 'P0001'; end if;

  new.price_per_day := v_car.price_per_day;
  new.total_days    := greatest(1, ceil(extract(epoch from (v_end - v_start)) / 86400.0)::int);
  new.total_amount  := round(new.total_days * v_car.price_per_day, 2);
  return new;
end $$;

drop trigger if exists trg_bookings_before_insert on public.bookings;
create trigger trg_bookings_before_insert before insert on public.bookings
  for each row execute function public.bookings_before_insert();

-- After insert: create a payment row and bump the car's popularity counter.
create or replace function public.bookings_after_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.payments (booking_id, customer_id, amount, payment_status, payment_method)
  values (new.id, new.customer_id, new.total_amount, 'pending', 'pay_at_pickup');
  update public.cars set bookings_count = bookings_count + 1 where id = new.car_id;
  return new;
end $$;
drop trigger if exists trg_bookings_after_insert on public.bookings;
create trigger trg_bookings_after_insert after insert on public.bookings
  for each row execute function public.bookings_after_insert();

-- Before update: customers may only cancel their own pending bookings or request cancellation.
create or replace function public.bookings_before_update()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  -- SQL editor / internal calls (no JWT) are unrestricted
  if auth.uid() is null then return new; end if;

  if public.is_admin() then
    if old.booking_status in ('cancelled','completed') and new.booking_status <> old.booking_status then
      raise exception 'This booking is already %, its status can no longer change', old.booking_status using errcode = 'P0001';
    end if;
    if new.booking_status = 'completed' and old.booking_status <> 'confirmed' then
      raise exception 'Only confirmed bookings can be marked as completed' using errcode = 'P0001';
    end if;
    return new;
  end if;

  if new.customer_id <> old.customer_id or new.car_id <> old.car_id
     or new.pickup_date <> old.pickup_date or new.return_date <> old.return_date
     or new.pickup_time <> old.pickup_time or new.return_time <> old.return_time
     or new.pickup_location <> old.pickup_location
     or new.total_days <> old.total_days or new.price_per_day <> old.price_per_day
     or new.total_amount <> old.total_amount then
    raise exception 'You are not allowed to change booking details' using errcode = 'P0001';
  end if;

  if new.booking_status <> old.booking_status then
    if not (old.booking_status = 'pending' and new.booking_status = 'cancelled') then
      raise exception 'You can only cancel a pending booking. Request cancellation for confirmed bookings.' using errcode = 'P0001';
    end if;
  end if;

  if new.cancellation_requested and not old.cancellation_requested
     and old.booking_status not in ('pending','confirmed') then
    raise exception 'Cancellation can only be requested for active bookings' using errcode = 'P0001';
  end if;
  return new;
end $$;
drop trigger if exists trg_bookings_before_update on public.bookings;
create trigger trg_bookings_before_update before update on public.bookings
  for each row execute function public.bookings_before_update();

-- After update: keep the payment in sync with the booking status.
create or replace function public.bookings_after_update()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.booking_status is distinct from old.booking_status then
    if new.booking_status = 'completed' then
      update public.payments set payment_status = 'paid', transaction_id = coalesce(transaction_id, 'CASH-' || upper(substr(new.id::text, 1, 8))) where booking_id = new.id;
    elsif new.booking_status = 'cancelled' then
      update public.payments set payment_status = 'failed' where booking_id = new.id and payment_status = 'pending';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists trg_bookings_after_update on public.bookings;
create trigger trg_bookings_after_update after update on public.bookings
  for each row execute function public.bookings_after_update();

-- Reviews only from customers who completed a booking for that car.
create or replace function public.reviews_before_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.customer_id := auth.uid();
    if not exists (select 1 from public.bookings b
                   where b.customer_id = new.customer_id and b.car_id = new.car_id and b.booking_status = 'completed') then
      raise exception 'You can review a vehicle after completing a rental' using errcode = 'P0001';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists trg_reviews_before_insert on public.reviews;
create trigger trg_reviews_before_insert before insert on public.reviews
  for each row execute function public.reviews_before_insert();

-- ---------------------------------------------------------------------
-- AVAILABILITY helpers (return no personal data, safe for anonymous visitors)
-- ---------------------------------------------------------------------
create or replace function public.get_booked_ranges(p_car_id uuid)
returns table (pickup_at timestamp, return_at timestamp)
language sql stable security definer set search_path = '' as $$
  select b.pickup_at, b.return_at
  from public.bookings b
  where b.car_id = p_car_id
    and b.booking_status in ('pending','confirmed')
    and b.return_at > (now() at time zone 'utc') - interval '1 day'
  order by b.pickup_at;
$$;

create or replace function public.unavailable_car_ids(p_start timestamp, p_end timestamp)
returns setof uuid
language sql stable security definer set search_path = '' as $$
  select c.id from public.cars c
  where c.availability_status <> 'available'
     or exists (
       select 1 from public.bookings b
       where b.car_id = c.id
         and b.booking_status in ('pending','confirmed')
         and tsrange(b.pickup_at, b.return_at, '[)') && tsrange(p_start, p_end, '[)')
     );
$$;

-- Cars rented out right now (used by the admin dashboard KPI)
create or replace function public.currently_rented_count()
returns integer language sql stable security definer set search_path = '' as $$
  select count(distinct car_id)::int from public.bookings
  where booking_status = 'confirmed'
    and (now() at time zone 'utc') between pickup_at and return_at;
$$;

grant execute on function public.get_booked_ranges(uuid)              to anon, authenticated;
grant execute on function public.unavailable_car_ids(timestamp, timestamp) to anon, authenticated;
grant execute on function public.currently_rented_count()             to authenticated;
grant execute on function public.is_admin()                           to anon, authenticated;
-- =====================================================================
-- 003_rls_policies.sql  —  Row Level Security
-- Customers see only their own data. Admins are verified via is_admin().
-- =====================================================================
alter table public.profiles               enable row level security;
alter table public.cars                   enable row level security;
alter table public.bookings               enable row level security;
alter table public.reviews                enable row level security;
alter table public.payments               enable row level security;
alter table public.testimonials           enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.promo_banners          enable row level security;

-- profiles
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles for select
  using (id = auth.uid() or public.is_admin());
drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin" on public.profiles for update
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());
-- (no insert policy: profiles are created only by the handle_new_user trigger; no delete policy)

-- cars: public catalogue, admin-only writes
drop policy if exists "cars_select_all" on public.cars;
create policy "cars_select_all" on public.cars for select using (true);
drop policy if exists "cars_admin_insert" on public.cars;
create policy "cars_admin_insert" on public.cars for insert with check (public.is_admin());
drop policy if exists "cars_admin_update" on public.cars;
create policy "cars_admin_update" on public.cars for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "cars_admin_delete" on public.cars;
create policy "cars_admin_delete" on public.cars for delete using (public.is_admin());

-- bookings
drop policy if exists "bookings_select_own_or_admin" on public.bookings;
create policy "bookings_select_own_or_admin" on public.bookings for select
  using (customer_id = auth.uid() or public.is_admin());
drop policy if exists "bookings_insert_own" on public.bookings;
create policy "bookings_insert_own" on public.bookings for insert
  with check (customer_id = auth.uid() or public.is_admin());
drop policy if exists "bookings_update_own_or_admin" on public.bookings;
create policy "bookings_update_own_or_admin" on public.bookings for update
  using (customer_id = auth.uid() or public.is_admin())
  with check (customer_id = auth.uid() or public.is_admin());
drop policy if exists "bookings_admin_delete" on public.bookings;
create policy "bookings_admin_delete" on public.bookings for delete using (public.is_admin());

-- reviews: public read, customers write their own (trigger checks they completed a rental)
drop policy if exists "reviews_select_all" on public.reviews;
create policy "reviews_select_all" on public.reviews for select using (true);
drop policy if exists "reviews_insert_own" on public.reviews;
create policy "reviews_insert_own" on public.reviews for insert with check (customer_id = auth.uid());
drop policy if exists "reviews_update_own" on public.reviews;
create policy "reviews_update_own" on public.reviews for update using (customer_id = auth.uid()) with check (customer_id = auth.uid());
drop policy if exists "reviews_delete_own_or_admin" on public.reviews;
create policy "reviews_delete_own_or_admin" on public.reviews for delete using (customer_id = auth.uid() or public.is_admin());

-- payments: read-only for customers; written by triggers (SECURITY DEFINER) or admins
drop policy if exists "payments_select_own_or_admin" on public.payments;
create policy "payments_select_own_or_admin" on public.payments for select
  using (customer_id = auth.uid() or public.is_admin());
drop policy if exists "payments_admin_update" on public.payments;
create policy "payments_admin_update" on public.payments for update using (public.is_admin()) with check (public.is_admin());

-- testimonials
drop policy if exists "testimonials_select_featured_or_admin" on public.testimonials;
create policy "testimonials_select_featured_or_admin" on public.testimonials for select
  using (is_featured or public.is_admin());
drop policy if exists "testimonials_admin_all" on public.testimonials;
create policy "testimonials_admin_all" on public.testimonials for all using (public.is_admin()) with check (public.is_admin());

-- newsletter: anyone can subscribe, only admins can read
drop policy if exists "newsletter_insert_anyone" on public.newsletter_subscribers;
create policy "newsletter_insert_anyone" on public.newsletter_subscribers for insert with check (true);
drop policy if exists "newsletter_admin_select" on public.newsletter_subscribers;
create policy "newsletter_admin_select" on public.newsletter_subscribers for select using (public.is_admin());

-- promo banners
drop policy if exists "banners_select_active_or_admin" on public.promo_banners;
create policy "banners_select_active_or_admin" on public.promo_banners for select using (is_active or public.is_admin());
drop policy if exists "banners_admin_all" on public.promo_banners;
create policy "banners_admin_all" on public.promo_banners for all using (public.is_admin()) with check (public.is_admin());

-- table privileges for the API roles (RLS still decides which rows)
grant usage on schema public to anon, authenticated;
grant select on public.cars, public.reviews, public.testimonials, public.promo_banners to anon, authenticated;
grant insert on public.newsletter_subscribers to anon, authenticated;
grant select, insert, update, delete on public.profiles, public.cars, public.bookings, public.reviews,
  public.payments, public.testimonials, public.newsletter_subscribers, public.promo_banners to authenticated;
-- =====================================================================
-- 004_storage.sql  —  Storage buckets and policies
-- Creates two PUBLIC-READ buckets: car-images (admin upload) and avatars (own folder).
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('car-images', 'car-images', true, 5242880, array['image/jpeg','image/png','image/webp','image/avif']),
  ('avatars',    'avatars',    true, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = excluded.public,
  file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "car_images_public_read" on storage.objects;
create policy "car_images_public_read" on storage.objects for select using (bucket_id = 'car-images');
drop policy if exists "car_images_admin_insert" on storage.objects;
create policy "car_images_admin_insert" on storage.objects for insert with check (bucket_id = 'car-images' and public.is_admin());
drop policy if exists "car_images_admin_update" on storage.objects;
create policy "car_images_admin_update" on storage.objects for update using (bucket_id = 'car-images' and public.is_admin());
drop policy if exists "car_images_admin_delete" on storage.objects;
create policy "car_images_admin_delete" on storage.objects for delete using (bucket_id = 'car-images' and public.is_admin());

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read" on storage.objects for select using (bucket_id = 'avatars');
drop policy if exists "avatars_own_insert" on storage.objects;
create policy "avatars_own_insert" on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "avatars_own_update" on storage.objects;
create policy "avatars_own_update" on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "avatars_own_delete" on storage.objects;
create policy "avatars_own_delete" on storage.objects for delete
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
