import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/supabase';
import { useAuth } from '../../contexts/AuthContext';

type Lead = Database['public']['Tables']['leads']['Row'];
type User = Database['public']['Tables']['users']['Row'];

const leadSchema = z.object({
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  last_name: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters').optional().nullable(),
  company: z.string().optional().nullable(),
  interest: z.string().min(5, 'Interest must be at least 5 characters'),
  notes: z.string().optional().nullable(),
  assigned_to: z.string().uuid('Invalid user ID'),
});

type LeadFormData = z.infer<typeof leadSchema>;

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead?: Lead;
  onSuccess: () => void;
}

export default function LeadModal({ isOpen, onClose, lead, onSuccess }: LeadModalProps) {
  const { user } = useAuth();
  const [salesTeam, setSalesTeam] = useState<User[]>([]);
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: lead || {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      company: '',
      interest: '',
      notes: '',
      assigned_to: '',
    },
  });

  useEffect(() => {
    fetchSalesTeam();
  }, []);

  async function fetchSalesTeam() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'sales_member')
        .order('first_name', { ascending: true });

      if (error) throw error;
      setSalesTeam(data || []);
    } catch (error) {
      console.error('Error fetching sales team:', error);
      toast.error('Failed to load sales team members');
    }
  }

  const onSubmit = async (data: LeadFormData) => {
    try {
      if (lead) {
        // Update existing lead
        const { error: leadError } = await supabase
          .from('leads')
          .update({
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email,
            phone: data.phone,
            company: data.company,
            interest: data.interest,
            notes: data.notes,
            updated_at: new Date().toISOString(),
          })
          .eq('id', lead.id);

        if (leadError) throw leadError;

        // Update lead assignment
        const { error: assignmentError } = await supabase
          .from('lead_assignments')
          .update({
            assigned_to: data.assigned_to,
            updated_at: new Date().toISOString(),
          })
          .eq('lead_id', lead.id);

        if (assignmentError) throw assignmentError;

        toast.success('Lead updated successfully');
      } else {
        // Create new lead
        const { data: newLead, error: leadError } = await supabase
          .from('leads')
          .insert([{
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email,
            phone: data.phone,
            company: data.company,
            interest: data.interest,
            notes: data.notes,
            status: 'new',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }])
          .select()
          .single();

        if (leadError) throw leadError;

        // Create lead assignment
        const { error: assignmentError } = await supabase
          .from('lead_assignments')
          .insert([{
            lead_id: newLead.id,
            assigned_to: data.assigned_to,
            assigned_by: user?.id,
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }]);

        if (assignmentError) throw assignmentError;

        toast.success('Lead created successfully');
      }

      onSuccess();
      onClose();
      reset();
    } catch (error) {
      console.error('Error saving lead:', error);
      toast.error('Failed to save lead');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
              <div className="flex items-start justify-between">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  {lead ? 'Edit Lead' : 'Add New Lead'}
                </h3>
                <button
                  type="button"
                  className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                  onClick={onClose}
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                    First Name
                  </label>
                  <input
                    type="text"
                    {...register('first_name')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  {errors.first_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.first_name.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                    Last Name
                  </label>
                  <input
                    type="text"
                    {...register('last_name')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  {errors.last_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.last_name.message}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    {...register('email')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone
                  </label>
                  <input
                    type="tel"
                    {...register('phone')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                    Company
                  </label>
                  <input
                    type="text"
                    {...register('company')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  {errors.company && (
                    <p className="mt-1 text-sm text-red-600">{errors.company.message}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="interest" className="block text-sm font-medium text-gray-700">
                    Interest
                  </label>
                  <input
                    type="text"
                    {...register('interest')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  {errors.interest && (
                    <p className="mt-1 text-sm text-red-600">{errors.interest.message}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                    Notes
                  </label>
                  <textarea
                    {...register('notes')}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  {errors.notes && (
                    <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="assigned_to" className="block text-sm font-medium text-gray-700">
                    Assign To
                  </label>
                  <select
                    {...register('assigned_to')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Select a sales member</option>
                    {salesTeam.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.first_name} {member.last_name}
                      </option>
                    ))}
                  </select>
                  {errors.assigned_to && (
                    <p className="mt-1 text-sm text-red-600">{errors.assigned_to.message}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Saving...' : lead ? 'Update Lead' : 'Create Lead'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}