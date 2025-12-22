-- Enable Update on Rentals for Admins and Owners
-- Owners need to update status (accept/reject)
-- Admins need to update payment status

DROP POLICY IF EXISTS "Owners can update rentals of their equipment" ON public.rentals;

CREATE POLICY "Owners can update rentals of their equipment"
  ON public.rentals
  FOR UPDATE
  USING (
    exists (
      select 1 from public.equipment 
      where id = rentals.equipment_id 
      and owner_id = auth.uid()
    )
    OR
    exists (
        -- Admins and Super Admins and Stock Managers
        select 1 from public.profiles
        where id = auth.uid()
        and role in ('super_admin', 'admin', 'stock_manager')
    )
  );

-- Also ensure specific payment_status column update if needed, but generic update is fine for now with RLS.
