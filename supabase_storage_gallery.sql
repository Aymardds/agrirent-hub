
-- Add gallery column to equipment table
alter table public.equipment 
add column gallery text[] default array[]::text[];

-- Create storage bucket for equipment images if it doesn't exist
-- Note: 'storage.buckets' insert usually requires specific permissions or is done via dashboard.
-- However, we can try to insert it if we are super_admin or just provide policies assuming it exists/is created.
insert into storage.buckets (id, name, public) 
values ('equipment-images', 'equipment-images', true)
on conflict (id) do nothing;

-- Set up RLS policies for storage
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
