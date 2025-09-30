'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProtectedRoute } from '@/lib/firebase/protected-route';
import { AdminHeader } from '@/components/admin/admin-header';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Store,
  Package,
  Users,
  ShoppingCart,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import Link from 'next/link';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface DashboardStats {
  totalRevenue: number;
  revenueGrowth: number;
  activeVendors: number;
  pendingVendors: number;
  totalProducts: number;
  pendingProducts: number;
  totalUsers: number;
  userGrowth: number;
  totalOrders: number;
  pendingOrders: number;
}

interface PendingApproval {
  id: string;
  type: 'vendor' | 'product' | 'ad' | 'review';
  title: string;
  submittedBy: string;
  submittedAt: Date;
}

function EnhancedAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    revenueGrowth: 0,
    activeVendors: 0,
    pendingVendors: 0,
    totalProducts: 0,
    pendingProducts: 0,
    totalUsers: 0,
    userGrowth: 0,
    totalOrders: 0,
    pendingOrders: 0,
  });

  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load vendors
      const vendorsQuery = query(collection(db, 'vendors'));
      const vendorsSnapshot = await getDocs(vendorsQuery);
      const vendors = vendorsSnapshot.docs.map(doc => doc.data());
      const activeVendors = vendors.filter(v => v.verified).length;
      const pendingVendors = vendors.filter(v => !v.verified).length;

      // Load products
      const productsQuery = query(collection(db, 'products'));
      const productsSnapshot = await getDocs(productsQuery);
      const products = productsSnapshot.docs.map(doc => doc.data());
      const totalProducts = products.length;
      const pendingProducts = products.filter(p => p.status === 'pending').length;

      // Load users
      const usersQuery = query(collection(db, 'users'));
      const usersSnapshot = await getDocs(usersQuery);
      const totalUsers = usersSnapshot.size;

      // Load orders
      const ordersQuery = query(collection(db, 'orders'));
      const ordersSnapshot = await getDocs(ordersQuery);
      const orders = ordersSnapshot.docs.map(doc => doc.data());
      const totalOrders = orders.length;
      const pendingOrders = orders.filter(o => o.status === 'pending').length;

      // Calculate revenue (mock for now)
      const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);

      setStats({
        totalRevenue,
        revenueGrowth: 18.2, // Mock
        activeVendors,
        pendingVendors,
        totalProducts,
        pendingProducts,
        totalUsers,
        userGrowth: 24.5, // Mock
        totalOrders,
        pendingOrders,
      });

      // Load pending approvals
      const pending: PendingApproval[] = [];

      // Pending vendors
      const pendingVendorsQuery = query(
        collection(db, 'vendor_applications'),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const pendingVendorsSnapshot = await getDocs(pendingVendorsQuery);
      pendingVendorsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        pending.push({
          id: doc.id,
          type: 'vendor',
          title: data.storeName,
          submittedBy: data.email,
          submittedAt: data.createdAt?.toDate() || new Date(),
        });
      });

      // Pending products
      const pendingProductsQuery = query(
        collection(db, 'products'),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const pendingProductsSnapshot = await getDocs(pendingProductsQuery);
      pendingProductsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        pending.push({
          id: doc.id,
          type: 'product',
          title: data.name,
          submittedBy: data.vendorId,
          submittedAt: data.createdAt?.toDate() || new Date(),
        });
      });

      setPendingApprovals(pending.slice(0, 10));
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
        <AdminSidebar />
        
        <main className="flex-1 overflow-y-auto bg-muted/30 p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Platform overview and key metrics</p>
          </div>

          {/* Stats Cards */}
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

          {/* Pending Approvals & Quick Actions */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                    Pending Approvals
                  </CardTitle>
                  <CardDescription>Items requiring your attention</CardDescription>
                </div>
                <Badge variant="destructive">{pendingApprovals.length}</Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                {loading ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : pendingApprovals.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No pending approvals</p>
                ) : (
                  pendingApprovals.map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{item.type}</Badge>
                          <p className="font-medium">{item.title}</p>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          By {item.submittedBy} • {item.submittedAt.toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Approve
                        </Button>
                        <Button size="sm" variant="outline">
                          <XCircle className="mr-1 h-3 w-3" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common administrative tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/admin/vendors?status=pending">
                  <Button variant="outline" className="w-full justify-start">
                    <Clock className="mr-2 h-4 w-4" />
                    Review Pending Vendors ({stats.pendingVendors})
                  </Button>
                </Link>
                <Link href="/admin/products?status=pending">
                  <Button variant="outline" className="w-full justify-start">
                    <Clock className="mr-2 h-4 w-4" />
                    Review Pending Products ({stats.pendingProducts})
                  </Button>
                </Link>
                <Link href="/admin/orders?status=pending">
                  <Button variant="outline" className="w-full justify-start">
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Process Pending Orders ({stats.pendingOrders})
                  </Button>
                </Link>
                <Link href="/admin/finance/payouts">
                  <Button variant="outline" className="w-full justify-start">
                    <DollarSign className="mr-2 h-4 w-4" />
                    Process Vendor Payouts
                  </Button>
                </Link>
                <Link href="/admin/reports-abuse">
                  <Button variant="outline" className="w-full justify-start">
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Review Reported Items
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

export default function EnhancedAdminDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
      <EnhancedAdminDashboard />
    </ProtectedRoute>
  );
}
