-- =============================================
-- SCRIPT DE RÉPARATION COMPLET (v4) - SPÉCIAL LOGIN FIX
-- Ce script corrige les incohérences de création d'utilisateur
-- qui causent l'erreur "Unable to process request".
-- =============================================

-- 1. EXTENSIONS ET SCHÉMAS
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- S'assurer que le schéma public est accessible
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- 2. CORRECTION DES CONTRAINTES DE RÔLES
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
CHECK (role IN (
  'client', 
  'cooperative', 
  'provider', 
  'super_admin', 
  'admin', 
  'technician', 
  'stock_manager', 
  'accountant'
));

-- 3. FONCTION DE CRÉATION D'UTILISATEUR AMÉLIORÉE (RPC)
-- Cette version est plus rigoureuse sur les champs obligatoires de Supabase Auth
CREATE OR REPLACE FUNCTION public.create_user_by_admin(
    new_email TEXT,
    new_password TEXT,
    new_full_name TEXT,
    new_role TEXT,
    new_phone TEXT DEFAULT NULL,
    new_company TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    new_user_id UUID;
    encrypted_pw TEXT;
    existing_user_id UUID;
BEGIN
    -- Vérification d'existence
    SELECT id INTO existing_user_id FROM auth.users WHERE email = new_email;
    IF existing_user_id IS NOT NULL THEN
        RETURN jsonb_build_object('error', 'Email déjà utilisé');
    END IF;

    -- Préparation des données
    encrypted_pw := crypt(new_password, gen_salt('bf'));
    new_user_id := gen_random_uuid();

    -- Insertion dans auth.users (Format Supabase Natif)
    INSERT INTO auth.users (
        instance_id, 
        id, 
        aud, 
        role, 
        email, 
        encrypted_password, 
        email_confirmed_at,
        last_sign_in_at,
        raw_app_meta_data, 
        raw_user_meta_data, 
        is_super_admin,
        created_at, 
        updated_at,
        confirmation_token,
        recovery_token,
        email_change_token_new,
        is_sso_user,
        is_anonymous
    ) VALUES (
        '00000000-0000-0000-0000-000000000000', 
        new_user_id, 
        'authenticated', 
        'authenticated', 
        new_email,
        encrypted_pw, 
        now(), -- Email déjà confirmé pour les créations admin
        now(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        jsonb_build_object(
            'full_name', new_full_name, 
            'role', new_role, 
            'phone', new_phone, 
            'company', new_company
        ),
        false,
        now(), 
        now(),
        '', -- tokens vides
        '',
        '',
        false,
        false
    );

    -- Insertion dans auth.identities
    INSERT INTO auth.identities (
        id, 
        user_id, 
        provider_id, 
        identity_data, 
        provider, 
        last_sign_in_at, 
        created_at, 
        updated_at
    ) VALUES (
        new_user_id, 
        new_user_id, 
        new_email, 
        jsonb_build_object('sub', new_user_id, 'email', new_email),
        'email', 
        now(), 
        now(), 
        now()
    );

    -- Profil Public (Le trigger gérera normalement l'insertion, mais on assure ici)
    INSERT INTO public.profiles (id, full_name, role, phone, company)
    VALUES (new_user_id, new_full_name, new_role, new_phone, new_company)
    ON CONFLICT (id) DO UPDATE
    SET 
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        phone = EXCLUDED.phone,
        company = EXCLUDED.company,
        updated_at = now();

    RETURN jsonb_build_object('id', new_user_id, 'email', new_email, 'status', 'success');
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('error', 'Erreur SQL: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. TRIGGER DE CRÉATION DE PROFIL (ROBUSTE)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, phone, company)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    COALESCE(new.raw_user_meta_data->>'role', 'client'),
    new.raw_user_meta_data->>'phone', 
    new.raw_user_meta_data->>'company'
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    phone = EXCLUDED.phone,
    company = EXCLUDED.company,
    updated_at = now();
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Ne pas bloquer la création de l'user auth si le profil échoue (mais logger idéalement)
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Message de succès final
SELECT 'La réparation v4 a été configurée avec succès. Veuillez tester la connexion.' as result;
