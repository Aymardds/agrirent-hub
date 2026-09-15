-- ============================================================
-- MIGRATION: Gestion des Membres de Coopératives (Non-Récursive)
-- AgriRent Hub — Outiltech
-- ============================================================

-- 1. Helper function SECURITY DEFINER (évite toute récursion RLS sur profiles)
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

-- 2. Nettoyage des anciennes politiques récursives sur profiles
DROP POLICY IF EXISTS "Coopératives voient leurs membres et clients disponibles" ON public.profiles;
DROP POLICY IF EXISTS "Coopératives gèrent le rattachement de leurs membres" ON public.profiles;
DROP POLICY IF EXISTS "Profiles select policy" ON public.profiles;
DROP POLICY IF EXISTS "Profiles update policy" ON public.profiles;

-- 3. Politiques RLS sans récursion sur `profiles`
CREATE POLICY "Profiles select policy"
ON public.profiles FOR SELECT
TO authenticated
USING (
  -- L'utilisateur voit son propre profil
  auth.uid() = id
  -- La coopérative voit ses membres rattachés
  OR cooperative_id = auth.uid()
  -- Staff et admins voient tout (via fonction SECURITY DEFINER sans boucle)
  OR public.get_my_role() IN ('super_admin', 'admin', 'stock_manager', 'accountant', 'technician')
  -- La coopérative peut voir les clients non rattachés pour les affilier
  OR (public.get_my_role() = 'cooperative' AND role = 'client' AND cooperative_id IS NULL)
);

CREATE POLICY "Profiles update policy"
ON public.profiles FOR UPDATE
TO authenticated
USING (
  -- Mon propre profil
  auth.uid() = id
  -- Admins
  OR public.get_my_role() IN ('super_admin', 'admin')
  -- Coopérative modifiant l'affiliation d'un membre
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

-- 4. Politiques RLS sur `properties` pour permettre à la coopérative de voir les parcelles de ses membres
DROP POLICY IF EXISTS "Coopératives voient les propriétés de leurs membres" ON public.properties;

CREATE POLICY "Coopératives voient les propriétés de leurs membres"
ON public.properties FOR SELECT
TO authenticated
USING (
  auth.uid() = owner_id
  OR public.get_my_role() IN ('super_admin', 'admin')
  OR (
    public.get_my_role() = 'cooperative'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
       WHERE p.id = properties.owner_id
         AND p.cooperative_id = auth.uid()
    )
  )
);

-- 5. Fonction RPC sécurisée : Inscription directe d'un membre par sa coopérative
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.cooperative_create_member(
    new_email TEXT,
    new_password TEXT,
    new_full_name TEXT,
    new_phone TEXT DEFAULT NULL,
    new_company TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_coop_id UUID;
    v_coop_role TEXT;
    v_new_user_id UUID;
    v_encrypted_pw TEXT;
    v_existing_user_id UUID;
BEGIN
    v_coop_id := auth.uid();
    IF v_coop_id IS NULL THEN
        RETURN jsonb_build_object('error', 'Non authentifié');
    END IF;

    SELECT role INTO v_coop_role FROM public.profiles WHERE id = v_coop_id;
    IF v_coop_role NOT IN ('cooperative', 'admin', 'super_admin') THEN
        RETURN jsonb_build_object('error', 'Action réservée aux coopératives et administrateurs');
    END IF;

    SELECT id INTO v_existing_user_id FROM auth.users WHERE email = new_email;
    IF v_existing_user_id IS NOT NULL THEN
        UPDATE public.profiles
           SET cooperative_id = v_coop_id
         WHERE id = v_existing_user_id
           AND (cooperative_id IS NULL OR cooperative_id = v_coop_id);

        RETURN jsonb_build_object(
            'id', v_existing_user_id,
            'email', new_email,
            'message', 'Agriculteur existant rattaché à votre coopérative'
        );
    END IF;

    v_encrypted_pw := crypt(new_password, gen_salt('bf'));
    v_new_user_id := gen_random_uuid();

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
        v_new_user_id,
        'authenticated',
        'authenticated',
        new_email,
        v_encrypted_pw,
        now(),
        '{"provider": "email", "providers": ["email"]}',
        jsonb_build_object(
            'full_name', new_full_name,
            'role', 'client',
            'phone', new_phone,
            'company', new_company,
            'cooperative_id', v_coop_id
        ),
        now(),
        now(),
        false
    );

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
        v_new_user_id,
        v_new_user_id,
        new_email,
        jsonb_build_object('sub', v_new_user_id, 'email', new_email),
        'email',
        now(),
        now(),
        now()
    );

    INSERT INTO public.profiles (id, full_name, role, phone, company, cooperative_id)
    VALUES (v_new_user_id, new_full_name, 'client', new_phone, new_company, v_coop_id)
    ON CONFLICT (id) DO UPDATE
    SET 
        full_name = EXCLUDED.full_name,
        role = 'client',
        phone = EXCLUDED.phone,
        company = EXCLUDED.company,
        cooperative_id = v_coop_id;

    RETURN jsonb_build_object(
        'id', v_new_user_id,
        'email', new_email,
        'message', 'Membre créé et rattaché avec succès'
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('error', 'Erreur SQL: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
