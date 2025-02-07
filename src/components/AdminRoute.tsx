import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

type AllowedRoles = 'super_admin' | 'admin' | 'manager' | 'sales_member';

interface AdminRouteProps {
  children: React.ReactNode;
  allowedRoles?: AllowedRoles[];
}

export default function AdminRoute({ children, allowedRoles }: AdminRouteProps) {
  const { user } = useAuth();
  const location = useLocation();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsAuthorized(false);
      setLoading(false);
      return;
    }

    async function checkAuthorization() {
      try {
        const { data: profile, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        const hasAccess = allowedRoles 
          ? allowedRoles.includes(profile?.role as AllowedRoles)
          : ['super_admin', 'admin', 'manager', 'sales_member'].includes(profile?.role);

        setIsAuthorized(hasAccess);
      } catch (error) {
        console.error('Error checking authorization:', error);
        setIsAuthorized(false);
      } finally {
        setLoading(false);
      }
    }

    checkAuthorization();
  }, [user, allowedRoles]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
      </div>
    );
  }

  if (!isAuthorized) {
    // Redirect to the appropriate login page based on the current URL
    const role = location.pathname.split('/')[2] || 'admin';
    return <Navigate to={`/admin/${role}/login`} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}