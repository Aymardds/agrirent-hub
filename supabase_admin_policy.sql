
-- Policy to allow Super Admins to update any profile
-- This assumes there is a 'role' column in profiles and current user has role 'super_admin'

-- 1. Enable RLS on profiles if not already (it usually is)
alter table public.profiles enable row level security;

-- 2. Create policy for Super Admin to update everything
create policy "Super Admins can update any profile"
on public.profiles
for update
to authenticated
using (
  auth.uid() in (
    select id from public.profiles where role = 'super_admin'
  )
)
with check (
  auth.uid() in (
    select id from public.profiles where role = 'super_admin'
  )
);

-- 3. Also ensure they can Select everything (usually Public can, but good to ensure)
create policy "Super Admins can view all profiles"
on public.profiles
for select
to authenticated
using (
  auth.uid() in (
    select id from public.profiles where role = 'super_admin'
  )
);

-- 4. For development simplicity, IF you are stuck without a super_admin user:
-- You can manually set a user to super_admin in the Supabase Table Editor.
-- Or run this update for your specific email (REPLACE 'YOUR_EMAIL'):
-- update public.profiles set role = 'super_admin' where id = (select id from auth.users where email = 'YOUR_EMAIL');
