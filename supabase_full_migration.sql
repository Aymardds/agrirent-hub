
-- 1. Add 'service_type' column
alter table public.equipment 
add column service_type text check (service_type in ('location', 'vente')) default 'location';

-- Update existing rows (optional safety check)
update public.equipment set service_type = 'location' where service_type is null;

-- 2. Add 'gallery' column
alter table public.equipment 
add column gallery text[] default array[]::text[];

-- 3. Create storage bucket for equipment images
insert into storage.buckets (id, name, public) 
values ('equipment-images', 'equipment-images', true)
on conflict (id) do nothing;

-- 4. Set up RLS policies for storage (Drop existing to avoid conflicts if re-running)
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
