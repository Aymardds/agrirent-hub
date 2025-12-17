-- Configuration de l'authentification par email avec confirmation
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Activer la confirmation d'email (à faire via l'interface Supabase)
-- Allez dans Authentication > Settings > Email Auth
-- Activez "Enable email confirmations"

-- 2. Configurer les templates d'email
-- Allez dans Authentication > Email Templates

-- Template pour "Confirm signup":
-- Subject: Confirmez votre inscription à OUTILTECH
-- Body (HTML):
/*
<h2>Bienvenue sur OUTILTECH !</h2>
<p>Merci de vous être inscrit. Pour activer votre compte, veuillez cliquer sur le lien ci-dessous :</p>
<p><a href="{{ .ConfirmationURL }}">Confirmer mon email</a></p>
<p>Ce lien expirera dans 24 heures.</p>
<p>Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.</p>
<br>
<p>L'équipe OUTILTECH</p>
*/

-- Template pour "Reset password":
-- Subject: Réinitialisation de votre mot de passe OUTILTECH
-- Body (HTML):
/*
<h2>Réinitialisation de mot de passe</h2>
<p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le lien ci-dessous :</p>
<p><a href="{{ .ConfirmationURL }}">Réinitialiser mon mot de passe</a></p>
<p>Ce lien expirera dans 1 heure.</p>
<p>Si vous n'avez pas fait cette demande, vous pouvez ignorer cet email.</p>
<br>
<p>L'équipe OUTILTECH</p>
*/

-- 3. Configurer les URL de redirection
-- Dans Authentication > URL Configuration
-- Site URL: https://votre-domaine.com (ou http://localhost:5173 pour le dev)
-- Redirect URLs: 
--   - https://votre-domaine.com/verify-email
--   - https://votre-domaine.com/reset-password
--   - http://localhost:5173/verify-email (pour le dev)
--   - http://localhost:5173/reset-password (pour le dev)

-- 4. Politique de sécurité pour les profils utilisateurs
-- S'assurer que les utilisateurs peuvent voir leur propre profil après confirmation

-- Vérifier que la table profiles existe
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    phone TEXT,
    company TEXT,
    role TEXT DEFAULT 'client',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS sur la table profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre aux utilisateurs de voir leur propre profil
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Politique pour permettre aux utilisateurs de mettre à jour leur propre profil
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- Fonction trigger pour créer automatiquement un profil après inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, phone, company, role)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'phone',
        NEW.raw_user_meta_data->>'company',
        COALESCE(NEW.raw_user_meta_data->>'role', 'client')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer le trigger existant s'il existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Créer le trigger pour les nouveaux utilisateurs
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 5. Fonction pour renvoyer l'email de confirmation
CREATE OR REPLACE FUNCTION public.resend_confirmation_email(user_email TEXT)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    -- Cette fonction doit être appelée côté client via supabase.auth.resend()
    -- Elle est ici pour documentation
    RETURN json_build_object(
        'message', 'Utilisez supabase.auth.resend() côté client',
        'email', user_email
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Vue pour voir les utilisateurs non confirmés (admin uniquement)
CREATE OR REPLACE VIEW public.unconfirmed_users AS
SELECT 
    id,
    email,
    created_at,
    confirmation_sent_at,
    email_confirmed_at
FROM auth.users
WHERE email_confirmed_at IS NULL
ORDER BY created_at DESC;

-- Politique RLS pour la vue (admin/super_admin uniquement)
ALTER VIEW public.unconfirmed_users SET (security_invoker = on);

COMMENT ON TABLE public.profiles IS 'Profils utilisateurs avec informations étendues';
COMMENT ON FUNCTION public.handle_new_user() IS 'Crée automatiquement un profil lors de l''inscription d''un utilisateur';
COMMENT ON VIEW public.unconfirmed_users IS 'Liste des utilisateurs qui n''ont pas encore confirmé leur email';
