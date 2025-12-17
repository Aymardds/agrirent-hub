-- Enable RLS on tables if not already enabled
alter table public.rentals enable row level security;
alter table public.equipment enable row level security;
alter table public.profiles enable row level security;

-- Policy for Rentals: Admins and Super Admins can view ALL rentals
create policy "Admins can view all rentals"
  on public.rentals
  for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role in ('admin', 'super_admin', 'gestionnaire', 'stock_manager', 'accountant')
    )
  );

-- Policy for Equipment: Admins and Super Admins can view ALL equipment
create policy "Admins can view all equipment"
  on public.equipment
  for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role in ('admin', 'super_admin', 'gestionnaire', 'stock_manager', 'accountant')
    )
  );

-- Policy for Profiles: Admins can view ALL profiles
create policy "Admins can view all profiles"
  on public.profiles
  for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role in ('admin', 'super_admin', 'gestionnaire', 'stock_manager', 'accountant')
    )
  );

-- Optional: Allow admins to update/delete/insert if needed (for full dashboard control)
-- For now, we focus on VIEW access for the dashboard stats.
