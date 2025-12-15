-- 1. Update the Role Check Constraint to include ALL new roles (admin, stock_manager, technician, accountant)
-- We must drop the old one first to avoid conflicts.
alter table public.profiles drop constraint if exists profiles_role_check;

alter table public.profiles add constraint profiles_role_check
  check (role in (
    'client', 
    'cooperative', 
    'provider', 
    'super_admin',
    'admin',
    'stock_manager',
    'technician',
    'accountant'
  ));

-- 2. Ensure Super User Policies exist for UPDATE and DELETE

-- Update Policy: Super admins can edit anyone
drop policy if exists "Super Admins can update any profile" on public.profiles;
create policy "Super Admins can update any profile"
on public.profiles
for update
to authenticated
using (
  auth.uid() in (
    select id from public.profiles where role = 'super_admin'
  )
);

-- Delete Policy: Super admins can delete anyone
drop policy if exists "Super Admins can delete any profile" on public.profiles;
create policy "Super Admins can delete any profile"
on public.profiles
for delete
to authenticated
using (
  auth.uid() in (
    select id from public.profiles where role = 'super_admin'
  )
);

-- Select Policy: Super admins can view all (usually public, but ensures access)
drop policy if exists "Super Admins can view all profiles" on public.profiles;
create policy "Super Admins can view all profiles"
on public.profiles
for select
to authenticated
using (
  auth.uid() in (
    select id from public.profiles where role = 'super_admin'
  )
);
