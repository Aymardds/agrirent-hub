-- Create interventions table
create table if not exists public.interventions (
  id uuid default uuid_generate_v4() primary key,
  equipment_id uuid references public.equipment(id) not null,
  technician_id uuid references public.profiles(id), -- Can be null if not yet assigned
  title text not null,
  description text,
  status text check (status in ('pending', 'in_progress', 'completed', 'cancelled')) default 'pending',
  priority text check (priority in ('low', 'medium', 'high', 'critical')) default 'medium',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone,
  notes text
);

-- Enable RLS
alter table public.interventions enable row level security;

-- Policies for interventions

drop policy if exists "Technicians can view all interventions" on interventions;
create policy "Technicians can view all interventions"
  on interventions for select
  using ( 
    exists (
      select 1 from public.profiles 
      where id = auth.uid() 
      and role in ('technician', 'super_admin', 'admin', 'stock_manager')
    )
  );

drop policy if exists "Technicians can update interventions assigned to them or unassigned" on interventions;
create policy "Technicians can update interventions assigned to them or unassigned"
  on interventions for update
  using ( 
    (technician_id = auth.uid() or technician_id is null)
    and
    exists (
      select 1 from public.profiles 
      where id = auth.uid() 
      and role in ('technician', 'super_admin', 'admin')
    )
  );

drop policy if exists "Admins/Stock Managers can create interventions" on interventions;
create policy "Admins/Stock Managers can create interventions"
  on interventions for insert
  with check (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() 
      and role in ('super_admin', 'admin', 'stock_manager')
    )
  );

-- Add status column to equipment if not exists (migrating from boolean available)
alter table public.equipment 
add column if not exists status text default 'available';
-- check constraint
alter table public.equipment drop constraint if exists equipment_status_check;
alter table public.equipment add constraint equipment_status_check check (status in ('available', 'rented', 'maintenance'));

-- Update equipment status logic (optional trigger but handled in app for now)
