-- Add scheduling fields to interventions
ALTER TABLE public.interventions 
ADD COLUMN IF NOT EXISTS scheduled_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS end_date timestamp with time zone;

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) not null,
  title text not null,
  message text not null,
  read boolean default false,
  type text default 'info', -- info, success, warning, error
  link text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: System/Admins can insert notifications (simplified for now, anyone can insert for logic triggers)
CREATE POLICY "Anyone can insert notifications" 
ON public.notifications FOR INSERT 
WITH CHECK (true);
