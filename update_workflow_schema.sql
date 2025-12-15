-- Assurez-vous que les status sont cohérents
-- Modifier la contrainte de check si elle existe pour inclure 'validated_return'

ALTER TABLE public.interventions 
DROP CONSTRAINT IF EXISTS interventions_status_check;

ALTER TABLE public.interventions 
ADD CONSTRAINT interventions_status_check 
CHECK (status IN ('pending', 'in_progress', 'completed', 'validated_return', 'cancelled'));

-- Ajouter une colonne technician_id si elle n'existe pas (juste au cas où)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'interventions' AND column_name = 'technician_id') THEN
        ALTER TABLE public.interventions ADD COLUMN technician_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Ajouter une colonne equipment_id si elle n'existe pas
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'interventions' AND column_name = 'equipment_id') THEN
        ALTER TABLE public.interventions ADD COLUMN equipment_id UUID REFERENCES public.equipment(id);
    END IF;
END $$;
