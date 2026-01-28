-- Create properties table
CREATE TABLE IF NOT EXISTS public.properties (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references public.profiles(id) not null,
  name text not null,
  size numeric not null,
  unit text check (unit in ('hectares', 'casiers')) default 'hectares',
  department text,
  locality text,
  village text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for properties
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Policies for properties
CREATE POLICY "Users can view their own properties"
  ON properties FOR SELECT
  USING ( auth.uid() = owner_id );

CREATE POLICY "Users can insert their own properties"
  ON properties FOR INSERT
  WITH CHECK ( auth.uid() = owner_id );

CREATE POLICY "Users can update their own properties"
  ON properties FOR UPDATE
  USING ( auth.uid() = owner_id );

CREATE POLICY "Users can delete their own properties"
  ON properties FOR DELETE
  USING ( auth.uid() = owner_id );

-- Add property_id to rentals table and link to properties
ALTER TABLE public.rentals 
ADD COLUMN IF NOT EXISTS property_id uuid references public.properties(id);

-- Note: We generally refer to the table as 'properties', but the relationship name via PostgREST 
-- defaults to the table name if not aliased.
-- However, if the column is 'property_id', PostgREST often infers the relationship 'property' (singular) for the foreign key.
-- Let's explicitly define a comment to suggest to PostGUI/Users, but PostgREST inference works on constraint names usually.
-- Using 'property_id' usually allows selecting 'property' or 'properties' depending on cardinality.
-- Since rental -> property is N:1, it should be 'property'.

