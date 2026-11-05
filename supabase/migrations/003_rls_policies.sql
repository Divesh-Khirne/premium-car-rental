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
