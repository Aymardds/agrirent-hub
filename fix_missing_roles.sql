-- =============================================
-- SCRIPT DE RÉPARATION DES RÔLES MANQUANTS
-- =============================================

-- Ce script attribue un rôle par défaut aux utilisateurs qui n'en ont pas dans auth.users
-- Utile pour corriger le problème "rawRole: undefined"

-- 1. Donner le rôle 'super_admin' à l'utilisateur principal (remplacez l'email si besoin)
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"super_admin"'
)
WHERE email LIKE '%admin%'; -- Cible les emails contenant "admin"

-- 2. Donner le rôle 'stock_manager' par sécurité à tous les autres qui n'ont NULL
-- (Comme ça ils ne deviennent pas super_admin par erreur)
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"stock_manager"'
)
WHERE raw_user_meta_data ->> 'role' IS NULL;

-- 3. Vérification
SELECT email, raw_user_meta_data->>'role' as role FROM auth.users;
