-- AgriRent Hub - Diagnostic et Correction des Rôles
-- Exécutez ces commandes dans votre SQL Editor Supabase

-- ========================================
-- 1. VÉRIFIER LES RÔLES ACTUELS
-- ========================================

-- Afficher tous les utilisateurs et leurs rôles
SELECT 
    id,
    email,
    raw_user_meta_data->>'full_name' as full_name,
    raw_user_meta_data->>'role' as role,
    created_at
FROM auth.users
ORDER BY created_at DESC;

-- ========================================
-- 2. CORRIGER LE RÔLE SUPER ADMIN
-- ========================================

-- Option A: Si vous connaissez l'email du Super Admin
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
    raw_user_meta_data,
    '{role}',
    '"super_admin"'
)
WHERE email = 'VOTRE_EMAIL_ICI@example.com';

-- Option B: Mettre à jour par ID utilisateur
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
    raw_user_meta_data,
    '{role}',
    '"super_admin"'
)
WHERE id = 'VOTRE_USER_ID_ICI';

-- ========================================
-- 3. CRÉER/CORRIGER UN SUPER ADMIN DE RÉFÉRENCE
-- ========================================

-- Remplacez les valeurs par les vôtres
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
    jsonb_set(
        raw_user_meta_data,
        '{role}',
        '"super_admin"'
    ),
    '{full_name}',
    '"Super Administrateur"'
)
WHERE email = 'admin@outiltech.com';

-- ========================================
-- 4. VÉRIFIER LA MISE À JOUR
-- ========================================

SELECT 
    email,
    raw_user_meta_data->>'role' as role,
    raw_user_meta_data->>'full_name' as full_name
FROM auth.users
WHERE email = 'VOTRE_EMAIL_ICI@example.com';

-- ========================================
-- 5. CORRIGER PLUSIEURS UTILISATEURS EN MASSE
-- ========================================

-- Techniciens
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(raw_user_meta_data, '{role}', '"technician"')
WHERE email IN ('tech1@example.com', 'tech2@example.com');

-- Clients
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(raw_user_meta_data, '{role}', '"client"')
WHERE email IN ('client1@example.com', 'client2@example.com');

-- Stock Managers
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(raw_user_meta_data, '{role}', '"stock_manager"')
WHERE email IN ('stock1@example.com');

-- Accountants
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(raw_user_meta_data, '{role}', '"accountant"')
WHERE email IN ('compta@example.com');

-- ========================================
-- 6. VALEURS DE RÔLES VALIDES
-- ========================================

/*
Rôles acceptés par le système (normalisés automatiquement):
- "super_admin" ou "Super Admin" ou "SUPER_ADMIN"
- "admin" ou "Admin" ou "Administrateur"
- "technician" ou "Technician" ou "Technicien"
- "stock_manager" ou "Stock Manager" ou "Gestionnaire Stock"
- "client" ou "Client"
- "accountant" ou "Accountant" ou "Comptable"

RECOMMANDATION: Utilisez toujours la version snake_case en minuscules:
- super_admin
- admin
- technician
- stock_manager
- client
- accountant
*/

-- ========================================
-- 7. SUPPRIMER LES RÔLES INVALIDES
-- ========================================

-- Réinitialiser les rôles invalides à NULL
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data - 'role'
WHERE raw_user_meta_data->>'role' NOT IN (
    'super_admin', 'admin', 'technician', 'stock_manager', 'client', 'accountant',
    'Super Admin', 'Admin', 'Technician', 'Stock Manager', 'Client', 'Accountant'
);

-- ========================================
-- 8. STATISTIQUES DES RÔLES
-- ========================================

SELECT 
    raw_user_meta_data->>'role' as role,
    COUNT(*) as count
FROM auth.users
GROUP BY raw_user_meta_data->>'role'
ORDER BY count DESC;
