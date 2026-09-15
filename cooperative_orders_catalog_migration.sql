-- ============================================================
-- MIGRATION: Intégration du Catalogue aux Commandes Groupées
-- AgriRent Hub — Outiltech
-- ============================================================

-- 1. Ajouter les colonnes de liaison directe au catalogue d'équipements et services
ALTER TABLE public.cooperative_orders
  ADD COLUMN IF NOT EXISTS equipment_id UUID REFERENCES public.equipment(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES public.equipment_services(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS price_unit TEXT DEFAULT 'Hectare';

-- 2. Index pour optimiser les performances des requêtes avec jointure
CREATE INDEX IF NOT EXISTS idx_cooperative_orders_equipment_id ON public.cooperative_orders(equipment_id);
CREATE INDEX IF NOT EXISTS idx_cooperative_orders_service_id ON public.cooperative_orders(service_id);
