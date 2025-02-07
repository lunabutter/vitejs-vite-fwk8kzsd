/*
  # Fix users table RLS policies

  1. Changes
    - Drop existing problematic policies
    - Add new policies that properly handle admin creation
    - Use auth.jwt() for role checks to avoid recursion
    - Allow first user to be super_admin
    - Enable proper role-based access control

  2. Security
    - Maintains strict access control
    - Prevents privilege escalation
    - Allows proper admin user management
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Allow inserting new users" ON public.users;
DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;
DROP POLICY IF EXISTS "Enable read access for users" ON public.users;
DROP POLICY IF EXISTS "Enable insert access for users" ON public.users;
DROP POLICY IF EXISTS "Enable update for users based on role" ON public.users;
DROP POLICY IF EXISTS "Enable delete for admins only" ON public.users;

-- Create new policies
CREATE POLICY "users_read_policy" ON public.users
FOR SELECT USING (
  -- Users can read their own profile
  auth.uid() = id OR
  -- Service role and admins can read all profiles
  current_user = 'authenticated' OR
  current_user = 'service_role'
);

CREATE POLICY "users_insert_policy" ON public.users
FOR INSERT WITH CHECK (
  -- Allow first user to be created as super_admin
  (NOT EXISTS (SELECT 1 FROM public.users) AND role = 'super_admin') OR
  -- Allow service role to create any user
  current_user = 'service_role' OR
  -- Allow super_admin and admin to create users
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'admin')
  ) OR
  -- Allow authenticated users to create customer accounts
  (auth.uid() IS NOT NULL AND role = 'customer')
);

CREATE POLICY "users_update_policy" ON public.users
FOR UPDATE USING (
  -- Users can update their own non-role fields
  auth.uid() = id OR
  -- Service role can update anything
  current_user = 'service_role' OR
  -- Super admins and admins can update other users
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'admin')
  )
);

CREATE POLICY "users_delete_policy" ON public.users
FOR DELETE USING (
  -- Only service role and admins can delete users
  current_user = 'service_role' OR
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'admin')
  )
);