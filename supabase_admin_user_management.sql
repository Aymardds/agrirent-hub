
-- Policy to allow Super Admins to delete profiles
-- This is necessary for the User Management feature in the Super Admin Dashboard

create policy "Super Admins can delete any profile"
on public.profiles
for delete
to authenticated
using (
  auth.uid() in (
    select id from public.profiles where role = 'super_admin'
  )
);
