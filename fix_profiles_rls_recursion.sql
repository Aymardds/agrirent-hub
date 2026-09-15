-- ============================================================
-- CORRECTIF D'URGENCE: Infinite Recursion sur `profiles`
-- AgriRent Hub — Outiltech
-- ============================================================
-- Ce script supprime la récursion infinie causée par les sous-requêtes
-- `EXISTS (SELECT 1 FROM profiles ...)` à l'intérieur des politiques RLS de `profiles`.
-- ============================================================

-- 1. Fonctions SECURITY DEFINER (bypasses RLS safely sans récursion)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text AS $$
DECLARE
  user_role text;
BEGIN
  -- Cette requête outrepasse le RLS car la fonction est SECURITY DEFINER
  SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_my_cooperative_id()
RETURNS uuid AS $$
DECLARE
  coop_id uuid;
BEGIN
  SELECT cooperative_id INTO coop_id FROM public.profiles WHERE id = auth.uid();
  RETURN coop_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 2. Supprimer TOUTES les anciennes politiques potentiellement récursives sur profiles
DROP POLICY IF EXISTS "Coopératives voient leurs membres et clients disponibles" ON public.profiles;
DROP POLICY IF EXISTS "Coopératives gèrent le rattachement de leurs membres" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Staff can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Profiles select policy" ON public.profiles;
DROP POLICY IF EXISTS "Profiles update policy" ON public.profiles;

-- 3. Recréer des politiques RLS 100% NON-RÉCURSIVES sur `profiles`

-- SELECT : Lecture des profils
CREATE POLICY "Profiles select policy"
ON public.profiles FOR SELECT
TO authenticated
USING (
  -- Un utilisateur peut toujours voir son propre profil
  auth.uid() = id
  -- Une coopérative peut voir ses membres rattachés
  OR cooperative_id = auth.uid()
  -- Le personnel et les administrateurs peuvent voir tous les profils (sans récursion via helper function)
  OR public.get_my_role() IN ('super_admin', 'admin', 'stock_manager', 'accountant', 'technician')
  -- Une coopérative peut voir les clients non affiliés pour les inviter
  OR (public.get_my_role() = 'cooperative' AND role = 'client' AND cooperative_id IS NULL)
);

-- UPDATE : Modification des profils
CREATE POLICY "Profiles update policy"
ON public.profiles FOR UPDATE
TO authenticated
USING (
  -- Mon propre profil
  auth.uid() = id
  -- Administrateurs
  OR public.get_my_role() IN ('super_admin', 'admin')
  -- Coopérative modifie le cooperative_id d'un client rattaché ou disponible
  OR (
    public.get_my_role() = 'cooperative'
    AND role = 'client'
    AND (cooperative_id = auth.uid() OR cooperative_id IS NULL)
  )
)
WITH CHECK (
  auth.uid() = id
  OR public.get_my_role() IN ('super_admin', 'admin')
  OR (
    public.get_my_role() = 'cooperative'
    AND role = 'client'
    AND (cooperative_id = auth.uid() OR cooperative_id IS NULL)
  )
);

-- 4. Corriger la politique sur `properties` pour éviter tout risque
DROP POLICY IF EXISTS "Coopératives voient les propriétés de leurs membres" ON public.properties;

CREATE POLICY "Coopératives voient les propriétés de leurs membres"
ON public.properties FOR SELECT
TO authenticated
USING (
  -- Propriétaire de la parcelle
  auth.uid() = owner_id
  -- Admin / Super admin
  OR public.get_my_role() IN ('super_admin', 'admin')
  -- Coopérative dont l'agriculteur est membre
  OR (
    public.get_my_role() = 'cooperative'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
       WHERE p.id = properties.owner_id
         AND p.cooperative_id = auth.uid()
    )
  )
);

-- 5. Corriger les politiques de `cooperative_orders` si nécessaire
DROP POLICY IF EXISTS "Coopératives voient leurs propres commandes" ON public.cooperative_orders;
DROP POLICY IF EXISTS "Coopératives créent leurs commandes" ON public.cooperative_orders;
DROP POLICY IF EXISTS "Coopératives et admins modifient les commandes" ON public.cooperative_orders;

CREATE POLICY "Coopératives voient leurs propres commandes"
ON public.cooperative_orders FOR SELECT
TO authenticated
USING (
  cooperative_id = auth.uid()
  OR cooperative_id = public.get_my_cooperative_id()
  OR public.get_my_role() IN ('admin', 'super_admin')
);

CREATE POLICY "Coopératives créent leurs commandes"
ON public.cooperative_orders FOR INSERT
TO authenticated
WITH CHECK (
  cooperative_id = auth.uid()
  AND public.get_my_role() = 'cooperative'
);

CREATE POLICY "Coopératives et admins modifient les commandes"
ON public.cooperative_orders FOR UPDATE
TO authenticated
USING (
  cooperative_id = auth.uid()
  OR public.get_my_role() IN ('admin', 'super_admin')
);

-- 6. Corriger les politiques de `cooperative_order_participations` si nécessaire
DROP POLICY IF EXISTS "Membres voient les participations de leurs commandes" ON public.cooperative_order_participations;
DROP POLICY IF EXISTS "Membres créent leurs propres participations" ON public.cooperative_order_participations;
DROP POLICY IF EXISTS "Membres modifient leurs propres participations" ON public.cooperative_order_participations;

CREATE POLICY "Membres voient les participations de leurs commandes"
ON public.cooperative_order_participations FOR SELECT
TO authenticated
USING (
  member_id = auth.uid()
  OR public.get_my_role() IN ('admin', 'super_admin')
  OR EXISTS (
    SELECT 1 FROM public.cooperative_orders co
     WHERE co.id = cooperative_order_participations.order_id
       AND co.cooperative_id = auth.uid()
  )
);

CREATE POLICY "Membres créent leurs propres participations"
ON public.cooperative_order_participations FOR INSERT
TO authenticated
WITH CHECK (
  member_id = auth.uid()
  AND public.get_my_role() = 'client'
);

CREATE POLICY "Membres modifient leurs propres participations"
ON public.cooperative_order_participations FOR UPDATE
TO authenticated
USING (member_id = auth.uid());
