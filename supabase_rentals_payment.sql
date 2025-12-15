
-- Add payment columns to rentals table
alter table public.rentals 
add column if not exists payment_status text check (payment_status in ('pending', 'paid', 'failed')) default 'pending',
add column if not exists payment_method text;

-- Add invoice_number for formalized invoicing (optional but good for 'Facturation')
alter table public.rentals
add column if not exists invoice_number text;
