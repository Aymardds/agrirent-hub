-- =============================================
-- NETTOYAGE ET CORRECTION RLS EQUIPMENT
-- =============================================

-- 1. Nettoyage des anciennes policies (au cas où)
DROP POLICY IF EXISTS "Users can only see their own equipment" ON public.equipment;
DROP POLICY IF EXISTS "Everybody can view equipment" ON public.equipment;
DROP POLICY IF EXISTS "Stock Managers manage all equipment" ON public.equipment;
DROP POLICY IF EXISTS "Users manage own equipment" ON public.equipment;
DROP POLICY IF EXISTS "Public can view available equipment" ON public.equipment;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.equipment;
DROP POLICY IF EXISTS "Give users access to own folder" ON storage.objects; -- Exemple storage

-- 2. S'assurer que RLS est actif
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;

-- 3. Politique LECTURE GLOBALE (Catalogue visible par tous)
CREATE POLICY "Global Read Access"
ON public.equipment FOR SELECT
USING (true);

-- 4. Politique GESTIONNAIRES (Stock Managers & Admins ont TOUS les droits)
CREATE POLICY "Stock Manager Full Access"
ON public.equipment FOR ALL
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') IN ('stock_manager', 'admin', 'super_admin')
);

-- 5. Politique PROPRIÉTAIRES (Pour que les clients/agriculteurs puissent gérer ce qu'ils ajoutent eux-mêmes)
CREATE POLICY "Owner Write Access"
ON public.equipment FOR ALL
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);
