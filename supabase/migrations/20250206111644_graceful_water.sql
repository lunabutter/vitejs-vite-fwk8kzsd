-- Update lead management permissions
/*
  # Enhanced Lead Management Permissions

  1. Changes
    - Allow superadmin and admin to manage all leads and assignments
    - Allow managers to manage leads and assignments for their team
    - Allow sales members to view and update their assigned leads
    - Maintain existing functionality while adding new capabilities

  2. Security
    - Maintain RLS for all tables
    - Add granular policies for different roles
    - Preserve data integrity
*/

-- Drop existing policies for leads and lead_assignments
DROP POLICY IF EXISTS "enable_lead_management" ON public.leads;
DROP POLICY IF EXISTS "enable_assignment_management" ON public.lead_assignments;

-- Create new policies for leads table
CREATE POLICY "leads_view_policy" ON public.leads
FOR SELECT USING (
  -- Allow superadmin, admin, and manager to view all leads
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role IN ('super_admin', 'admin', 'manager')
  )
  OR
  -- Allow sales members to view their assigned leads
  EXISTS (
    SELECT 1 FROM public.lead_assignments
    WHERE lead_assignments.lead_id = leads.id
    AND lead_assignments.assigned_to = auth.uid()
    AND lead_assignments.status = 'active'
  )
);

CREATE POLICY "leads_insert_policy" ON public.leads
FOR INSERT WITH CHECK (
  -- Allow superadmin, admin, and manager to create leads
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role IN ('super_admin', 'admin', 'manager')
  )
);

CREATE POLICY "leads_update_policy" ON public.leads
FOR UPDATE USING (
  -- Allow superadmin, admin, and manager to update any lead
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role IN ('super_admin', 'admin', 'manager')
  )
  OR
  -- Allow sales members to update their assigned leads
  EXISTS (
    SELECT 1 FROM public.lead_assignments
    WHERE lead_assignments.lead_id = leads.id
    AND lead_assignments.assigned_to = auth.uid()
    AND lead_assignments.status = 'active'
  )
);

CREATE POLICY "leads_delete_policy" ON public.leads
FOR DELETE USING (
  -- Only superadmin and admin can delete leads
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role IN ('super_admin', 'admin')
  )
);

-- Create new policies for lead_assignments table
CREATE POLICY "assignments_view_policy" ON public.lead_assignments
FOR SELECT USING (
  -- Allow superadmin, admin, and manager to view all assignments
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role IN ('super_admin', 'admin', 'manager')
  )
  OR
  -- Allow sales members to view their own assignments
  assigned_to = auth.uid()
);

CREATE POLICY "assignments_insert_policy" ON public.lead_assignments
FOR INSERT WITH CHECK (
  -- Allow superadmin and admin to assign to anyone
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role IN ('super_admin', 'admin')
  )
  OR
  -- Allow managers to assign only to sales members
  (
    EXISTS (
      SELECT 1 FROM public.users assignee
      WHERE assignee.id = lead_assignments.assigned_to
      AND assignee.role = 'sales_member'
    )
    AND
    EXISTS (
      SELECT 1 FROM public.users assigner
      WHERE assigner.id = auth.uid()
      AND assigner.role = 'manager'
    )
  )
);

CREATE POLICY "assignments_update_policy" ON public.lead_assignments
FOR UPDATE USING (
  -- Allow superadmin and admin to update any assignment
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role IN ('super_admin', 'admin')
  )
  OR
  -- Allow managers to update assignments for sales members
  (
    EXISTS (
      SELECT 1 FROM public.users assignee
      WHERE assignee.id = lead_assignments.assigned_to
      AND assignee.role = 'sales_member'
    )
    AND
    EXISTS (
      SELECT 1 FROM public.users assigner
      WHERE assigner.id = auth.uid()
      AND assigner.role = 'manager'
    )
  )
);

CREATE POLICY "assignments_delete_policy" ON public.lead_assignments
FOR DELETE USING (
  -- Only superadmin and admin can delete assignments
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role IN ('super_admin', 'admin')
  )
);

-- Ensure RLS is enabled
ALTER TABLE public.leads FORCE ROW LEVEL SECURITY;
ALTER TABLE public.lead_assignments FORCE ROW LEVEL SECURITY;