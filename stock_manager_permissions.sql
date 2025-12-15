-- =============================================
-- PERMISSIONS GESTIONNAIRE DE STOCK (RLS)
-- =============================================

-- 1. Table EQUIPMENT
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques restrictives si nécessaire (pour éviter les conflits ou la redondance)
-- DROP POLICY IF EXISTS "Users can only see their own equipment" ON public.equipment;

-- Politique : Tout le monde peut VOIR le matériel (pour le catalogue)
CREATE POLICY "Everybody can view equipment"
ON public.equipment
FOR SELECT
USING (true);

-- Politique : Le STOCK MANAGER (et admins) peut TOUT FAIRE sur le matériel
CREATE POLICY "Stock Managers manage all equipment"
ON public.equipment
FOR ALL
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'stock_manager' OR
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
);

-- Politique : Les utilisateurs standard peuvent gérer LEUR PROPRE matériel (si applicable)
CREATE POLICY "Users manage own equipment"
ON public.equipment
FOR ALL
USING (
  auth.uid() = owner_id
);


-- 2. Table INTERVENTIONS (Missions)
ALTER TABLE public.interventions ENABLE ROW LEVEL SECURITY;

-- Politique : Le STOCK MANAGER peut TOUT FAIRE sur les interventions
CREATE POLICY "Stock Managers manage all interventions"
ON public.interventions
FOR ALL
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'stock_manager' OR
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
);

-- Politique : Le TECHNICIEN peut VOIR et MODIFIER les interventions qui lui sont assignées
CREATE POLICY "Technicians view assigned interventions"
ON public.interventions
FOR SELECT
USING (
  auth.uid() = technician_id
);

CREATE POLICY "Technicians update assigned interventions"
ON public.interventions
FOR UPDATE
USING (
  auth.uid() = technician_id
);
