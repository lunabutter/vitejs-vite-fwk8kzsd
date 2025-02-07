import React, { useState, useEffect } from 'react';
import { DollarSign, ShoppingBag, Users, TrendingUp, ArrowUp, ArrowDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import AnalyticsChart from '../../components/admin/AnalyticsChart';

interface Stats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  averageOrderValue: number;
  revenueGrowth: number;
  ordersGrowth: number;
  customersGrowth: number;
  aovGrowth: number;
}

interface RevenueData {
  date: string;
  amount: number;
}

export default function AnalyticsAdmin() {
  const [stats, setStats] = useState<Stats>({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    averageOrderValue: 0,
    revenueGrowth: 0,
    ordersGrowth: 0,
    customersGrowth: 0,
    aovGrowth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    fetchAnalytics();
  }, [timeframe]);

  async function fetchAnalytics() {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - (timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90));

      // Fetch orders for the selected timeframe
      const { data: currentOrders, error: ordersError } = await supabase
        .from('orders')
        .select('total_amount, created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: true });

      if (ordersError) throw ordersError;

      // Fetch orders for the previous period
      const previousStartDate = new Date(startDate);
      previousStartDate.setDate(previousStartDate.getDate() - (timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90));
      const { data: previousOrders } = await supabase
        .from('orders')
        .select('total_amount, created_at')
        .gte('created_at', previousStartDate.toISOString())
        .lt('created_at', startDate.toISOString());

      // Fetch total customers
      const { count: customersCount, error: customersError } = await supabase
        .from('users')
        .select('id', { count: 'exact' })
        .eq('role', 'customer');

      if (customersError) throw customersError;

      // Calculate current period stats
      const currentRevenue = currentOrders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
      const currentOrderCount = currentOrders?.length || 0;
      const currentAOV = currentOrderCount > 0 ? currentRevenue / currentOrderCount : 0;

      // Calculate previous period stats
      const previousRevenue = previousOrders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
      const previousOrderCount = previousOrders?.length || 0;
      const previousAOV = previousOrderCount > 0 ? previousRevenue / previousOrderCount : 0;

      // Calculate growth rates
      const revenueGrowth = previousRevenue === 0 ? 100 : ((currentRevenue - previousRevenue) / previousRevenue) * 100;
      const ordersGrowth = previousOrderCount === 0 ? 100 : ((currentOrderCount - previousOrderCount) / previousOrderCount) * 100;
      const aovGrowth = previousAOV === 0 ? 100 : ((currentAOV - previousAOV) / previousAOV) * 100;

      // Prepare daily revenue data
      const dailyRevenue = currentOrders?.reduce((acc: { [key: string]: number }, order) => {
        const date = new Date(order.created_at).toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + Number(order.total_amount);
        return acc;
      }, {});

      const revenueDataPoints = Object.entries(dailyRevenue || {})
        .map(([date, amount]) => ({ date, amount }))
        .sort((a, b) => a.date.localeCompare(b.date));

      setStats({
        totalRevenue: currentRevenue,
        totalOrders: currentOrderCount,
        totalCustomers: customersCount || 0,
        averageOrderValue: currentAOV,
        revenueGrowth,
        ordersGrowth,
        customersGrowth: 15, // Placeholder - implement actual calculation
        aovGrowth,
      });

      setRevenueData(revenueDataPoints);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }

  const StatCard = ({ title, value, growth, icon: Icon }: {
    title: string;
    value: string | number;
    growth: number;
    icon: React.ElementType;
  }) => (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Icon className="h-6 w-6 text-gray-400" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {title}
              </dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">
                  {value}
                </div>
                <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                  growth >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {growth >= 0 ? (
                    <ArrowUp className="h-4 w-4 flex-shrink-0" />
                  ) : (
                    <ArrowDown className="h-4 w-4 flex-shrink-0" />
                  )}
                  <span className="sr-only">{growth >= 0 ? 'Increased' : 'Decreased'} by</span>
                  {Math.abs(growth).toFixed(1)}%
                </div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Analytics Dashboard</h1>
          <p className="mt-2 text-sm text-gray-700">
            Key metrics and performance indicators for your business.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <div className="flex space-x-2">
            {(['7d', '30d', '90d'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setTimeframe(period)}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  timeframe === period
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                } border border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
              >
                {period === '7d' ? 'Week' : period === '30d' ? 'Month' : '3 Months'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(stats.totalRevenue)}
          growth={stats.revenueGrowth}
          icon={DollarSign}
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders}
          growth={stats.ordersGrowth}
          icon={ShoppingBag}
        />
        <StatCard
          title="Total Customers"
          value={stats.totalCustomers}
          growth={stats.customersGrowth}
          icon={Users}
        />
        <StatCard
          title="Average Order Value"
          value={new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(stats.averageOrderValue)}
          growth={stats.aovGrowth}
          icon={TrendingUp}
        />
      </div>

      {/* Revenue Chart */}
      <div className="mt-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
            Revenue Over Time
          </h3>
          <div className="h-96">
            <AnalyticsChart
              data={revenueData}
              title="Revenue"
              color="#3B82F6"
            />
          </div>
        </div>
      </div>
    </div>
  );
}