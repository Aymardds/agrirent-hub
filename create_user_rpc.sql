-- =============================================
-- CREATE USER RPC (Blindé & Sécurisé)
-- =============================================

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
    -- 1. Vérifier si l'email existe déjà dans auth.users
    SELECT id INTO existing_user_id FROM auth.users WHERE email = new_email;
    
    IF existing_user_id IS NOT NULL THEN
        RETURN jsonb_build_object('error', 'Cet adresse email est déjà utilisée par un autre utilisateur (ID: ' || existing_user_id || ')');
    END IF;

    -- 2. Générer le hash et l'ID
    encrypted_pw := crypt(new_password, gen_salt('bf'));
    new_user_id := gen_random_uuid();

    -- 3. Insérer dans auth.users
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        is_super_admin
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        new_user_id,
        'authenticated',
        'authenticated',
        new_email,
        encrypted_pw,
        now(),
        '{"provider": "email", "providers": ["email"]}',
        jsonb_build_object(
            'full_name', new_full_name,
            'role', new_role,
            'phone', new_phone,
            'company', new_company
        ),
        now(),
        now(),
        false
    );

    -- 4. Insérer dans auth.identities
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
        new_user_id, -- ID unique de l'identité
        new_user_id, -- Lien vers le user
        new_email,   -- L'email sert d'identifiant pour le provider 'email'
        jsonb_build_object('sub', new_user_id, 'email', new_email),
        'email',
        now(),
        now(),
        now()
    );

    -- 5. Profil Public
    INSERT INTO public.profiles (id, full_name, role, phone, company)
    VALUES (new_user_id, new_full_name, new_role, new_phone, new_company)
    ON CONFLICT (id) DO UPDATE
    SET 
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        phone = EXCLUDED.phone,
        company = EXCLUDED.company;

    RETURN jsonb_build_object(
        'id', new_user_id,
        'email', new_email
    );

EXCEPTION WHEN OTHERS THEN
    -- Capture toutes les autres erreurs SQL
    RETURN jsonb_build_object('error', 'Erreur SQL: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
