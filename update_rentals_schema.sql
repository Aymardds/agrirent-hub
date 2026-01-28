-- Add missing columns to rentals table
ALTER TABLE public.rentals 
ADD COLUMN IF NOT EXISTS payment_status text check (payment_status in ('pending', 'paid', 'failed')) default 'pending',
ADD COLUMN IF NOT EXISTS prestation_type text,
ADD COLUMN IF NOT EXISTS planned_area numeric;

-- Comment on columns
COMMENT ON COLUMN public.rentals.payment_status IS 'Status of the payment for the rental';
COMMENT ON COLUMN public.rentals.prestation_type IS 'Type of service provided (e.g. Labour, Recolte)';
COMMENT ON COLUMN public.rentals.planned_area IS 'Area in hectares planned for the service';
