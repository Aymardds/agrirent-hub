-- =============================================
-- SCRIPT DE RÉPARATION COMPLET (v2)
-- Exécutez tout ce contenu dans Supabase SQL Editor
-- =============================================

-- 1. CORRECTION DES ROLES (Accepter 'technician' et 'stock_manager')
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
CHECK (role IN ('client', 'cooperative', 'provider', 'super_admin', 'admin', 'technician', 'stock_manager', 'accountant'));

-- 2. CORRECTION DU TRIGGER (Pour les invitations Supabase)
-- Cette fonction est appelée automatiquement quand un utilisateur est invité/créé via Supabase Auth
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
  ON CONFLICT (id) DO NOTHING; -- Avoid errors if profile exists
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. CORRECTION DE LA FONCTION RPC (Pour la création via l'App Admin)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

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
    SELECT id INTO existing_user_id FROM auth.users WHERE email = new_email;
    IF existing_user_id IS NOT NULL THEN
        RETURN jsonb_build_object('error', 'Email déjà utilisé');
    END IF;

    encrypted_pw := crypt(new_password, gen_salt('bf'));
    new_user_id := gen_random_uuid();

    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at, is_super_admin
    ) VALUES (
        '00000000-0000-0000-0000-000000000000', new_user_id, 'authenticated', 'authenticated', new_email,
        encrypted_pw, now(), '{"provider": "email", "providers": ["email"]}',
        jsonb_build_object('full_name', new_full_name, 'role', new_role, 'phone', new_phone, 'company', new_company),
        now(), now(), false
    );

    INSERT INTO auth.identities (
        id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) VALUES (
        new_user_id, new_user_id, new_email,
        jsonb_build_object('sub', new_user_id, 'email', new_email),
        'email', now(), now(), now()
    );

    INSERT INTO public.profiles (id, full_name, role, phone, company)
    VALUES (new_user_id, new_full_name, new_role, new_phone, new_company)
    ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name, role = EXCLUDED.role, phone = EXCLUDED.phone, company = EXCLUDED.company;

    RETURN jsonb_build_object('id', new_user_id, 'email', new_email);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('error', 'Erreur SQL: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
