-- 1. Create a security definer function to get the current user's role
-- This avoids RLS recursion by using SECURITY DEFINER to bypass RLS during the role check
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text AS $$
DECLARE
  user_role text;
BEGIN
  -- We query profiles directly. Since this is SECURITY DEFINER, it bypasses RLS.
  SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Fix PROFILES policies
-- Drop recursive policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Staff can view all profiles" ON public.profiles;

-- Allow users to see their own profile (non-recursive)
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT USING (auth.uid() = id);

-- Allow admins/staff to see all profiles using the helper function
CREATE POLICY "Staff can view all profiles" ON public.profiles
FOR SELECT USING (get_my_role() IN ('super_admin', 'admin', 'stock_manager', 'accountant'));

-- 3. Fix EQUIPMENT policies
-- Drop recursive policies
DROP POLICY IF EXISTS "Admin and Stock staff can manage equipment" ON public.equipment;
DROP POLICY IF EXISTS "Staff can view all equipment" ON public.equipment;
DROP POLICY IF EXISTS "Equipment is viewable by everyone" ON public.equipment;
DROP POLICY IF EXISTS "Everyone can view equipment" ON public.equipment;
DROP POLICY IF EXISTS "Staff can manage equipment" ON public.equipment;

-- Public can view available equipment
CREATE POLICY "Everyone can view equipment" ON public.equipment
FOR SELECT USING (true);

-- Staff can manage everything
CREATE POLICY "Staff can manage equipment" ON public.equipment
FOR ALL USING (get_my_role() IN ('super_admin', 'admin', 'stock_manager'));

-- 4. Fix RENTALS policies
-- Drop recursive policies
DROP POLICY IF EXISTS "Admin and relevant staff can view all rentals" ON public.rentals;
DROP POLICY IF EXISTS "Users can view their own rentals" ON public.rentals;
DROP POLICY IF EXISTS "Owners can view rentals of their equipment" ON public.rentals;
DROP POLICY IF EXISTS "Staff can view all rentals" ON public.rentals;

-- Staff can view all rentals
CREATE POLICY "Staff can view all rentals" ON public.rentals
FOR SELECT USING (get_my_role() IN ('super_admin', 'admin', 'stock_manager', 'accountant'));

-- Users can view their own rentals
CREATE POLICY "Users can view their own rentals" ON public.rentals
FOR SELECT USING (auth.uid() = renter_id);

-- Owners can view rentals of their equipment
CREATE POLICY "Owners can view rentals of their equipment" ON public.rentals
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.equipment 
    WHERE id = rentals.equipment_id 
    AND owner_id = auth.uid()
  )
);

-- 5. Fix INTERVENTIONS policies (if table exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'interventions' AND table_schema = 'public') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Technicians can view all interventions" ON public.interventions';
    EXECUTE 'CREATE POLICY "Staff can view all interventions" ON public.interventions FOR SELECT USING (get_my_role() IN (''super_admin'', ''admin'', ''stock_manager'', ''technician''))';
  END IF;
END $$;
