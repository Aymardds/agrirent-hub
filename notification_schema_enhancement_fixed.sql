-- Enhancement of notifications table schema (FIXED VERSION)
-- Handles existing data before adding constraints

-- Step 1: Add new columns WITHOUT constraints first
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS event_type text,
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS action_url text,
ADD COLUMN IF NOT EXISTS related_entity_type text,
ADD COLUMN IF NOT EXISTS related_entity_id uuid;

-- Step 2: Update existing rows to have valid event_type values
-- Set a default value for existing notifications based on their 'type' field
UPDATE public.notifications 
SET event_type = CASE 
  WHEN type = 'success' THEN 'rental_completed'
  WHEN type = 'warning' THEN 'payment_pending'
  WHEN type = 'error' THEN 'mission_cancelled'
  ELSE 'rental_created'
END
WHERE event_type IS NULL;

-- Step 3: Now add the constraints
ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_event_type_check 
CHECK (event_type IN (
  'rental_created',
  'rental_updated', 
  'rental_completed',
  'mission_assigned',
  'mission_started',
  'mission_completed',
  'mission_cancelled',
  'payment_received',
  'payment_pending',
  'invoice_generated'
));

ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_related_entity_type_check 
CHECK (related_entity_type IN ('rental', 'intervention', 'payment', 'invoice') OR related_entity_type IS NULL);

-- Step 4: Set NOT NULL constraint on event_type
ALTER TABLE public.notifications 
ALTER COLUMN event_type SET NOT NULL;

-- Step 5: Set default value for new rows
ALTER TABLE public.notifications 
ALTER COLUMN event_type SET DEFAULT 'rental_created';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_event_type ON public.notifications(event_type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_related_entity ON public.notifications(related_entity_type, related_entity_id);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, read, created_at DESC);

-- Add policy for users to update their own notifications (mark as read)
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" 
ON public.notifications FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add policy for users to delete their own notifications
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
CREATE POLICY "Users can delete their own notifications" 
ON public.notifications FOR DELETE 
USING (auth.uid() = user_id);

-- Comment on new columns
COMMENT ON COLUMN public.notifications.event_type IS 'Type of event that triggered the notification';
COMMENT ON COLUMN public.notifications.metadata IS 'Additional contextual data about the notification (JSON)';
COMMENT ON COLUMN public.notifications.action_url IS 'URL to redirect user when clicking the notification';
COMMENT ON COLUMN public.notifications.related_entity_type IS 'Type of entity related to this notification';
COMMENT ON COLUMN public.notifications.related_entity_id IS 'ID of the related entity';
