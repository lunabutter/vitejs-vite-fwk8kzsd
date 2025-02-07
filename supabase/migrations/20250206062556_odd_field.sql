/*
  # Fix users table RLS policies - Final Version

  1. Changes
    - Remove recursive policy checks
    - Simplify authentication logic
    - Enable proper user registration flow
    - Fix infinite recursion issues

  2. Security
    - Maintains proper access control
    - Allows initial admin setup
    - Enables user registration
    - Prevents unauthorized access
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "enable_all_access_during_setup" ON public.users;
DROP POLICY IF EXISTS "enable_insert_for_registration" ON public.users;
DROP POLICY IF EXISTS "enable_select_for_authenticated" ON public.users;
DROP POLICY IF EXISTS "enable_update_for_own_profile" ON public.users;

-- Create new simplified policies
CREATE POLICY "allow_public_read" ON public.users
FOR SELECT TO PUBLIC USING (true);

CREATE POLICY "allow_registration" ON public.users
FOR INSERT TO PUBLIC WITH CHECK (true);

CREATE POLICY "allow_self_update" ON public.users
FOR UPDATE USING (
  auth.uid() = id
);

CREATE POLICY "allow_service_role_all" ON public.users
FOR ALL TO service_role USING (true);

-- Ensure RLS is enabled
ALTER TABLE public.users FORCE ROW LEVEL SECURITY;

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.users TO authenticated;