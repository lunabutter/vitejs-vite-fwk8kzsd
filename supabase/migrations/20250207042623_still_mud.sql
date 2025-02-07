/*
  # Categories Table RLS Policies
  
  1. Security
    - Enable RLS on categories table
    - Add policies for CRUD operations
    - Grant appropriate permissions based on user roles
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "categories_select_policy" ON public.categories;
DROP POLICY IF EXISTS "categories_insert_policy" ON public.categories;
DROP POLICY IF EXISTS "categories_update_policy" ON public.categories;
DROP POLICY IF EXISTS "categories_delete_policy" ON public.categories;

-- Create new policies
CREATE POLICY "categories_select_policy" ON public.categories
FOR SELECT USING (true);  -- Anyone can view categories

CREATE POLICY "categories_insert_policy" ON public.categories
FOR INSERT WITH CHECK (
  -- Only super_admin, admin, and manager can create categories
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role IN ('super_admin', 'admin', 'manager')
  )
);

CREATE POLICY "categories_update_policy" ON public.categories
FOR UPDATE USING (
  -- Only super_admin, admin, and manager can update categories
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role IN ('super_admin', 'admin', 'manager')
  )
);

CREATE POLICY "categories_delete_policy" ON public.categories
FOR DELETE USING (
  -- Only super_admin and admin can delete categories
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role IN ('super_admin', 'admin')
  )
);

-- Ensure RLS is enabled
ALTER TABLE public.categories FORCE ROW LEVEL SECURITY;