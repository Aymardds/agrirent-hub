-- Enhancement of notifications table schema
-- Adds event types, metadata, and action URLs for better notification management

-- Add new columns to notifications table
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS event_type text CHECK (event_type IN (
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
)) NOT NULL DEFAULT 'info',
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS action_url text,
ADD COLUMN IF NOT EXISTS related_entity_type text CHECK (related_entity_type IN ('rental', 'intervention', 'payment', 'invoice')),
ADD COLUMN IF NOT EXISTS related_entity_id uuid;

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
