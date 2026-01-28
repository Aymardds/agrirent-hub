-- Fix for: update or delete on table "profiles" violates foreign key constraint "interventions_technician_id_fkey" on table "interventions"

-- Drop the existing foreign key constraint
ALTER TABLE public.interventions
DROP CONSTRAINT IF EXISTS interventions_technician_id_fkey;

-- Re-add the foreign key constraint with ON DELETE SET NULL
-- This ensures that when a technician (profile) is deleted, the intervention remains but the technician_id is set to NULL
ALTER TABLE public.interventions
ADD CONSTRAINT interventions_technician_id_fkey
FOREIGN KEY (technician_id)
REFERENCES public.profiles(id)
ON DELETE SET NULL;
