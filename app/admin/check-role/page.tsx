'use client';

import { useAuth } from '@/lib/firebase/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function CheckRolePage() {
  const { user, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Role Diagnostic Tool</CardTitle>
          <CardDescription>Check your current role and permissions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* User Status */}
          <div className="space-y-2">
            <h3 className="font-semibold">Authentication Status</h3>
            <div className="flex items-center gap-2">
              {user ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-green-600">Logged In</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="text-red-600">Not Logged In</span>
                </>
              )}
            </div>
          </div>

          {/* User Email */}
          {user && (
            <div className="space-y-2">
              <h3 className="font-semibold">Email</h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          )}

          {/* User Profile */}
          <div className="space-y-2">
            <h3 className="font-semibold">Profile Status</h3>
            <div className="flex items-center gap-2">
              {userProfile ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-green-600">Profile Loaded</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="text-red-600">Profile Not Loaded</span>
                </>
              )}
            </div>
          </div>

          {/* Current Role */}
          {userProfile && (
            <div className="space-y-2">
              <h3 className="font-semibold">Current Role</h3>
              <Badge variant="default" className="text-lg px-4 py-2">
                {userProfile.role}
              </Badge>
            </div>
          )}

          {/* Access Permissions */}
          <div className="space-y-2">
            <h3 className="font-semibold">Access Permissions</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span>Admin Dashboard</span>
                {userProfile?.role === 'admin' || userProfile?.role === 'super_admin' ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
              </div>
              
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span>Super Admin Dashboard</span>
                {userProfile?.role === 'super_admin' ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <span>Vendor Dashboard</span>
                {userProfile?.role === 'vendor' ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
              </div>
            </div>
          </div>

          {/* Instructions */}
          {userProfile?.role !== 'super_admin' && (
            <div className="rounded-lg bg-orange-50 dark:bg-orange-950 p-4">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                <div className="text-sm text-orange-800 dark:text-orange-200">
                  <p className="font-medium mb-2">To become a Super Admin:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Go to Firebase Console</li>
                    <li>Navigate to Firestore Database</li>
                    <li>Find the 'users' collection</li>
                    <li>Locate your user document (email: {user?.email})</li>
                    <li>Change the 'role' field to: <code className="bg-orange-100 dark:bg-orange-900 px-1 rounded">super_admin</code></li>
                    <li>Save changes</li>
                    <li>Logout and login again</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* Quick Links */}
          <div className="space-y-2">
            <h3 className="font-semibold">Quick Links</h3>
            <div className="flex flex-wrap gap-2">
              {userProfile?.role === 'super_admin' && (
                <Link href="/admin/super-admin">
                  <Button>Go to Super Admin Dashboard</Button>
                </Link>
              )}
              {(userProfile?.role === 'admin' || userProfile?.role === 'super_admin') && (
                <Link href="/admin/dashboard">
                  <Button variant="outline">Go to Admin Dashboard</Button>
                </Link>
              )}
              {userProfile?.role === 'vendor' && (
                <Link href="/vendor/dashboard">
                  <Button variant="outline">Go to Vendor Dashboard</Button>
                </Link>
              )}
              <Link href="/">
                <Button variant="outline">Go to Home</Button>
              </Link>
            </div>
          </div>

          {/* Raw Data (for debugging) */}
          <details className="space-y-2">
            <summary className="cursor-pointer font-semibold">Show Raw Data (Debug)</summary>
            <pre className="mt-2 rounded-lg bg-muted p-4 text-xs overflow-auto">
              {JSON.stringify(
                {
                  user: user ? {
                    uid: user.uid,
                    email: user.email,
                    emailVerified: user.emailVerified,
                  } : null,
                  userProfile: userProfile,
                  loading: loading,
                },
                null,
                2
              )}
            </pre>
          </details>
        </CardContent>
      </Card>
    </div>
  );
}
