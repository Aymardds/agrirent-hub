
-- Add 'service_type' and extend 'price_unit' in equipment table

alter table public.equipment 
add column service_type text check (service_type in ('location', 'vente')) default 'location';

-- Update the check constraint for price_unit if it exists, or just allow text to be flexible
-- We will just document that valid values are: 'Heure', 'Jour', 'Hectare', 'Padi' for rentals
-- For sales (vente), price_unit might be 'Unité' or null.

-- Let's ensure existing rows have a default
update public.equipment set service_type = 'location' where service_type is null;
