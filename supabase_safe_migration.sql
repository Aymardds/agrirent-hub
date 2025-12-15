
-- Safe migration script that handles existing columns

-- 1. Add service_type safely (only if it doesn't exist)
alter table public.equipment 
add column if not exists service_type text check (service_type in ('location', 'vente')) default 'location';

-- 2. Add gallery safely (only if it doesn't exist)
alter table public.equipment 
add column if not exists gallery text[] default array[]::text[];

-- 3. Ensure storage bucket exists
insert into storage.buckets (id, name, public) 
values ('equipment-images', 'equipment-images', true)
on conflict (id) do nothing;

-- 4. Reset policies to ensure they are correct (Drop and Recreate)
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Authenticated users can upload" on storage.objects;
drop policy if exists "Users can update their own images" on storage.objects;
drop policy if exists "Users can delete their own images" on storage.objects;

create policy "Public Access" 
on storage.objects for select 
using ( bucket_id = 'equipment-images' );

create policy "Authenticated users can upload" 
on storage.objects for insert 
to authenticated 
with check ( bucket_id = 'equipment-images' );

create policy "Users can update their own images" 
on storage.objects for update
to authenticated
using ( bucket_id = 'equipment-images' )
with check ( bucket_id = 'equipment-images' );

create policy "Users can delete their own images" 
on storage.objects for delete
to authenticated
using ( bucket_id = 'equipment-images' );
