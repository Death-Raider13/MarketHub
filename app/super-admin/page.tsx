'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProtectedRoute } from '@/lib/firebase/protected-route';
import { AdminHeader } from '@/components/admin/admin-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DollarSign,
  TrendingUp,
  Store,
  Package,
  Users,
  Shield,
  Activity,
  Database,
  LayoutDashboard,
  BarChart3,
  FileText,
  Settings,
  Percent,
  UserPlus,
  Download,
  Upload,
  AlertTriangle,
  RefreshCw,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

function SuperAdminContent() {
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
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    email: '',
    displayName: '',
    role: 'support',
  });

  // Data states
  const [vendors, setVendors] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  // Commission settings
  const [platformCommission, setPlatformCommission] = useState(15);
  const [minimumPayout, setMinimumPayout] = useState(5000);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load vendors
      const vendorsSnapshot = await getDocs(collection(db, 'vendors'));
      const vendorsData = vendorsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setVendors(vendorsData);
      const activeVendors = vendorsData.filter((v: any) => v.verified).length;
      const pendingVendors = vendorsData.filter((v: any) => !v.verified).length;

      // Load products
      const productsSnapshot = await getDocs(collection(db, 'products'));
      const productsData = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(productsData);
      const totalProducts = productsData.length;
      const pendingProducts = productsData.filter((p: any) => p.status === 'pending').length;

      // Load all users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersData);
      const totalUsers = usersData.length;

      // Load admins
      const adminsData = usersData.filter((u: any) => 
        ['admin', 'super_admin', 'moderator', 'support'].includes(u.role)
      );
      setAdmins(adminsData);
      const totalAdmins = adminsData.length;

      // Load orders
      const ordersSnapshot = await getDocs(collection(db, 'orders'));
      const ordersData = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(ordersData);
      const totalRevenue = ordersData.reduce((sum: number, order: any) => sum + (order.total || 0), 0);

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
        {/* Sidebar with Tabs */}
        <div className="w-64 border-r bg-muted/10 flex flex-col">
          <div className="border-b p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <div>
                <h2 className="font-semibold">Super Admin</h2>
                <p className="text-xs text-muted-foreground">Full Control</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            <Button
              variant={activeTab === 'dashboard' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('dashboard')}
            >
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </Button>

            <Button
              variant={activeTab === 'admins' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('admins')}
            >
              <Shield className="mr-2 h-4 w-4" />
              Admin Management
            </Button>

            <Button
              variant={activeTab === 'vendors' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('vendors')}
            >
              <Store className="mr-2 h-4 w-4" />
              Vendors
              {stats.pendingVendors > 0 && (
                <Badge variant="destructive" className="ml-auto">
                  {stats.pendingVendors}
                </Badge>
              )}
            </Button>

            <Button
              variant={activeTab === 'products' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('products')}
            >
              <Package className="mr-2 h-4 w-4" />
              Products
              {stats.pendingProducts > 0 && (
                <Badge variant="destructive" className="ml-auto">
                  {stats.pendingProducts}
                </Badge>
              )}
            </Button>

            <Button
              variant={activeTab === 'users' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('users')}
            >
              <Users className="mr-2 h-4 w-4" />
              Users
            </Button>

            <Button
              variant={activeTab === 'finance' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('finance')}
            >
              <DollarSign className="mr-2 h-4 w-4" />
              Financial Reports
            </Button>

            <Button
              variant={activeTab === 'commission' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('commission')}
            >
              <Percent className="mr-2 h-4 w-4" />
              Commission Settings
            </Button>

            <Button
              variant={activeTab === 'analytics' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('analytics')}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Analytics
            </Button>

            <Button
              variant={activeTab === 'audit' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('audit')}
            >
              <FileText className="mr-2 h-4 w-4" />
              Audit Logs
            </Button>

            <Button
              variant={activeTab === 'system' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('system')}
            >
              <Database className="mr-2 h-4 w-4" />
              System Management
            </Button>

            <Button
              variant={activeTab === 'settings' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('settings')}
            >
              <Settings className="mr-2 h-4 w-4" />
              Platform Settings
            </Button>
          </div>

          {/* System Status */}
          <div className="border-t p-4 mt-auto">
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">System Status</span>
                <Badge variant="default" className="bg-green-500">
                  Online
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Pending Actions</span>
                <Badge variant="outline">45</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-muted/30 p-6">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold flex items-center gap-2">
                    <LayoutDashboard className="h-8 w-8 text-primary" />
                    Dashboard
                  </h1>
                  <p className="text-muted-foreground">Complete platform oversight and control</p>
                </div>
                <Badge variant="default" className="text-lg px-4 py-2">
                  Super Admin
                </Badge>
              </div>

              {/* Stats Grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Revenue</p>
                        <p className="text-2xl font-bold">₦{stats.totalRevenue.toLocaleString()}</p>
                        <p className="mt-1 flex items-center text-xs text-green-600">
                          <TrendingUp className="mr-1 h-3 w-3" />
                          {stats.revenueGrowth}% growth
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
                          {stats.pendingVendors} pending
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
                          {stats.pendingProducts} pending
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
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-xs"
                          onClick={() => setActiveTab('commission')}
                        >
                          Update Rate
                        </Button>
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
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-xs"
                          onClick={() => setActiveTab('system')}
                        >
                          Backup Now
                        </Button>
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
              <div className="grid gap-6 lg:grid-cols-2">
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
            </div>
          )}

          {/* Admin Management Tab */}
          {activeTab === 'admins' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold flex items-center gap-2">
                    <Shield className="h-8 w-8 text-primary" />
                    Admin Management
                  </h1>
                  <p className="text-muted-foreground">Manage platform administrators</p>
                </div>
                <Dialog open={showCreateAdmin} onOpenChange={setShowCreateAdmin}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Create New Admin
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Admin</DialogTitle>
                      <DialogDescription>
                        Add a new administrator to the platform
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="admin@example.com"
                          value={newAdmin.email}
                          onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="displayName">Display Name</Label>
                        <Input
                          id="displayName"
                          placeholder="John Doe"
                          value={newAdmin.displayName}
                          onChange={(e) => setNewAdmin({ ...newAdmin, displayName: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="role">Role</Label>
                        <Select value={newAdmin.role} onValueChange={(value) => setNewAdmin({ ...newAdmin, role: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="moderator">Moderator</SelectItem>
                            <SelectItem value="support">Support</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowCreateAdmin(false)}>
                        Cancel
                      </Button>
                      <Button>Create Admin</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Administrator Accounts ({admins.length})</CardTitle>
                  <CardDescription>Manage all platform administrators</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {admins.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center">
                              No administrators found
                            </TableCell>
                          </TableRow>
                        ) : (
                          admins.map((admin: any) => (
                            <TableRow key={admin.id}>
                              <TableCell className="font-medium">{admin.displayName || 'N/A'}</TableCell>
                              <TableCell>{admin.email}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{admin.role}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={admin.status === 'active' ? 'default' : 'destructive'}>
                                  {admin.status || 'active'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button variant="ghost" size="sm">Edit</Button>
                                  <Button variant="ghost" size="sm">Suspend</Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Vendors Tab */}
          {activeTab === 'vendors' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <Store className="h-8 w-8 text-primary" />
                  Vendor Management
                </h1>
                <p className="text-muted-foreground">Manage all platform vendors</p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>All Vendors ({vendors.length})</CardTitle>
                  <CardDescription>View and manage vendor accounts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Store Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Commission</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {vendors.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center">
                              No vendors found
                            </TableCell>
                          </TableRow>
                        ) : (
                          vendors.map((vendor: any) => (
                            <TableRow key={vendor.id}>
                              <TableCell className="font-medium">{vendor.storeName || 'N/A'}</TableCell>
                              <TableCell>{vendor.email}</TableCell>
                              <TableCell>
                                <Badge variant={vendor.verified ? 'default' : 'secondary'}>
                                  {vendor.verified ? 'Verified' : 'Pending'}
                                </Badge>
                              </TableCell>
                              <TableCell>{vendor.commission || platformCommission}%</TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  {!vendor.verified && (
                                    <Button variant="ghost" size="sm">
                                      <CheckCircle className="mr-1 h-3 w-3" />
                                      Approve
                                    </Button>
                                  )}
                                  <Button variant="ghost" size="sm">View</Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Products Tab */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <Package className="h-8 w-8 text-primary" />
                  Product Management
                </h1>
                <p className="text-muted-foreground">Manage all platform products</p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>All Products ({products.length})</CardTitle>
                  <CardDescription>View and manage products</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product Name</TableHead>
                          <TableHead>Vendor</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center">
                              No products found
                            </TableCell>
                          </TableRow>
                        ) : (
                          products.map((product: any) => (
                            <TableRow key={product.id}>
                              <TableCell className="font-medium">{product.name || 'N/A'}</TableCell>
                              <TableCell>{product.vendorName || product.vendorId}</TableCell>
                              <TableCell>₦{product.price?.toLocaleString() || '0'}</TableCell>
                              <TableCell>
                                <Badge 
                                  variant={
                                    product.status === 'approved' ? 'default' : 
                                    product.status === 'pending' ? 'secondary' : 
                                    'destructive'
                                  }
                                >
                                  {product.status || 'pending'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  {product.status === 'pending' && (
                                    <>
                                      <Button variant="ghost" size="sm">
                                        <CheckCircle className="mr-1 h-3 w-3" />
                                        Approve
                                      </Button>
                                      <Button variant="ghost" size="sm">
                                        <XCircle className="mr-1 h-3 w-3" />
                                        Reject
                                      </Button>
                                    </>
                                  )}
                                  <Button variant="ghost" size="sm">View</Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <Users className="h-8 w-8 text-primary" />
                  User Management
                </h1>
                <p className="text-muted-foreground">Manage all platform users</p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>All Users ({users.length})</CardTitle>
                  <CardDescription>View and manage user accounts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center">
                              No users found
                            </TableCell>
                          </TableRow>
                        ) : (
                          users.slice(0, 50).map((user: any) => (
                            <TableRow key={user.id}>
                              <TableCell className="font-medium">{user.displayName || 'N/A'}</TableCell>
                              <TableCell>{user.email}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{user.role}</Badge>
                              </TableCell>
                              <TableCell>
                                {user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button variant="ghost" size="sm">View</Button>
                                  <Button variant="ghost" size="sm" className="text-red-600">Ban</Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  {users.length > 50 && (
                    <p className="mt-4 text-sm text-muted-foreground text-center">
                      Showing first 50 users. Total: {users.length}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Finance Tab */}
          {activeTab === 'finance' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <DollarSign className="h-8 w-8 text-primary" />
                  Financial Reports
                </h1>
                <p className="text-muted-foreground">View platform financial data</p>
              </div>

              {/* Financial Stats */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground">Total Revenue</div>
                    <div className="text-2xl font-bold">₦{stats.totalRevenue.toLocaleString()}</div>
                    <div className="text-xs text-green-600 mt-1">+18.2% from last month</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground">Platform Commission</div>
                    <div className="text-2xl font-bold">₦{(stats.totalRevenue * platformCommission / 100).toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground mt-1">{platformCommission}% of revenue</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground">Pending Payouts</div>
                    <div className="text-2xl font-bold">₦245,000</div>
                    <div className="text-xs text-orange-600 mt-1">12 vendors waiting</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground">Total Payouts</div>
                    <div className="text-2xl font-bold">₦1,850,000</div>
                    <div className="text-xs text-muted-foreground mt-1">This month</div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Transactions */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Transactions</CardTitle>
                  <CardDescription>Latest platform transactions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Vendor</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Commission</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[
                          { date: '2025-09-30', type: 'Sale', vendor: 'TechStore Pro', amount: 45000, commission: 6750, status: 'completed' },
                          { date: '2025-09-30', type: 'Payout', vendor: 'Fashion Hub', amount: -120000, commission: 0, status: 'completed' },
                          { date: '2025-09-29', type: 'Sale', vendor: 'Home Essentials', amount: 28000, commission: 4200, status: 'completed' },
                          { date: '2025-09-29', type: 'Sale', vendor: 'Electronics Plus', amount: 95000, commission: 14250, status: 'completed' },
                          { date: '2025-09-28', type: 'Refund', vendor: 'TechStore Pro', amount: -15000, commission: -2250, status: 'completed' },
                        ].map((transaction, index) => (
                          <TableRow key={index}>
                            <TableCell>{transaction.date}</TableCell>
                            <TableCell>
                              <Badge variant={
                                transaction.type === 'Sale' ? 'default' :
                                transaction.type === 'Payout' ? 'secondary' :
                                'destructive'
                              }>
                                {transaction.type}
                              </Badge>
                            </TableCell>
                            <TableCell>{transaction.vendor}</TableCell>
                            <TableCell className={transaction.amount < 0 ? 'text-red-600' : ''}>
                              ₦{Math.abs(transaction.amount).toLocaleString()}
                            </TableCell>
                            <TableCell className={transaction.commission < 0 ? 'text-red-600' : 'text-green-600'}>
                              ₦{Math.abs(transaction.commission).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{transaction.status}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Pending Payouts */}
              <Card>
                <CardHeader>
                  <CardTitle>Pending Payouts</CardTitle>
                  <CardDescription>Vendor payout requests awaiting approval</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { vendor: 'TechStore Pro', amount: 85000, requested: '2025-09-28' },
                      { vendor: 'Fashion Hub', amount: 120000, requested: '2025-09-27' },
                      { vendor: 'Home Essentials', amount: 40000, requested: '2025-09-26' },
                    ].map((payout, index) => (
                      <div key={index} className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                          <p className="font-medium">{payout.vendor}</p>
                          <p className="text-sm text-muted-foreground">Requested: {payout.requested}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="font-bold">₦{payout.amount.toLocaleString()}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Approve
                            </Button>
                            <Button size="sm" variant="outline">
                              <XCircle className="mr-1 h-3 w-3" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Commission Tab */}
          {activeTab === 'commission' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <Percent className="h-8 w-8 text-primary" />
                  Commission Settings
                </h1>
                <p className="text-muted-foreground">Manage platform commission rates</p>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Platform Commission</CardTitle>
                    <CardDescription>Default commission rate for all vendors</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="platformCommission">Commission Rate (%)</Label>
                      <Input
                        id="platformCommission"
                        type="number"
                        value={platformCommission}
                        onChange={(e) => setPlatformCommission(Number(e.target.value))}
                        min="0"
                        max="100"
                        step="0.1"
                      />
                      <p className="text-xs text-muted-foreground">
                        Current rate: {platformCommission}% (Vendor keeps {100 - platformCommission}%)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="minimumPayout">Minimum Payout Amount (₦)</Label>
                      <Input
                        id="minimumPayout"
                        type="number"
                        value={minimumPayout}
                        onChange={(e) => setMinimumPayout(Number(e.target.value))}
                        min="0"
                        step="100"
                      />
                      <p className="text-xs text-muted-foreground">
                        Vendors can request payout when balance reaches ₦{minimumPayout.toLocaleString()}
                      </p>
                    </div>

                    <Button className="w-full">
                      Save Commission Settings
                    </Button>

                    <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-4">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        <strong>Example:</strong> On a ₦10,000 sale with {platformCommission}% commission:
                        <br />• Platform earns: ₦{(10000 * platformCommission / 100).toLocaleString()}
                        <br />• Vendor receives: ₦{(10000 * (100 - platformCommission) / 100).toLocaleString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Vendor-Specific Rates</CardTitle>
                    <CardDescription>Set custom commission for individual vendors</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {vendors.slice(0, 5).map((vendor: any) => (
                        <div key={vendor.id} className="flex items-center justify-between rounded-lg border p-3">
                          <div>
                            <p className="font-medium">{vendor.storeName}</p>
                            <p className="text-xs text-muted-foreground">{vendor.email}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              className="w-20"
                              defaultValue={vendor.commission || platformCommission}
                              min="0"
                              max="100"
                              step="0.1"
                            />
                            <span className="text-sm">%</span>
                          </div>
                        </div>
                      ))}
                      {vendors.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No vendors to configure
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <BarChart3 className="h-8 w-8 text-primary" />
                  Analytics
                </h1>
                <p className="text-muted-foreground">Platform analytics and insights</p>
              </div>

              {/* Key Metrics */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground">Conversion Rate</div>
                    <div className="text-2xl font-bold">3.8%</div>
                    <div className="text-xs text-green-600 mt-1">+0.5% from last week</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground">Avg Order Value</div>
                    <div className="text-2xl font-bold">₦18,500</div>
                    <div className="text-xs text-green-600 mt-1">+12% from last month</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground">Active Sessions</div>
                    <div className="text-2xl font-bold">1,247</div>
                    <div className="text-xs text-muted-foreground mt-1">Currently online</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground">Bounce Rate</div>
                    <div className="text-2xl font-bold">42%</div>
                    <div className="text-xs text-red-600 mt-1">-3% from last week</div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>User Growth</CardTitle>
                    <CardDescription>New user registrations per month</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={[
                        { month: 'Jan', users: 120 },
                        { month: 'Feb', users: 185 },
                        { month: 'Mar', users: 245 },
                        { month: 'Apr', users: 310 },
                        { month: 'May', users: 280 },
                        { month: 'Jun', users: 420 },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="month" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip />
                        <Line type="monotone" dataKey="users" stroke="hsl(var(--primary))" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Top Categories</CardTitle>
                    <CardDescription>Sales by product category</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={[
                        { category: 'Electronics', sales: 45000 },
                        { category: 'Fashion', sales: 38000 },
                        { category: 'Home', sales: 28000 },
                        { category: 'Beauty', sales: 22000 },
                        { category: 'Sports', sales: 18000 },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="category" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip />
                        <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Top Performers */}
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Vendors</CardTitle>
                    <CardDescription>By revenue this month</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { name: 'TechStore Pro', revenue: 450000, orders: 89 },
                        { name: 'Fashion Hub', revenue: 380000, orders: 156 },
                        { name: 'Electronics Plus', revenue: 320000, orders: 67 },
                        { name: 'Home Essentials', revenue: 280000, orders: 94 },
                        { name: 'Beauty Corner', revenue: 220000, orders: 112 },
                      ].map((vendor, index) => (
                        <div key={index} className="flex items-center justify-between rounded-lg border p-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium">{vendor.name}</p>
                              <p className="text-xs text-muted-foreground">{vendor.orders} orders</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">₦{vendor.revenue.toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Top Products</CardTitle>
                    <CardDescription>Best selling products</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { name: 'iPhone 15 Pro Max', sales: 45, revenue: 1350000 },
                        { name: 'Samsung Galaxy S24', sales: 38, revenue: 1140000 },
                        { name: 'MacBook Air M3', sales: 22, revenue: 1100000 },
                        { name: 'Sony WH-1000XM5', sales: 67, revenue: 670000 },
                        { name: 'Nike Air Max 2024', sales: 89, revenue: 445000 },
                      ].map((product, index) => (
                        <div key={index} className="flex items-center justify-between rounded-lg border p-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-xs text-muted-foreground">{product.sales} sold</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">₦{product.revenue.toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Audit Logs Tab */}
          {activeTab === 'audit' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold flex items-center gap-2">
                    <FileText className="h-8 w-8 text-primary" />
                    Audit Logs
                  </h1>
                  <p className="text-muted-foreground">Track all admin actions</p>
                </div>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export Logs
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Admin Activity Logs</CardTitle>
                  <CardDescription>Recent administrative actions on the platform</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Timestamp</TableHead>
                          <TableHead>Admin</TableHead>
                          <TableHead>Action</TableHead>
                          <TableHead>Target</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>IP Address</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[
                          { time: '2025-09-30 14:05', admin: 'super_admin@platform.com', action: 'Approved Vendor', target: 'TechStore Pro', status: 'success', ip: '41.58.123.45' },
                          { time: '2025-09-30 13:58', admin: 'admin@platform.com', action: 'Rejected Product', target: 'Product #12345', status: 'success', ip: '41.58.123.46' },
                          { time: '2025-09-30 13:45', admin: 'super_admin@platform.com', action: 'Updated Commission', target: 'Platform Settings', status: 'success', ip: '41.58.123.45' },
                          { time: '2025-09-30 13:30', admin: 'moderator@platform.com', action: 'Banned User', target: 'user@example.com', status: 'success', ip: '41.58.123.47' },
                          { time: '2025-09-30 13:15', admin: 'admin@platform.com', action: 'Approved Product', target: 'Product #12344', status: 'success', ip: '41.58.123.46' },
                          { time: '2025-09-30 12:50', admin: 'super_admin@platform.com', action: 'Created Admin', target: 'newadmin@platform.com', status: 'success', ip: '41.58.123.45' },
                          { time: '2025-09-30 12:30', admin: 'admin@platform.com', action: 'Processed Payout', target: 'Fashion Hub - ₦120,000', status: 'success', ip: '41.58.123.46' },
                          { time: '2025-09-30 12:10', admin: 'support@platform.com', action: 'Updated Order', target: 'Order #ORD-2025-001', status: 'success', ip: '41.58.123.48' },
                        ].map((log, index) => (
                          <TableRow key={index}>
                            <TableCell className="text-sm">{log.time}</TableCell>
                            <TableCell>
                              <div>
                                <p className="text-sm font-medium">{log.admin}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{log.action}</Badge>
                            </TableCell>
                            <TableCell className="text-sm">{log.target}</TableCell>
                            <TableCell>
                              <Badge variant={log.status === 'success' ? 'default' : 'destructive'}>
                                {log.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{log.ip}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* System Management Tab */}
          {activeTab === 'system' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <Database className="h-8 w-8 text-primary" />
                  System Management
                </h1>
                <p className="text-muted-foreground">System operations and maintenance</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Button variant="outline" className="h-20 flex-col">
                  <Download className="h-6 w-6 mb-2" />
                  Backup Database
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Upload className="h-6 w-6 mb-2" />
                  Restore Backup
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <AlertTriangle className="h-6 w-6 mb-2" />
                  Maintenance Mode
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <RefreshCw className="h-6 w-6 mb-2" />
                  Clear Cache
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>System Status</CardTitle>
                  <CardDescription>Current system health</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Database</span>
                      <Badge variant="default" className="bg-green-500">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Healthy
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>API Services</span>
                      <Badge variant="default" className="bg-green-500">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Operational
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Storage</span>
                      <Badge variant="default" className="bg-green-500">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Available
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <Settings className="h-8 w-8 text-primary" />
                  Platform Settings
                </h1>
                <p className="text-muted-foreground">Configure platform-wide settings</p>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                {/* General Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle>General Settings</CardTitle>
                    <CardDescription>Basic platform configuration</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="platformName">Platform Name</Label>
                      <Input id="platformName" defaultValue="MarketHub Nigeria" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="supportEmail">Support Email</Label>
                      <Input id="supportEmail" type="email" defaultValue="support@markethub.ng" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="supportPhone">Support Phone</Label>
                      <Input id="supportPhone" defaultValue="+234 800 123 4567" />
                    </div>
                    <Button className="w-full">Save General Settings</Button>
                  </CardContent>
                </Card>

                {/* Feature Toggles */}
                <Card>
                  <CardHeader>
                    <CardTitle>Feature Toggles</CardTitle>
                    <CardDescription>Enable or disable platform features</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Vendor Registration</Label>
                        <p className="text-xs text-muted-foreground">Allow new vendors to register</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Customer Reviews</Label>
                        <p className="text-xs text-muted-foreground">Allow product reviews</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Guest Checkout</Label>
                        <p className="text-xs text-muted-foreground">Allow checkout without account</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Wishlist Feature</Label>
                        <p className="text-xs text-muted-foreground">Enable wishlist for customers</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Gateways</CardTitle>
                    <CardDescription>Configure payment providers</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded bg-green-500/10">
                          <DollarSign className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">Paystack</p>
                          <p className="text-xs text-muted-foreground">Nigerian payments</p>
                        </div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded bg-orange-500/10">
                          <DollarSign className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-medium">Flutterwave</p>
                          <p className="text-xs text-muted-foreground">African payments</p>
                        </div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded bg-blue-500/10">
                          <DollarSign className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">Bank Transfer</p>
                          <p className="text-xs text-muted-foreground">Direct bank payments</p>
                        </div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </CardContent>
                </Card>

                {/* Maintenance Mode */}
                <Card>
                  <CardHeader>
                    <CardTitle>Maintenance Mode</CardTitle>
                    <CardDescription>Put platform in maintenance mode</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Enable Maintenance Mode</Label>
                        <p className="text-xs text-muted-foreground">
                          {maintenanceMode ? 'Platform is offline' : 'Platform is live'}
                        </p>
                      </div>
                      <Switch 
                        checked={maintenanceMode} 
                        onCheckedChange={setMaintenanceMode}
                      />
                    </div>

                    {maintenanceMode && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="maintenanceMessage">Maintenance Message</Label>
                          <Textarea
                            id="maintenanceMessage"
                            placeholder="We're currently performing maintenance..."
                            rows={3}
                          />
                        </div>
                        <div className="rounded-lg bg-orange-50 dark:bg-orange-950 p-4">
                          <div className="flex gap-2">
                            <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                            <div className="text-sm text-orange-800 dark:text-orange-200">
                              <p className="font-medium">Warning</p>
                              <p>All users except admins will be unable to access the platform.</p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {!maintenanceMode && (
                      <div className="rounded-lg bg-green-50 dark:bg-green-950 p-4">
                        <div className="flex gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                          <div className="text-sm text-green-800 dark:text-green-200">
                            <p className="font-medium">Platform Status: Online</p>
                            <p>All systems operational</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function SuperAdminPage() {
  return (
    <ProtectedRoute allowedRoles={['super_admin']}>
      <SuperAdminContent />
    </ProtectedRoute>
  );
}
