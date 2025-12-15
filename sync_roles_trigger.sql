-- =============================================
-- SYNC ROLES TRIGGER
-- Synchronise automatiquement le rôle de profiles vers auth.users
-- =============================================

-- 1. Créer la fonction qui fait le travail
CREATE OR REPLACE FUNCTION public.sync_user_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Vérifier si le rôle a changé
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    -- Mettre à jour les métadonnées de l'utilisateur auth
    UPDATE auth.users
    SET raw_user_meta_data = 
      -- Met à jour la clé 'role' dans le JSON existant, ou crée un nouveau JSON si null
      jsonb_set(
        COALESCE(raw_user_meta_data, '{}'::jsonb),
        '{role}',
        to_jsonb(NEW.role)
      )
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Créer le trigger qui appelle la fonction
DROP TRIGGER IF EXISTS on_profile_role_change ON public.profiles;

CREATE TRIGGER on_profile_role_change
  AFTER UPDATE OF role ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_role();

-- 3. (Optionnel) Synchronisation Initiale pour corriger les décalages existants
-- Décommentez la ligne suivante si vous voulez forcer une synchro maintenant
-- UPDATE public.profiles SET role = role; 
