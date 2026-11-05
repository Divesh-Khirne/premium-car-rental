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
