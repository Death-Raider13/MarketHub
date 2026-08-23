'use client';

import { useState, useEffect, useRef, type ChangeEvent } from 'react';
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
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/firebase/auth-context';
import { getRecentAdminActivity } from '@/lib/admin/audit-log';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

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
  const { userProfile, getCurrentToken } = useAuth();
  const [actionLoading, setActionLoading] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const restoreInputRef = useRef<HTMLInputElement>(null);
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
    platformCommission: 10,
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

  const callSuperAdmin = async (payload: Record<string, unknown>) => {
    const token = await getCurrentToken();
    if (!token) throw new Error('Your session has expired. Please sign in again.');
    const response = await fetch('/api/admin/super-admin', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Admin operation failed');
    }
    return response;
  };

  const handleCreateAdmin = async () => {
    setActionLoading(true);
    try {
      const response = await callSuperAdmin({ action: 'create-admin', ...newAdmin });
      const data = await response.json();
      setShowCreateAdmin(false);
      setNewAdmin({ email: '', displayName: '', role: 'support' });
      if (data.inviteLink) {
        await navigator.clipboard?.writeText(data.inviteLink).catch(() => undefined);
        toast.success('Admin created. The password-reset invitation link was copied to your clipboard.');
      } else {
        toast.success('Admin created successfully.');
      }
      await loadSuperAdminData();
    } catch (error) {
      console.error('Failed to create admin:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create admin.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSetAdminStatus = async (adminId: string, status: 'active' | 'suspended') => {
    if (status === 'suspended' && !confirm('Are you sure you want to suspend this admin?')) return;
    setActionLoading(true);
    try {
      await callSuperAdmin({ action: 'update-status', targetId: adminId, status });
      toast.success(`Admin ${status === 'suspended' ? 'suspended' : 'activated'} successfully.`);
      await loadSuperAdminData();
    } catch (error) {
      console.error('Failed to update admin status:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update admin status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBackupDatabase = async () => {
    setActionLoading(true);
    try {
      const response = await callSuperAdmin({ action: 'backup' });
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = response.headers.get('content-disposition')?.match(/filename="([^"]+)"/)?.[1] || 'markethub-backup.json';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      toast.success(`Backup downloaded (${response.headers.get('x-markethub-backup-documents') || '0'} documents).`);
    } catch (error) {
      console.error('Failed to create backup:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create backup.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestoreBackup = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      toast.error('Backup files must be 50 MB or smaller.');
      return;
    }
    if (!confirm('Restore this backup by merging its records into Firestore? Audit logs are intentionally skipped.')) return;
    setActionLoading(true);
    try {
      const backup = JSON.parse(await file.text());
      const response = await callSuperAdmin({ action: 'restore', backup });
      const data = await response.json();
      toast.success(`Backup restored: ${data.documentCount || 0} documents merged.`);
    } catch (error) {
      console.error('Failed to restore backup:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to restore backup.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleMaintenance = async () => {
    const enabled = !maintenanceMode;
    if (enabled && !confirm('Enable maintenance mode? Customers will be unable to use affected areas while you work.')) return;
    setActionLoading(true);
    try {
      await callSuperAdmin({ action: 'maintenance', enabled });
      setMaintenanceMode(enabled);
      toast.success(`Maintenance mode ${enabled ? 'enabled' : 'disabled'}.`);
    } catch (error) {
      console.error('Failed to update maintenance mode:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update maintenance mode.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClearCache = async () => {
    setActionLoading(true);
    try {
      await callSuperAdmin({ action: 'clear-cache' });
      toast.success('Cache invalidation recorded. New requests will use fresh settings.');
    } catch (error) {
      console.error('Failed to clear cache:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to clear cache.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateCommission = async () => {
    const enteredRate = prompt('Enter new commission rate (%):', String(stats.platformCommission));
    if (enteredRate === null) return;
    const rate = Number(enteredRate);
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
      toast.error('Enter a commission rate between 0 and 100.');
      return;
    }
    setActionLoading(true);
    try {
      await callSuperAdmin({ action: 'update-commission', rate });
      setStats(prev => ({ ...prev, platformCommission: rate }));
      toast.success('Commission rate updated successfully.');
    } catch (error) {
      console.error('Failed to update commission:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update commission.');
    } finally {
      setActionLoading(false);
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
                      <Button onClick={handleCreateAdmin} disabled={actionLoading}>Create Admin</Button>
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
                  <Button variant="outline" className="w-full justify-start" onClick={handleBackupDatabase} disabled={actionLoading}>
                    <Download className="mr-2 h-4 w-4" />
                    Backup Database
                  </Button>

                  <>
                    <input
                      ref={restoreInputRef}
                      type="file"
                      accept="application/json,.json"
                      className="hidden"
                      onChange={handleRestoreBackup}
                    />
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => restoreInputRef.current?.click()}
                      disabled={actionLoading}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Restore Backup
                    </Button>
                  </>

                  <Button
                    variant={maintenanceMode ? "destructive" : "outline"}
                    className="w-full justify-start"
                    onClick={handleToggleMaintenance}
                    disabled={actionLoading}
                  >
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    {maintenanceMode ? 'Disable Maintenance' : 'Maintenance Mode'}
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={handleClearCache}
                    disabled={actionLoading}
                  >
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
                                    onClick={() => handleSetAdminStatus(admin.id, 'suspended')}
                                  >
                                    Suspend
                                  </Button>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleSetAdminStatus(admin.id, 'active')}
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
    <ProtectedRoute requiredPermissions={['admins.create', 'system.maintenance']} requireAllPermissions={true}>
      <SuperAdminDashboard />
    </ProtectedRoute>
  );
}
