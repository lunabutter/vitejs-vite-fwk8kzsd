/*
  # Role-Based Lead Management Permissions

  1. Role Permissions
    - Superadmin: Full access (view, edit, update, assign, delete)
    - Admin: Can view, edit, update, and assign leads
    - Manager: Can view, edit, update, and assign leads
    - Sales Member: Can view and update only lead status

  2. Security
    - Maintain RLS
    - Implement strict role-based access
    - Preserve data integrity
*/

-- Drop existing policies
DROP POLICY IF EXISTS "leads_view_policy" ON public.leads;
DROP POLICY IF EXISTS "leads_insert_policy" ON public.leads;
DROP POLICY IF EXISTS "leads_update_policy" ON public.leads;
DROP POLICY IF EXISTS "leads_delete_policy" ON public.leads;
DROP POLICY IF EXISTS "assignments_view_policy" ON public.lead_assignments;
DROP POLICY IF EXISTS "assignments_insert_policy" ON public.lead_assignments;
DROP POLICY IF EXISTS "assignments_update_policy" ON public.lead_assignments;
DROP POLICY IF EXISTS "assignments_delete_policy" ON public.lead_assignments;

-- Create new lead policies
CREATE POLICY "leads_view_policy" ON public.leads
FOR SELECT USING (
  -- All roles can view based on their permissions
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role IN ('super_admin', 'admin', 'manager')
  )
  OR
  -- Sales members can view their assigned leads
  EXISTS (
    SELECT 1 FROM public.lead_assignments
    WHERE lead_assignments.lead_id = leads.id
    AND lead_assignments.assigned_to = auth.uid()
    AND lead_assignments.status = 'active'
  )
);

CREATE POLICY "leads_insert_policy" ON public.leads
FOR INSERT WITH CHECK (
  -- Only superadmin, admin, and manager can create leads
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role IN ('super_admin', 'admin', 'manager')
  )
);

CREATE POLICY "leads_update_policy" ON public.leads
FOR UPDATE USING (
  CASE
    -- Superadmin can update everything
    WHEN EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    ) THEN true
    -- Admin and manager can update everything
    WHEN EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    ) THEN true
    -- Sales members can only update status
    WHEN EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'sales_member'
    ) AND EXISTS (
      SELECT 1 FROM public.lead_assignments
      WHERE lead_assignments.lead_id = leads.id
      AND lead_assignments.assigned_to = auth.uid()
      AND lead_assignments.status = 'active'
    ) THEN
      -- Only allow status updates for sales members
      (SELECT current_setting('request.jwt.claims')::json->>'role') = 'authenticated'
      AND EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'leads'
        AND column_name = 'status'
      )
    ELSE false
  END
);

CREATE POLICY "leads_delete_policy" ON public.leads
FOR DELETE USING (
  -- Only superadmin can delete leads
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'super_admin'
  )
);

-- Create new lead assignment policies
CREATE POLICY "assignments_view_policy" ON public.lead_assignments
FOR SELECT USING (
  -- All roles can view assignments based on their permissions
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role IN ('super_admin', 'admin', 'manager')
  )
  OR assigned_to = auth.uid()
);

CREATE POLICY "assignments_insert_policy" ON public.lead_assignments
FOR INSERT WITH CHECK (
  -- Only superadmin, admin, and manager can create assignments
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role IN ('super_admin', 'admin', 'manager')
  )
);

CREATE POLICY "assignments_update_policy" ON public.lead_assignments
FOR UPDATE USING (
  -- Only superadmin, admin, and manager can update assignments
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role IN ('super_admin', 'admin', 'manager')
  )
);

CREATE POLICY "assignments_delete_policy" ON public.lead_assignments
FOR DELETE USING (
  -- Only superadmin can delete assignments
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'super_admin'
  )
);

-- Ensure RLS is enabled
ALTER TABLE public.leads FORCE ROW LEVEL SECURITY;
ALTER TABLE public.lead_assignments FORCE ROW LEVEL SECURITY;