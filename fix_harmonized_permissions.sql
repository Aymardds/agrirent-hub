-- =============================================
-- HARMONISATION DES RÔLES ET PERMISSIONS (RLS)
-- =============================================

-- 1. Mise à jour de la contrainte de rôle sur la table profiles
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN (
  'super_admin', 
  'admin', 
  'stock_manager', 
  'technician', 
  'accountant', 
  'client', 
  'cooperative', 
  'provider'
));

-- 2. Consolidation des politiques RLS pour utiliser public.profiles comme source de vérité

-- EQUIPMENT
DROP POLICY IF EXISTS "Stock Managers manage all equipment" ON public.equipment;
DROP POLICY IF EXISTS "Admins can view all equipment" ON public.equipment;

CREATE POLICY "Admin and Stock staff can manage equipment"
ON public.equipment
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('super_admin', 'admin', 'stock_manager')
  )
);

CREATE POLICY "Staff can view all equipment"
ON public.equipment
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('super_admin', 'admin', 'stock_manager', 'accountant', 'technician')
  )
);

-- RENTALS
DROP POLICY IF EXISTS "Admins can view all rentals" ON public.rentals;

CREATE POLICY "Admin and relevant staff can view all rentals"
ON public.rentals
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('super_admin', 'admin', 'stock_manager', 'accountant')
  )
);

-- INTERVENTIONS
DROP POLICY IF EXISTS "Stock Managers manage all interventions" ON public.interventions;

CREATE POLICY "Admin and Stock staff can manage interventions"
ON public.interventions
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('super_admin', 'admin', 'stock_manager')
  )
);

-- PROFILES (Admin view all)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('super_admin', 'admin')
  )
);

-- 3. Mise à jour du trigger handle_new_user pour gérer les nouveaux rôles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, phone, company, email)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'full_name', 
    COALESCE(NEW.raw_user_meta_data->>'role', 'client'), 
    NEW.raw_user_meta_data->>'phone', 
    NEW.raw_user_meta_data->>'company',
    NEW.email
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    phone = EXCLUDED.phone,
    company = EXCLUDED.company,
    email = EXCLUDED.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note : Assurez-vous d'exécuter ce script dans l'éditeur SQL de Supabase.
