-- =============================================
-- SCRIPT DE RÉPARATION COMPLET (v3)
-- Exécutez tout ce contenu dans Supabase SQL Editor
-- =============================================

-- 1. ACTIVER PGCRYPTO (Essentiel pour les mots de passe)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. CORRECTION DES ROLES (Accepter 'technician' et 'stock_manager')
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
CHECK (role IN ('client', 'cooperative', 'provider', 'super_admin', 'admin', 'technician', 'stock_manager', 'accountant'));

-- 3. ATTRIBUTION DES PERMISSIONS (CRUCIAL pour "Database error querying schema")
-- Donne les droits nécessaires aux rôles Supabase par défaut
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- 4. CORRECTION DU TRIGGER (Pour les invitations et inscriptions Supabase)
-- SECURITY DEFINER est CRUCIAL : cela permet à la fonction d'écrire dans la table profiles
-- même si l'utilisateur n'a pas encore le droit RLS.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, phone, company)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    COALESCE(new.raw_user_meta_data->>'role', 'client'), -- Fallback to client if null
    new.raw_user_meta_data->>'phone', 
    new.raw_user_meta_data->>'company'
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    phone = EXCLUDED.phone,
    company = EXCLUDED.company;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- S'assurer que le trigger est bien attaché
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. CORRECTION DE LA FONCTION RPC (Pour la création via l'App Admin)
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
    -- Vérification existence
    SELECT id INTO existing_user_id FROM auth.users WHERE email = new_email;
    IF existing_user_id IS NOT NULL THEN
        RETURN jsonb_build_object('error', 'Email déjà utilisé');
    END IF;

    encrypted_pw := crypt(new_password, gen_salt('bf'));
    new_user_id := gen_random_uuid();

    -- Insertion dans auth.users
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at, is_super_admin,
        confirmation_token, recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000', new_user_id, 'authenticated', 'authenticated', new_email,
        encrypted_pw, now(), '{"provider": "email", "providers": ["email"]}',
        jsonb_build_object('full_name', new_full_name, 'role', new_role, 'phone', new_phone, 'company', new_company),
        now(), now(), false,
        '', '' -- Tokens vides pour éviter les problèmes
    );

    -- Insertion dans auth.identities
    INSERT INTO auth.identities (
        id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) VALUES (
        new_user_id, new_user_id, new_email,
        jsonb_build_object('sub', new_user_id, 'email', new_email),
        'email', now(), now(), now()
    );

    -- Le trigger handle_new_user va s'occuper de créer le profil public, 
    -- mais on force quand même au cas où le trigger échouerait silencieusement (ceinture et bretelles)
    INSERT INTO public.profiles (id, full_name, role, phone, company)
    VALUES (new_user_id, new_full_name, new_role, new_phone, new_company)
    ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name, role = EXCLUDED.role, phone = EXCLUDED.phone, company = EXCLUDED.company;

    RETURN jsonb_build_object('id', new_user_id, 'email', new_email);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('error', 'Erreur SQL: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
