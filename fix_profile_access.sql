-- Fix profile access issues
-- This script ensures:
-- 1. Profile exists for authenticated users
-- 2. RLS policies allow users to read their own profile
-- 3. Network timeout issues are not caused by missing data

-- Step 1: Create profile if it doesn't exist for the current user
-- This uses a function that can be called from the frontend or manually

-- First, let's ensure the user has a profile
-- Replace '00c92d61-23be-4c53-bda0-6c2439e1f5bf' with your actual user ID if different
DO $$
DECLARE
    v_user_id uuid := '00c92d61-23be-4c53-bda0-6c2439e1f5bf';
    v_email text;
    v_profile_exists boolean;
BEGIN
    -- Check if profile exists
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = v_user_id) INTO v_profile_exists;
    
    IF NOT v_profile_exists THEN
        -- Get email from auth.users
        SELECT email INTO v_email FROM auth.users WHERE id = v_user_id;
        
        -- Create profile
        INSERT INTO public.profiles (id, email, full_name, role)
        VALUES (
            v_user_id,
            v_email,
            COALESCE(v_email, 'Super Admin'),
            'super_admin'
        );
        
        RAISE NOTICE 'Profile created for user %', v_user_id;
    ELSE
        RAISE NOTICE 'Profile already exists for user %', v_user_id;
    END IF;
END $$;

-- Step 2: Ensure RLS policies allow users to read their own profile
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.profiles;

-- Create policy for users to view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Create policy for users to update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Step 3: Ensure super_admin can view all profiles
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;

CREATE POLICY "Super admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role = 'super_admin'
    )
);

-- Step 4: Verify the profile was created/exists
SELECT 
    id,
    email,
    full_name,
    role,
    created_at
FROM public.profiles
WHERE id = '00c92d61-23be-4c53-bda0-6c2439e1f5bf';

-- Step 5: Test the query that the frontend is using
-- This simulates what the AuthContext is trying to do
SELECT *
FROM public.profiles
WHERE id = '00c92d61-23be-4c53-bda0-6c2439e1f5bf';
