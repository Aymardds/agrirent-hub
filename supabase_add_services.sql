
-- Create equipment_services table
create table if not exists public.equipment_services (
  id uuid default uuid_generate_v4() primary key,
  equipment_id uuid references public.equipment(id) on delete cascade not null,
  name text not null,
  description text,
  prices jsonb default '[]'::jsonb, -- Array of { amount: number, unit: string }
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for equipment_services
alter table public.equipment_services enable row level security;

-- Policies for equipment_services
create policy "Equipment services are viewable by everyone"
  on equipment_services for select
  using ( true );

create policy "Owners can insert services"
  on equipment_services for insert
  with check ( 
    exists ( 
      select 1 from public.equipment 
      where id = equipment_id 
      and owner_id = auth.uid() 
    ) 
  );

create policy "Owners can update services"
  on equipment_services for update
  using ( 
    exists ( 
      select 1 from public.equipment 
      where id = equipment_id 
      and owner_id = auth.uid() 
    ) 
  );

create policy "Owners can delete services"
  on equipment_services for delete
  using ( 
    exists ( 
      select 1 from public.equipment 
      where id = equipment_id 
      and owner_id = auth.uid() 
    ) 
  );
