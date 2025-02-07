import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Package, Users, ShoppingBag, BarChart2, Settings, FolderTree, UserPlus, Briefcase } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import ProductsAdmin from './ProductsAdmin';
import OrdersAdmin from './OrdersAdmin';
import CustomersAdmin from './CustomersAdmin';
import AnalyticsAdmin from './AnalyticsAdmin';
import SettingsAdmin from './SettingsAdmin';
import CategoriesAdmin from './CategoriesAdmin';
import TeamAdmin from './TeamAdmin';
import LeadsAdmin from './LeadsAdmin';

type UserRole = 'super_admin' | 'admin' | 'manager' | 'sales_member';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  allowedRoles: UserRole[];
}

const navigation: NavItem[] = [
  { name: 'Products', href: '/admin/products', icon: Package, allowedRoles: ['super_admin', 'admin', 'manager'] },
  { name: 'Categories', href: '/admin/categories', icon: FolderTree, allowedRoles: ['super_admin', 'admin', 'manager'] },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingBag, allowedRoles: ['super_admin', 'admin'] },
  { name: 'Customers', href: '/admin/customers', icon: Users, allowedRoles: ['super_admin', 'admin'] },
  { name: 'Team', href: '/admin/team', icon: UserPlus, allowedRoles: ['super_admin', 'admin', 'manager'] },
  { name: 'Leads', href: '/admin/leads', icon: Briefcase, allowedRoles: ['super_admin', 'admin', 'manager', 'sales_member'] },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart2, allowedRoles: ['super_admin', 'admin'] },
  { name: 'Settings', href: '/admin/settings', icon: Settings, allowedRoles: ['super_admin', 'admin'] },
];

export default function Dashboard() {
  const location = useLocation();
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getUserRole() {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setUserRole(data.role as UserRole);
      } catch (error) {
        console.error('Error fetching user role:', error);
      } finally {
        setLoading(false);
      }
    }

    getUserRole();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
      </div>
    );
  }

  const filteredNavigation = navigation.filter(item => 
    userRole && item.allowedRoles.includes(userRole)
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        {/* Sidebar */}
        <div className="hidden md:flex md:w-64 md:flex-col">
          <div className="flex flex-col flex-grow pt-5 bg-white overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="mt-5 flex-grow flex flex-col">
              <nav className="flex-1 px-2 pb-4 space-y-1">
                {filteredNavigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                        isActive
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <item.icon
                        className={`mr-3 h-5 w-5 ${
                          isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
                        }`}
                      />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1">
          <main className="flex-1 pb-8">
            <Routes>
              {userRole && (
                <>
                  {['super_admin', 'admin', 'manager'].includes(userRole) && (
                    <>
                      <Route path="/products" element={<ProductsAdmin />} />
                      <Route path="/categories" element={<CategoriesAdmin />} />
                    </>
                  )}
                  {['super_admin', 'admin'].includes(userRole) && (
                    <>
                      <Route path="/orders" element={<OrdersAdmin />} />
                      <Route path="/customers" element={<CustomersAdmin />} />
                      <Route path="/analytics" element={<AnalyticsAdmin />} />
                      <Route path="/settings" element={<SettingsAdmin />} />
                    </>
                  )}
                  {['super_admin', 'admin', 'manager'].includes(userRole) && (
                    <Route path="/team" element={<TeamAdmin />} />
                  )}
                  <Route path="/leads" element={<LeadsAdmin />} />
                  <Route path="/" element={<Navigate to={filteredNavigation[0]?.href || '/admin/leads'} replace />} />
                </>
              )}
            </Routes>
          </main>
        </div>
      </div>
    </div>
  );
}