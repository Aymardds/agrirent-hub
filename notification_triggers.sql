-- Notification Triggers for AgriRent Hub
-- Automatically creates notifications for key events

-- ============================================
-- HELPER FUNCTION: Create Notification
-- ============================================
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id uuid,
  p_title text,
  p_message text,
  p_event_type text,
  p_type text DEFAULT 'info',
  p_action_url text DEFAULT NULL,
  p_related_entity_type text DEFAULT NULL,
  p_related_entity_id uuid DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'
)
RETURNS uuid AS $$
DECLARE
  v_notification_id uuid;
BEGIN
  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    event_type,
    type,
    action_url,
    related_entity_type,
    related_entity_id,
    metadata
  ) VALUES (
    p_user_id,
    p_title,
    p_message,
    p_event_type,
    p_type,
    p_action_url,
    p_related_entity_type,
    p_related_entity_id,
    p_metadata
  ) RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGER 1: Rental Created
-- ============================================
CREATE OR REPLACE FUNCTION notify_rental_created()
RETURNS TRIGGER AS $$
DECLARE
  v_client_name text;
  v_equipment_name text;
BEGIN
  -- Get client and equipment names
  SELECT full_name INTO v_client_name FROM public.profiles WHERE id = NEW.renter_id;
  SELECT name INTO v_equipment_name FROM public.equipment WHERE id = NEW.equipment_id;
  
  -- Notify the client
  PERFORM create_notification(
    NEW.renter_id,
    'Commande confirmée',
    'Votre commande de service pour ' || COALESCE(v_equipment_name, 'équipement') || ' a été enregistrée avec succès.',
    'rental_created',
    'success',
    '/dashboard/my-rentals',
    'rental',
    NEW.id,
    jsonb_build_object(
      'rental_id', NEW.id,
      'equipment_name', v_equipment_name,
      'total_price', NEW.total_price
    )
  );
  
  -- Notify all admins and stock managers
  PERFORM create_notification(
    p.id,
    'Nouvelle commande',
    'Nouvelle commande de ' || COALESCE(v_client_name, 'client') || ' pour ' || COALESCE(v_equipment_name, 'équipement') || '.',
    'rental_created',
    'info',
    '/dashboard/rentals',
    'rental',
    NEW.id,
    jsonb_build_object(
      'rental_id', NEW.id,
      'client_name', v_client_name,
      'equipment_name', v_equipment_name,
      'total_price', NEW.total_price
    )
  )
  FROM public.profiles p
  WHERE p.role IN ('admin', 'super_admin', 'stock_manager');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_rental_created ON public.rentals;
CREATE TRIGGER trigger_notify_rental_created
  AFTER INSERT ON public.rentals
  FOR EACH ROW
  EXECUTE FUNCTION notify_rental_created();

-- ============================================
-- TRIGGER 2: Mission Assigned to Technician
-- ============================================
CREATE OR REPLACE FUNCTION notify_mission_assigned()
RETURNS TRIGGER AS $$
DECLARE
  v_equipment_name text;
BEGIN
  -- Only notify if technician is being assigned (not null and changed)
  IF NEW.technician_id IS NOT NULL AND (TG_OP = 'INSERT' OR OLD.technician_id IS DISTINCT FROM NEW.technician_id) THEN
    -- Get equipment name
    SELECT name INTO v_equipment_name FROM public.equipment WHERE id = NEW.equipment_id;
    
    -- Notify the assigned technician
    PERFORM create_notification(
      NEW.technician_id,
      'Nouvelle mission assignée',
      'Une nouvelle mission vous a été assignée : ' || COALESCE(NEW.title, 'Intervention') || '.',
      'mission_assigned',
      'info',
      '/dashboard/interventions',
      'intervention',
      NEW.id,
      jsonb_build_object(
        'intervention_id', NEW.id,
        'title', NEW.title,
        'equipment_name', v_equipment_name,
        'priority', NEW.priority,
        'scheduled_date', NEW.scheduled_date
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_mission_assigned ON public.interventions;
CREATE TRIGGER trigger_notify_mission_assigned
  AFTER INSERT OR UPDATE OF technician_id ON public.interventions
  FOR EACH ROW
  EXECUTE FUNCTION notify_mission_assigned();

-- ============================================
-- TRIGGER 3: Mission Status Changed
-- ============================================
CREATE OR REPLACE FUNCTION notify_mission_status_changed()
RETURNS TRIGGER AS $$
DECLARE
  v_client_id uuid;
  v_client_name text;
  v_technician_name text;
  v_equipment_name text;
BEGIN
  -- Only process if status actually changed
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    -- Get related information
    SELECT name INTO v_equipment_name FROM public.equipment WHERE id = NEW.equipment_id;
    SELECT full_name INTO v_technician_name FROM public.profiles WHERE id = NEW.technician_id;
    
    -- Get client from rental if linked
    IF NEW.rental_id IS NOT NULL THEN
      SELECT renter_id, p.full_name 
      INTO v_client_id, v_client_name
      FROM public.rentals r
      JOIN public.profiles p ON p.id = r.renter_id
      WHERE r.id = NEW.rental_id;
    END IF;
    
    -- Mission started
    IF NEW.status = 'in_progress' THEN
      -- Notify client if exists
      IF v_client_id IS NOT NULL THEN
        PERFORM create_notification(
          v_client_id,
          'Mission démarrée',
          'La mission ' || COALESCE(NEW.title, 'intervention') || ' a démarré.',
          'mission_started',
          'info',
          '/dashboard/my-rentals',
          'intervention',
          NEW.id,
          jsonb_build_object(
            'intervention_id', NEW.id,
            'title', NEW.title,
            'technician_name', v_technician_name
          )
        );
      END IF;
      
      -- Notify admins
      PERFORM create_notification(
        p.id,
        'Mission en cours',
        'Mission ' || COALESCE(NEW.title, 'intervention') || ' démarrée par ' || COALESCE(v_technician_name, 'technicien') || '.',
        'mission_started',
        'info',
        '/dashboard/interventions',
        'intervention',
        NEW.id,
        jsonb_build_object(
          'intervention_id', NEW.id,
          'title', NEW.title,
          'technician_name', v_technician_name
        )
      )
      FROM public.profiles p
      WHERE p.role IN ('admin', 'super_admin', 'stock_manager');
    END IF;
    
    -- Mission completed
    IF NEW.status = 'completed' THEN
      -- Notify client if exists
      IF v_client_id IS NOT NULL THEN
        PERFORM create_notification(
          v_client_id,
          'Mission terminée',
          'La mission ' || COALESCE(NEW.title, 'intervention') || ' a été terminée avec succès.',
          'mission_completed',
          'success',
          '/dashboard/my-rentals',
          'intervention',
          NEW.id,
          jsonb_build_object(
            'intervention_id', NEW.id,
            'title', NEW.title,
            'technician_name', v_technician_name,
            'area_covered', NEW.area_covered
          )
        );
      END IF;
      
      -- Notify admins
      PERFORM create_notification(
        p.id,
        'Mission terminée',
        'Mission ' || COALESCE(NEW.title, 'intervention') || ' terminée par ' || COALESCE(v_technician_name, 'technicien') || '.',
        'mission_completed',
        'success',
        '/dashboard/interventions',
        'intervention',
        NEW.id,
        jsonb_build_object(
          'intervention_id', NEW.id,
          'title', NEW.title,
          'technician_name', v_technician_name,
          'area_covered', NEW.area_covered
        )
      )
      FROM public.profiles p
      WHERE p.role IN ('admin', 'super_admin', 'stock_manager');
    END IF;
    
    -- Mission cancelled
    IF NEW.status = 'cancelled' THEN
      -- Notify technician if assigned
      IF NEW.technician_id IS NOT NULL THEN
        PERFORM create_notification(
          NEW.technician_id,
          'Mission annulée',
          'La mission ' || COALESCE(NEW.title, 'intervention') || ' a été annulée.',
          'mission_cancelled',
          'warning',
          '/dashboard/interventions',
          'intervention',
          NEW.id,
          jsonb_build_object(
            'intervention_id', NEW.id,
            'title', NEW.title
          )
        );
      END IF;
      
      -- Notify client if exists
      IF v_client_id IS NOT NULL THEN
        PERFORM create_notification(
          v_client_id,
          'Mission annulée',
          'La mission ' || COALESCE(NEW.title, 'intervention') || ' a été annulée.',
          'mission_cancelled',
          'warning',
          '/dashboard/my-rentals',
          'intervention',
          NEW.id,
          jsonb_build_object(
            'intervention_id', NEW.id,
            'title', NEW.title
          )
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_mission_status_changed ON public.interventions;
CREATE TRIGGER trigger_notify_mission_status_changed
  AFTER UPDATE OF status ON public.interventions
  FOR EACH ROW
  EXECUTE FUNCTION notify_mission_status_changed();

-- ============================================
-- TRIGGER 4: Payment Received
-- ============================================
CREATE OR REPLACE FUNCTION notify_payment_received()
RETURNS TRIGGER AS $$
DECLARE
  v_client_id uuid;
  v_client_name text;
  v_rental_info text;
BEGIN
  -- Get client information from rental
  SELECT r.renter_id, p.full_name, e.name
  INTO v_client_id, v_client_name, v_rental_info
  FROM public.rentals r
  JOIN public.profiles p ON p.id = r.renter_id
  LEFT JOIN public.equipment e ON e.id = r.equipment_id
  WHERE r.id = NEW.rental_id;
  
  -- Notify the client
  IF v_client_id IS NOT NULL THEN
    PERFORM create_notification(
      v_client_id,
      'Paiement enregistré',
      'Votre paiement de ' || NEW.amount || ' FCFA a été enregistré avec succès.',
      'payment_received',
      'success',
      '/dashboard/my-invoices',
      'payment',
      NEW.id,
      jsonb_build_object(
        'payment_id', NEW.id,
        'amount', NEW.amount,
        'payment_method', NEW.payment_method,
        'rental_id', NEW.rental_id
      )
    );
  END IF;
  
  -- Notify accountants
  PERFORM create_notification(
    p.id,
    'Nouveau paiement',
    'Paiement de ' || NEW.amount || ' FCFA reçu de ' || COALESCE(v_client_name, 'client') || '.',
    'payment_received',
    'success',
    '/dashboard/invoices',
    'payment',
    NEW.id,
    jsonb_build_object(
      'payment_id', NEW.id,
      'amount', NEW.amount,
      'payment_method', NEW.payment_method,
      'client_name', v_client_name,
      'rental_id', NEW.rental_id
    )
  )
  FROM public.profiles p
  WHERE p.role IN ('accountant', 'admin', 'super_admin');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_payment_received ON public.payment_transactions;
CREATE TRIGGER trigger_notify_payment_received
  AFTER INSERT ON public.payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION notify_payment_received();

-- ============================================
-- TRIGGER 5: Rental Completed (for invoice)
-- ============================================
CREATE OR REPLACE FUNCTION notify_rental_completed()
RETURNS TRIGGER AS $$
DECLARE
  v_client_name text;
  v_equipment_name text;
BEGIN
  -- Only notify when status changes to completed
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'completed' THEN
    -- Get client and equipment names
    SELECT full_name INTO v_client_name FROM public.profiles WHERE id = NEW.renter_id;
    SELECT name INTO v_equipment_name FROM public.equipment WHERE id = NEW.equipment_id;
    
    -- Notify the client
    PERFORM create_notification(
      NEW.renter_id,
      'Service terminé',
      'Votre service pour ' || COALESCE(v_equipment_name, 'équipement') || ' est terminé. Facture disponible.',
      'rental_completed',
      'success',
      '/dashboard/my-invoices',
      'rental',
      NEW.id,
      jsonb_build_object(
        'rental_id', NEW.id,
        'equipment_name', v_equipment_name,
        'total_price', NEW.total_price
      )
    );
    
    -- Notify accountants for invoicing
    PERFORM create_notification(
      p.id,
      'Facture à générer',
      'Service terminé pour ' || COALESCE(v_client_name, 'client') || '. Facture à générer.',
      'invoice_generated',
      'info',
      '/dashboard/invoices',
      'rental',
      NEW.id,
      jsonb_build_object(
        'rental_id', NEW.id,
        'client_name', v_client_name,
        'equipment_name', v_equipment_name,
        'total_price', NEW.total_price
      )
    )
    FROM public.profiles p
    WHERE p.role IN ('accountant', 'admin', 'super_admin');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_rental_completed ON public.rentals;
CREATE TRIGGER trigger_notify_rental_completed
  AFTER UPDATE OF status ON public.rentals
  FOR EACH ROW
  EXECUTE FUNCTION notify_rental_completed();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_notification TO authenticated;
GRANT EXECUTE ON FUNCTION notify_rental_created TO authenticated;
GRANT EXECUTE ON FUNCTION notify_mission_assigned TO authenticated;
GRANT EXECUTE ON FUNCTION notify_mission_status_changed TO authenticated;
GRANT EXECUTE ON FUNCTION notify_payment_received TO authenticated;
GRANT EXECUTE ON FUNCTION notify_rental_completed TO authenticated;
