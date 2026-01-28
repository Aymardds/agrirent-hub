-- Add rental_id to interventions table to link detailed mission execution to a specific rental
ALTER TABLE public.interventions 
ADD COLUMN IF NOT EXISTS rental_id uuid references public.rentals(id);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_interventions_rental_id ON public.interventions(rental_id);
