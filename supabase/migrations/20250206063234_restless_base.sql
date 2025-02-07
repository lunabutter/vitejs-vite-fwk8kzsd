/*
  # Fix leads and lead assignments policies

  1. Changes
    - Add policies for leads table
    - Add policies for lead_assignments table
    - Enable proper lead management flow

  2. Security
    - Allow sales team to manage their leads
    - Enable admin access to all leads
    - Maintain proper access control
*/

-- Drop existing policies
DROP POLICY IF EXISTS "sales_team_leads_policy" ON public.leads;
DROP POLICY IF EXISTS "sales_team_assignments_policy" ON public.lead_assignments;

-- Create policies for leads table
CREATE POLICY "enable_lead_management" ON public.leads
FOR ALL USING (
  -- Allow access to admins and managers
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role IN ('super_admin', 'admin', 'manager')
  )
  OR
  -- Allow access to assigned sales members
  EXISTS (
    SELECT 1 FROM public.lead_assignments
    WHERE lead_assignments.lead_id = leads.id
    AND lead_assignments.assigned_to = auth.uid()
    AND lead_assignments.status = 'active'
  )
);

-- Create policies for lead_assignments table
CREATE POLICY "enable_assignment_management" ON public.lead_assignments
FOR ALL USING (
  -- Allow access to admins and managers
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role IN ('super_admin', 'admin', 'manager')
  )
  OR
  -- Allow sales members to view their assignments
  assigned_to = auth.uid()
);

-- Ensure RLS is enabled
ALTER TABLE public.leads FORCE ROW LEVEL SECURITY;
ALTER TABLE public.lead_assignments FORCE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON public.leads TO authenticated;
GRANT ALL ON public.lead_assignments TO authenticated;