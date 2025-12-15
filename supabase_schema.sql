
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create profiles table
create table public.profiles (
  id uuid references auth.users not null primary key,
  full_name text,
  role text check (role in ('client', 'cooperative', 'provider', 'super_admin')),
  phone text,
  company text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for profiles
alter table public.profiles enable row level security;

-- Policies for profiles
create policy "Public profiles are viewable by everyone"
  on profiles for select
  using ( true );

create policy "Users can update own profile"
  on profiles for update
  using ( auth.uid() = id );

-- Create equipment table
create table public.equipment (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references public.profiles(id),
  name text not null,
  category text not null,
  description text,
  price numeric not null, -- Daily price
  price_unit text default 'FCFA/jour',
  location text not null,
  available boolean default true,
  image_url text,
  specs text[], 
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for equipment
alter table public.equipment enable row level security;

-- Policies for equipment
create policy "Equipment is viewable by everyone"
  on equipment for select
  using ( true );

create policy "Users can insert their own equipment"
  on equipment for insert
  with check ( auth.uid() = owner_id );

create policy "Owners can update their own equipment"
  on equipment for update
  using ( auth.uid() = owner_id );

create policy "Owners can delete their own equipment"
  on equipment for delete
  using ( auth.uid() = owner_id );

-- Create rentals table
create table public.rentals (
  id uuid default uuid_generate_v4() primary key,
  equipment_id uuid references public.equipment(id) not null,
  renter_id uuid references public.profiles(id) not null,
  start_date date not null,
  end_date date not null,
  total_price numeric not null,
  status text check (status in ('pending', 'active', 'completed', 'cancelled')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for rentals
alter table public.rentals enable row level security;

-- Policies for rentals
create policy "Users can view their own rentals"
  on rentals for select
  using ( auth.uid() = renter_id );

create policy "Owners can view rentals of their equipment"
  on rentals for select
  using ( 
    exists (
      select 1 from public.equipment 
      where id = rentals.equipment_id 
      and owner_id = auth.uid()
    )
  );

create policy "Users can create rentals"
  on rentals for insert
  with check ( auth.uid() = renter_id );

-- Trigger to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role, phone, company)
  values (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'role', 
    new.raw_user_meta_data->>'phone', 
    new.raw_user_meta_data->>'company'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists to avoid conflicts
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Insert dummy data (Optional - for testing with real profiles if they update user IDs)
-- Note: Cannot insert into profiles directly if they are linked to auth.users without creating auth users first.
-- So we skip dummy data for profiles and just insert equipment linking to a placeholder or NULL if nullable (it's not).
-- We'll assume the first signed up user can own these items later.

