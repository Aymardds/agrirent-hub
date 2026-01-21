-- Diagnostic script for profile access issues
-- Run this in Supabase SQL Editor

-- 1. Check if profile exists for the user
SELECT 
    id,
    email,
    full_name,
    role,
    phone,
    company,
    created_at
FROM public.profiles
WHERE id = '00c92d61-23be-4c53-bda0-6c2439e1f5bf';

-- 2. Check all RLS policies on profiles table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'profiles';

-- 3. Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'profiles';

-- 4. List all profiles (to see if any exist)
SELECT 
    id,
    email,
    full_name,
    role
FROM public.profiles
LIMIT 10;

-- 5. Check auth.users to see if the user exists there
SELECT 
    id,
    email,
    raw_user_meta_data,
    created_at,
    last_sign_in_at
FROM auth.users
WHERE id = '00c92d61-23be-4c53-bda0-6c2439e1f5bf';
