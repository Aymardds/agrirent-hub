-- ============================================================
-- MIGRATION: Système de Commandes Groupées Coopératives
-- AgriRent Hub — Outiltech
-- ============================================================

-- 1. Ajouter le lien coopérative dans les profils clients
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS cooperative_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Index pour accélérer les requêtes sur cooperative_id
CREATE INDEX IF NOT EXISTS idx_profiles_cooperative_id ON profiles(cooperative_id);

-- 2. Table principale des commandes groupées
CREATE TABLE IF NOT EXISTS cooperative_orders (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cooperative_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title               TEXT NOT NULL,
  description         TEXT,
  prestation_type     TEXT NOT NULL,     -- 'labourage', 'moissonnage', 'semis', etc.
  quota_type          TEXT NOT NULL DEFAULT 'area', -- 'area' (ha) | 'members' (nombre)
  quota_target        NUMERIC NOT NULL,  -- ex: 80 (ha) ou 20 (membres)
  current_progress    NUMERIC NOT NULL DEFAULT 0,
  equipment_type      TEXT,              -- type de matériel souhaité
  price_per_ha        NUMERIC,           -- prix estimé par hectare
  deadline            DATE,
  status              TEXT NOT NULL DEFAULT 'open',
    -- 'open'          : en cours de collecte des participations
    -- 'quota_reached' : quota atteint, en attente de soumission
    -- 'submitted'     : transmis à l'admin Outiltech
    -- 'confirmed'     : confirmé et planifié par l'admin
    -- 'cancelled'     : annulé
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at        TIMESTAMPTZ,       -- date de transmission à l'admin
  admin_confirmed_at  TIMESTAMPTZ,       -- date de confirmation par l'admin
  admin_notes         TEXT               -- notes de l'admin lors de la confirmation
);

-- Index
CREATE INDEX IF NOT EXISTS idx_cooperative_orders_cooperative_id ON cooperative_orders(cooperative_id);
CREATE INDEX IF NOT EXISTS idx_cooperative_orders_status ON cooperative_orders(status);

-- 3. Table des participations individuelles
CREATE TABLE IF NOT EXISTS cooperative_order_participations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id         UUID NOT NULL REFERENCES cooperative_orders(id) ON DELETE CASCADE,
  member_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  committed_area   NUMERIC NOT NULL DEFAULT 0, -- superficie ou nb confirmé par ce membre
  property_id      UUID REFERENCES properties(id) ON DELETE SET NULL,
  status           TEXT NOT NULL DEFAULT 'pending',
    -- 'pending'   : participation enregistrée, en attente de validation
    -- 'confirmed' : confirmée
    -- 'cancelled' : annulée par le membre
  notes            TEXT,
  joined_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(order_id, member_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_cop_participations_order_id ON cooperative_order_participations(order_id);
CREATE INDEX IF NOT EXISTS idx_cop_participations_member_id ON cooperative_order_participations(member_id);

-- ============================================================
-- TRIGGER: Mise à jour automatique de current_progress
-- ============================================================
CREATE OR REPLACE FUNCTION update_cooperative_order_progress()
RETURNS TRIGGER AS $$
DECLARE
  v_total NUMERIC;
  v_order cooperative_orders%ROWTYPE;
BEGIN
  -- Calculer la progression totale (somme des participations confirmées ou pending)
  SELECT COALESCE(SUM(committed_area), 0)
    INTO v_total
    FROM cooperative_order_participations
   WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
     AND status != 'cancelled';

  -- Mettre à jour la commande
  UPDATE cooperative_orders
     SET current_progress = v_total,
         status = CASE
           WHEN status = 'open' AND v_total >= quota_target THEN 'quota_reached'
           WHEN status = 'quota_reached' AND v_total < quota_target THEN 'open'
           ELSE status
         END
   WHERE id = COALESCE(NEW.order_id, OLD.order_id)
  RETURNING * INTO v_order;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_cooperative_order_progress ON cooperative_order_participations;
CREATE TRIGGER trg_update_cooperative_order_progress
  AFTER INSERT OR UPDATE OR DELETE ON cooperative_order_participations
  FOR EACH ROW EXECUTE FUNCTION update_cooperative_order_progress();

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================

-- Activer RLS
ALTER TABLE cooperative_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE cooperative_order_participations ENABLE ROW LEVEL SECURITY;

-- Fonctions helper SECURITY DEFINER (évitent la récursion RLS)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text AS $$
DECLARE
  user_role text;
BEGIN
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

-- Policies pour cooperative_orders
DROP POLICY IF EXISTS "Coopératives voient leurs propres commandes" ON cooperative_orders;
DROP POLICY IF EXISTS "Coopératives créent leurs commandes" ON cooperative_orders;
DROP POLICY IF EXISTS "Coopératives et admins modifient les commandes" ON cooperative_orders;

CREATE POLICY "Coopératives voient leurs propres commandes"
  ON cooperative_orders FOR SELECT
  USING (
    cooperative_id = auth.uid()
    OR cooperative_id = public.get_my_cooperative_id()
    OR public.get_my_role() IN ('admin', 'super_admin')
  );

CREATE POLICY "Coopératives créent leurs commandes"
  ON cooperative_orders FOR INSERT
  WITH CHECK (
    cooperative_id = auth.uid()
    AND public.get_my_role() = 'cooperative'
  );

CREATE POLICY "Coopératives et admins modifient les commandes"
  ON cooperative_orders FOR UPDATE
  USING (
    cooperative_id = auth.uid()
    OR public.get_my_role() IN ('admin', 'super_admin')
  );

-- Policies pour cooperative_order_participations
DROP POLICY IF EXISTS "Membres voient les participations de leurs commandes" ON cooperative_order_participations;
DROP POLICY IF EXISTS "Membres créent leurs propres participations" ON cooperative_order_participations;
DROP POLICY IF EXISTS "Membres modifient leurs propres participations" ON cooperative_order_participations;

CREATE POLICY "Membres voient les participations de leurs commandes"
  ON cooperative_order_participations FOR SELECT
  USING (
    member_id = auth.uid()
    OR public.get_my_role() IN ('admin', 'super_admin')
    OR EXISTS (
      SELECT 1 FROM cooperative_orders co
       WHERE co.id = cooperative_order_participations.order_id
         AND co.cooperative_id = auth.uid()
    )
  );

CREATE POLICY "Membres créent leurs propres participations"
  ON cooperative_order_participations FOR INSERT
  WITH CHECK (
    member_id = auth.uid()
    AND public.get_my_role() = 'client'
  );

CREATE POLICY "Membres modifient leurs propres participations"
  ON cooperative_order_participations FOR UPDATE
  USING (member_id = auth.uid());

-- ============================================================
-- DONNÉES DE TEST (optionnel — commenter en production)
-- ============================================================
-- INSERT INTO cooperative_orders (cooperative_id, title, prestation_type, quota_target, deadline)
-- VALUES ('<UUID_COOPERATIVE>', 'Labourage collectif Automne 2026', 'labourage', 80, '2026-10-31');
