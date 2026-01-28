-- Drop the old constraint
ALTER TABLE public.interventions DROP CONSTRAINT IF EXISTS interventions_status_check;

-- Add the new constraint with 'validated' status
ALTER TABLE public.interventions ADD CONSTRAINT interventions_status_check 
CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'validated'));
