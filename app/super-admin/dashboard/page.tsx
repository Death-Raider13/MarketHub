'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProtectedRoute } from '@/lib/firebase/protected-route';
import { AdminHeader } from '@/components/admin/admin-header';
import { SuperAdminSidebar } from '@/components/super-admin/super-admin-sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  DollarSign,
  TrendingUp,
  Store,
  Package,
  Users,
  ShoppingCart,
  Shield,
  Activity,
  Database,
  LayoutDashboard,
  BarChart3,
  FileText,
  Settings,
  Percent,
  UserCog,
} from 'lucide-react';
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

function SuperAdminDashboardContent() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({
    totalRevenue: 0,
    revenueGrowth: 18.2,
    activeVendors: 0,
    pendingVendors: 0,
    totalProducts: 0,
    pendingProducts: 0,
    totalUsers: 0,
    userGrowth: 24.5,
    totalAdmins: 0,
    platformCommission: 15,
    databaseSize: '2.4 GB',
    systemUptime: '99.98%',
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load vendors
      const vendorsSnapshot = await getDocs(collection(db, 'vendors'));
      const vendors = vendorsSnapshot.docs.map(doc => doc.data());
      const activeVendors = vendors.filter(v => v.verified).length;
      const pendingVendors = vendors.filter(v => !v.verified).length;

      // Load products
      const productsSnapshot = await getDocs(collection(db, 'products'));
      const products = productsSnapshot.docs.map(doc => doc.data());
      const totalProducts = products.length;
      const pendingProducts = products.filter(p => p.status === 'pending').length;

      // Load users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const totalUsers = usersSnapshot.size;

      // Load admins
      const adminsQuery = query(
        collection(db, 'users'),
        where('role', 'in', ['admin', 'super_admin', 'moderator', 'support'])
      );
      const adminsSnapshot = await getDocs(adminsQuery);
      const totalAdmins = adminsSnapshot.size;

      // Load orders
      const ordersSnapshot = await getDocs(collection(db, 'orders'));
      const orders = ordersSnapshot.docs.map(doc => doc.data());
      const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);

      setStats(prev => ({
        ...prev,
        totalRevenue,
        activeVendors,
        pendingVendors,
        totalProducts,
        pendingProducts,
        totalUsers,
        totalAdmins,
      }));
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const revenueData = [
    { month: 'Jan', revenue: 12400 },
    { month: 'Feb', revenue: 15800 },
    { month: 'Mar', revenue: 18200 },
    { month: 'Apr', revenue: 21500 },
    { month: 'May', revenue: 19800 },
    { month: 'Jun', revenue: 24300 },
  ];

  const ordersData = [
    { day: 'Mon', orders: 45 },
    { day: 'Tue', orders: 52 },
    { day: 'Wed', orders: 48 },
    { day: 'Thu', orders: 61 },
    { day: 'Fri', orders: 55 },
    { day: 'Sat', orders: 67 },
    { day: 'Sun', orders: 43 },
  ];

  return (
    <div className="flex h-screen flex-col">
      <AdminHeader />
      
      <div className="flex flex-1 overflow-hidden">
        <SuperAdminSidebar />
        
        <main className="flex-1 overflow-y-auto bg-muted/30 p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Shield className="h-8 w-8 text-primary" />
                Super Admin Dashboard
              </h1>
              <p className="text-muted-foreground">Complete platform oversight and control</p>
            </div>
            <Badge variant="default" className="text-lg px-4 py-2">
              Super Admin
            </Badge>
          </div>
        </div>

        {/* Enhanced Stats Grid - 8 cards for Super Admin */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">₦{stats.totalRevenue.toLocaleString()}</p>
                  <p className="mt-1 flex items-center text-xs text-green-600">
                    <TrendingUp className="mr-1 h-3 w-3" />
                    {stats.revenueGrowth}% from last month
                  </p>
                </div>
                <div className="rounded-full bg-green-500/10 p-3">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Vendors</p>
                  <p className="text-2xl font-bold">{stats.activeVendors}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {stats.pendingVendors} pending approval
                  </p>
                </div>
                <div className="rounded-full bg-blue-500/10 p-3">
                  <Store className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Products</p>
                  <p className="text-2xl font-bold">{stats.totalProducts}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {stats.pendingProducts} pending review
                  </p>
                </div>
                <div className="rounded-full bg-purple-500/10 p-3">
                  <Package className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                  <p className="mt-1 flex items-center text-xs text-green-600">
                    <TrendingUp className="mr-1 h-3 w-3" />
                    {stats.userGrowth}% growth
                  </p>
                </div>
                <div className="rounded-full bg-orange-500/10 p-3">
                  <Users className="h-5 w-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Super Admin Exclusive Stats */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Admins</p>
                  <p className="text-2xl font-bold">{stats.totalAdmins}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Platform administrators</p>
                </div>
                <div className="rounded-full bg-indigo-500/10 p-3">
                  <Shield className="h-5 w-5 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Platform Commission</p>
                  <p className="text-2xl font-bold">{stats.platformCommission}%</p>
                  <Link href="/super-admin/settings">
                    <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                      Update Rate
                    </Button>
                  </Link>
                </div>
                <div className="rounded-full bg-green-500/10 p-3">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Database Size</p>
                  <p className="text-2xl font-bold">{stats.databaseSize}</p>
                  <Link href="/super-admin/system">
                    <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                      Backup Now
                    </Button>
                  </Link>
                </div>
                <div className="rounded-full bg-purple-500/10 p-3">
                  <Database className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">System Uptime</p>
                  <p className="text-2xl font-bold">{stats.systemUptime}</p>
                  <p className="mt-1 text-xs text-green-600">All systems operational</p>
                </div>
                <div className="rounded-full bg-green-500/10 p-3">
                  <Activity className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
              <CardDescription>Monthly revenue over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Orders This Week</CardTitle>
              <CardDescription>Daily order volume</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={ordersData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="day" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Line type="monotone" dataKey="orders" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Super Admin Quick Actions */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Admin Management
              </CardTitle>
              <CardDescription>Manage platform administrators</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/super-admin/admins">
                <Button variant="outline" className="w-full justify-start">
                  View All Admins ({stats.totalAdmins})
                </Button>
              </Link>
              <Link href="/super-admin/admins/create">
                <Button className="w-full justify-start">
                  Create New Admin
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Financial Controls
              </CardTitle>
              <CardDescription>Manage platform finances</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/super-admin/finance">
                <Button variant="outline" className="w-full justify-start">
                  View Financial Reports
                </Button>
              </Link>
              <Link href="/super-admin/settings">
                <Button variant="outline" className="w-full justify-start">
                  Update Commission Rate
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                System Management
              </CardTitle>
              <CardDescription>System operations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/super-admin/system">
                <Button variant="outline" className="w-full justify-start">
                  System Settings
                </Button>
              </Link>
              <Link href="/super-admin/audit-logs">
                <Button variant="outline" className="w-full justify-start">
                  View Audit Logs
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
        </main>
      </div>
    </div>
  );
}

export default function SuperAdminDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['super_admin']}>
      <SuperAdminDashboardContent />
    </ProtectedRoute>
  );
}
