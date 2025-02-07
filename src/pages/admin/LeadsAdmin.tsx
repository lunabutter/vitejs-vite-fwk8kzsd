import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, UserPlus, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/supabase';
import { useAuth } from '../../contexts/AuthContext';
import LeadModal from '../../components/admin/LeadModal';

type Lead = Database['public']['Tables']['leads']['Row'];
type User = Database['public']['Tables']['users']['Row'];

const LEAD_STATUS = {
  new: { label: 'New', icon: Clock, className: 'bg-blue-100 text-blue-800' },
  contacted: { label: 'Contacted', icon: Clock, className: 'bg-yellow-100 text-yellow-800' },
  qualified: { label: 'Qualified', icon: CheckCircle, className: 'bg-green-100 text-green-800' },
  lost: { label: 'Lost', icon: XCircle, className: 'bg-red-100 text-red-800' },
  converted: { label: 'Converted', icon: CheckCircle, className: 'bg-purple-100 text-purple-800' },
};

export default function LeadsAdmin() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | undefined>();

  useEffect(() => {
    if (user) {
      fetchUserRole();
      fetchLeads();
      fetchTeamMembers();
    }
  }, [user]);

  async function fetchUserRole() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setUserRole(data.role);
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  }

  async function fetchTeamMembers() {
    try {
      let query = supabase
        .from('users')
        .select('*')
        .order('first_name', { ascending: true });

      // Filter team members based on user role
      if (userRole === 'super_admin' || userRole === 'admin') {
        query = query.in('role', ['manager', 'sales_member']);
      } else if (userRole === 'manager') {
        query = query.eq('role', 'sales_member');
      }

      const { data, error } = await query;
      if (error) throw error;
      setTeamMembers(data || []);
    } catch (error) {
      console.error('Error fetching team members:', error);
      toast.error('Failed to load team members');
    }
  }

  async function fetchLeads() {
    try {
      let query = supabase
        .from('leads')
        .select(`
          *,
          lead_assignments!inner (
            assigned_to,
            users!lead_assignments_assigned_to_fkey (
              id,
              first_name,
              last_name,
              email,
              role
            )
          )
        `)
        .order('created_at', { ascending: false });

      // If sales member, only show assigned leads
      if (userRole === 'sales_member') {
        query = query.eq('lead_assignments.assigned_to', user?.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast.error('Failed to load leads');
    } finally {
      setLoading(false);
    }
  }

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', leadId);

      if (error) throw error;
      
      setLeads(leads.map(lead => 
        lead.id === leadId ? { ...lead, status: newStatus } : lead
      ));
      
      toast.success('Lead status updated successfully');
    } catch (error) {
      console.error('Error updating lead status:', error);
      toast.error('Failed to update lead status');
    }
  };

  const handleAssignmentChange = async (leadId: string, newAssigneeId: string) => {
    try {
      // Update the lead assignment
      const { error: assignmentError } = await supabase
        .from('lead_assignments')
        .update({
          assigned_to: newAssigneeId,
          updated_at: new Date().toISOString(),
        })
        .eq('lead_id', leadId);

      if (assignmentError) throw assignmentError;

      // Refresh leads to get updated assignments
      await fetchLeads();
      
      toast.success('Lead assignment updated successfully');
    } catch (error) {
      console.error('Error updating lead assignment:', error);
      toast.error('Failed to update lead assignment');
    }
  };

  const handleEdit = (lead: Lead) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedLead(undefined);
  };

  const handleModalSuccess = () => {
    fetchLeads();
  };

  const canEditLead = (lead: Lead) => {
    return ['super_admin', 'admin', 'manager'].includes(userRole || '');
  };

  const canAssignLead = (lead: Lead) => {
    return ['super_admin', 'admin', 'manager'].includes(userRole || '');
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      `${lead.first_name} ${lead.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Leads Management</h1>
          <p className="mt-2 text-sm text-gray-700">
            Track and manage your sales leads.
          </p>
        </div>
        {['super_admin', 'admin', 'manager'].includes(userRole || '') && (
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Lead
            </button>
          </div>
        )}
      </div>

      <div className="mt-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="max-w-xs relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Search leads..."
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="all">All Status</option>
              {Object.entries(LEAD_STATUS).map(([value, { label }]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-8 flex flex-col">
          <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                        Contact
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Company
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Status
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Assigned To
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Created
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="text-center py-4">
                          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
                        </td>
                      </tr>
                    ) : (
                      filteredLeads.map((lead) => {
                        const StatusIcon = LEAD_STATUS[lead.status as keyof typeof LEAD_STATUS]?.icon || Clock;
                        const statusClass = LEAD_STATUS[lead.status as keyof typeof LEAD_STATUS]?.className || 'bg-gray-100 text-gray-800';
                        const assignedUser = lead.lead_assignments?.[0]?.users;
                        
                        return (
                          <tr key={lead.id}>
                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                              <div className="flex items-center">
                                <div className="h-10 w-10 flex-shrink-0">
                                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                    <span className="text-lg font-medium text-gray-600">
                                      {lead.first_name[0]}{lead.last_name[0]}
                                    </span>
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <div className="font-medium text-gray-900">
                                    {lead.first_name} {lead.last_name}
                                  </div>
                                  <div className="text-gray-500">{lead.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {lead.company || '-'}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm">
                              <select
                                value={lead.status}
                                onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass}`}
                              >
                                {Object.entries(LEAD_STATUS).map(([value, { label }]) => (
                                  <option key={value} value={value}>{label}</option>
                                ))}
                              </select>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {canAssignLead(lead) ? (
                                <select
                                  value={assignedUser?.id || ''}
                                  onChange={(e) => handleAssignmentChange(lead.id, e.target.value)}
                                  className="mt-1 block w-full rounded-md border-gray-300 py-1.5 text-base leading-5 font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                >
                                  <option value="">Select assignee</option>
                                  {teamMembers.map((member) => (
                                    <option key={member.id} value={member.id}>
                                      {member.first_name} {member.last_name} ({member.role === 'sales_member' ? 'Sales' : 'Manager'})
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span>{assignedUser ? `${assignedUser.first_name} ${assignedUser.last_name}` : '-'}</span>
                              )}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {new Date(lead.created_at).toLocaleDateString()}
                            </td>
                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                              {canEditLead(lead) && (
                                <button
                                  onClick={() => handleEdit(lead)}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <LeadModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        lead={selectedLead}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}