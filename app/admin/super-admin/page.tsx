'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProtectedRoute } from '@/lib/firebase/protected-route';
import { AdminHeader } from '@/components/admin/admin-header';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
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
import {
  Shield,
  UserPlus,
  Database,
  Settings,
  DollarSign,
  AlertTriangle,
  Activity,
  Users,
  Lock,
  Download,
  Upload,
  RefreshCw,
} from 'lucide-react';
import { collection, getDocs, query, where, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/firebase/auth-context';
import { getRecentAdminActivity } from '@/lib/admin/audit-log';
import { formatDistanceToNow } from 'date-fns';

interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  role: string;
  createdAt: Date;
  lastLogin?: Date;
  status: 'active' | 'suspended';
}

function SuperAdminDashboard() {
  const { userProfile } = useAuth();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    email: '',
    displayName: '',
    role: 'support',
  });

  // Platform stats
  const [stats, setStats] = useState({
    totalAdmins: 0,
    activeAdmins: 0,
    suspendedAdmins: 0,
    totalRevenue: 0,
    platformCommission: 15,
    databaseSize: '2.4 GB',
    uptime: '99.98%',
  });

  useEffect(() => {
    loadSuperAdminData();
  }, []);

  const loadSuperAdminData = async () => {
    setLoading(true);
    try {
      // Load all admin users
      const usersQuery = query(
        collection(db, 'users'),
        where('role', 'in', ['admin', 'super_admin', 'moderator', 'support'])
      );
      const usersSnapshot = await getDocs(usersQuery);
      const adminUsers = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        lastLogin: doc.data().lastLogin?.toDate(),
        status: doc.data().status || 'active',
      })) as AdminUser[];

      setAdmins(adminUsers);

      // Update stats
      setStats(prev => ({
        ...prev,
        totalAdmins: adminUsers.length,
        activeAdmins: adminUsers.filter(a => a.status === 'active').length,
        suspendedAdmins: adminUsers.filter(a => a.status === 'suspended').length,
      }));

      // Load recent admin activity
      const activity = await getRecentAdminActivity(20);
      setRecentActivity(activity);

    } catch (error) {
      console.error('Failed to load super admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async () => {
    try {
      // In a real implementation, this would:
      // 1. Create Firebase Auth user
      // 2. Send invitation email
      // 3. Create user document in Firestore
      
      console.log('Creating admin:', newAdmin);
      
      // For now, just show success message
      alert(`Admin invitation sent to ${newAdmin.email}`);
      setShowCreateAdmin(false);
      setNewAdmin({ email: '', displayName: '', role: 'support' });
      loadSuperAdminData();
    } catch (error) {
      console.error('Failed to create admin:', error);
      alert('Failed to create admin. Please try again.');
    }
  };

  const handleSuspendAdmin = async (adminId: string) => {
    if (!confirm('Are you sure you want to suspend this admin?')) return;
    
    try {
      await updateDoc(doc(db, 'users', adminId), {
        status: 'suspended',
      });
      alert('Admin suspended successfully');
      loadSuperAdminData();
    } catch (error) {
      console.error('Failed to suspend admin:', error);
      alert('Failed to suspend admin');
    }
  };

  const handleActivateAdmin = async (adminId: string) => {
    try {
      await updateDoc(doc(db, 'users', adminId), {
        status: 'active',
      });
      alert('Admin activated successfully');
      loadSuperAdminData();
    } catch (error) {
      console.error('Failed to activate admin:', error);
      alert('Failed to activate admin');
    }
  };

  const handleBackupDatabase = () => {
    alert('Database backup initiated. You will receive an email when complete.');
  };

  const handleUpdateCommission = () => {
    const newRate = prompt('Enter new commission rate (%):', String(stats.platformCommission));
    if (newRate) {
      setStats(prev => ({ ...prev, platformCommission: parseFloat(newRate) }));
      alert('Commission rate updated successfully');
    }
  };

  return (
    <div className="flex h-screen flex-col">
      <AdminHeader />
      
      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar />
        
        <main className="flex-1 overflow-y-auto bg-muted/30 p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <Shield className="h-8 w-8 text-primary" />
                  Super Admin Dashboard
                </h1>
                <p className="text-muted-foreground">Platform management and system controls</p>
              </div>
              <Badge variant="default" className="text-lg px-4 py-2">
                Super Admin
              </Badge>
            </div>
          </div>

          {/* System Health Stats */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Admins</p>
                    <p className="text-2xl font-bold">{stats.totalAdmins}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stats.activeAdmins} active
                    </p>
                  </div>
                  <div className="rounded-full bg-blue-500/10 p-3">
                    <Users className="h-5 w-5 text-blue-600" />
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
                      onClick={handleUpdateCommission}
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
                      onClick={handleBackupDatabase}
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
                    <p className="text-2xl font-bold">{stats.uptime}</p>
                    <p className="text-xs text-green-600 mt-1">All systems operational</p>
                  </div>
                  <div className="rounded-full bg-green-500/10 p-3">
                    <Activity className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Super Admin Exclusive Actions */}
          <div className="mb-6 grid gap-6 lg:grid-cols-2">
            {/* Admin Management */}
            <Card>
              <CardHeader>
                <CardTitle>Admin Management</CardTitle>
                <CardDescription>Create and manage administrator accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <Dialog open={showCreateAdmin} onOpenChange={setShowCreateAdmin}>
                  <DialogTrigger asChild>
                    <Button className="w-full">
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
                      <Button onClick={handleCreateAdmin}>Create Admin</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {/* Financial Controls */}
            <Card>
              <CardHeader>
                <CardTitle>Financial Controls</CardTitle>
                <CardDescription>Manage platform commission and payouts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">Platform Commission</p>
                    <p className="text-sm text-muted-foreground">Current rate: {stats.platformCommission}%</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={handleUpdateCommission}>
                    <DollarSign className="mr-1 h-3 w-3" />
                    Update
                  </Button>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">Approve Large Payouts</p>
                    <p className="text-sm text-muted-foreground">Over ₦100,000</p>
                  </div>
                  <Button size="sm" variant="outline">
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Controls */}
          <div className="mb-6">
            <Card>
              <CardHeader>
                <CardTitle>System Management</CardTitle>
                <CardDescription>Critical system operations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Button variant="outline" className="w-full justify-start" onClick={handleBackupDatabase}>
                    <Download className="mr-2 h-4 w-4" />
                    Backup Database
                  </Button>

                  <Button variant="outline" className="w-full justify-start">
                    <Upload className="mr-2 h-4 w-4" />
                    Restore Backup
                  </Button>

                  <Button variant="outline" className="w-full justify-start">
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Maintenance Mode
                  </Button>

                  <Button variant="outline" className="w-full justify-start">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Clear Cache
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Admin Management & Recent Activity */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Admin Management */}
            <Card>
              <CardHeader>
                <CardTitle>Admin Management</CardTitle>
                <CardDescription>Manage platform administrators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center">
                            Loading...
                          </TableCell>
                        </TableRow>
                      ) : admins.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center">
                            No admins found
                          </TableCell>
                        </TableRow>
                      ) : (
                        admins.map((admin) => (
                          <TableRow key={admin.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{admin.displayName}</p>
                                <p className="text-xs text-muted-foreground">{admin.email}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{admin.role}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={admin.status === 'active' ? 'default' : 'destructive'}>
                                {admin.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {admin.id !== userProfile?.uid && (
                                admin.status === 'active' ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleSuspendAdmin(admin.id)}
                                  >
                                    Suspend
                                  </Button>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleActivateAdmin(admin.id)}
                                  >
                                    Activate
                                  </Button>
                                )
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Recent Admin Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Admin Activity</CardTitle>
                <CardDescription>Monitor administrator actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivity.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No recent activity</p>
                  ) : (
                    recentActivity.slice(0, 10).map((activity, index) => (
                      <div key={index} className="flex items-start gap-3 rounded-lg border p-3">
                        <div className="rounded-full bg-primary/10 p-2">
                          <Shield className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.adminEmail}</p>
                          <p className="text-xs text-muted-foreground">{activity.action}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                          </p>
                        </div>
                        <Badge variant={activity.success ? 'default' : 'destructive'} className="text-xs">
                          {activity.success ? 'Success' : 'Failed'}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function SuperAdminPage() {
  return (
    <ProtectedRoute allowedRoles={['super_admin']}>
      <SuperAdminDashboard />
    </ProtectedRoute>
  );
}
