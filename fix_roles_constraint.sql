-- Remove the old check constraint
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add the new updated check constraint with all roles
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_role_check
CHECK (role IN ('client', 'cooperative', 'provider', 'super_admin', 'admin', 'technician', 'stock_manager'));
