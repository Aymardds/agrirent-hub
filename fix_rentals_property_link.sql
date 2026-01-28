-- Add property_id to rentals table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rentals' AND column_name = 'property_id') THEN
        ALTER TABLE public.rentals ADD COLUMN property_id uuid references public.properties(id);
    END IF;
END $$;
