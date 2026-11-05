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
