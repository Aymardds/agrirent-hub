-- Add scheduled_date to interventions table
ALTER TABLE public.interventions 
ADD COLUMN IF NOT EXISTS scheduled_date timestamp with time zone;

-- Update RLS for interventions specifically for scheduling
-- Stock managers should be able to update interventions (assign technicians and dates)
CREATE POLICY "Stock managers can update all interventions"
ON public.interventions
FOR UPDATE
USING (
  get_my_role() IN ('super_admin', 'admin', 'stock_manager')
);

-- Ensure we can fetch technicians
-- This is already covered by "Staff can view all profiles" in fix_rls_recursion.sql
