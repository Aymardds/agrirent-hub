-- EXECUTABLE SQL SCRIPT
-- Copy and run this in your Supabase SQL Editor

-- 1. Add gender column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('homme', 'femme', 'autre'));

-- 2. Update handle_new_user function to map gender from auth metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, phone, company, gender)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'role', 
    new.raw_user_meta_data->>'phone', 
    new.raw_user_meta_data->>'company',
    new.raw_user_meta_data->>'gender'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Add area and locality to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_area_available NUMERIC DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cultivated_area NUMERIC DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS locality TEXT;

-- 4. Add prestation type and planned area to rentals
ALTER TABLE public.rentals ADD COLUMN IF NOT EXISTS prestation_type TEXT;
ALTER TABLE public.rentals ADD COLUMN IF NOT EXISTS planned_area NUMERIC DEFAULT 0;

-- 5. Create properties table
CREATE TABLE IF NOT EXISTS public.properties (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id UUID REFERENCES public.profiles(id) NOT NULL,
  name TEXT,
  size NUMERIC NOT NULL DEFAULT 0,
  unit TEXT CHECK (unit IN ('hectares', 'casiers')) DEFAULT 'hectares',
  department TEXT,
  locality TEXT,
  village TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Policies for properties
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own properties') THEN
        CREATE POLICY "Users can view their own properties" ON properties FOR SELECT USING ( auth.uid() = owner_id );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own properties') THEN
        CREATE POLICY "Users can insert their own properties" ON properties FOR INSERT WITH CHECK ( auth.uid() = owner_id );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own properties') THEN
        CREATE POLICY "Users can update their own properties" ON properties FOR UPDATE USING ( auth.uid() = owner_id );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own properties') THEN
        CREATE POLICY "Users can delete their own properties" ON properties FOR DELETE USING ( auth.uid() = owner_id );
    END IF;
END $$;

-- 6. Link rentals to properties
ALTER TABLE public.rentals ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES public.properties(id);
