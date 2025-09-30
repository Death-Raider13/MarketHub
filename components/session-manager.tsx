'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/firebase/auth-context';
import {
  getUserActiveSessions,
  terminateSession,
  getSessionTimeoutWarning,
  type Session,
} from '@/lib/session-management';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Monitor, Smartphone, Tablet, MapPin, Clock, LogOut } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function SessionManager() {
  const { user, session: currentSession, logoutAllDevices } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [terminatingSession, setTerminatingSession] = useState<string | null>(null);
  const [showLogoutAllDialog, setShowLogoutAllDialog] = useState(false);

  useEffect(() => {
    loadSessions();
  }, [user]);

  const loadSessions = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const userSessions = await getUserActiveSessions(user.uid);
      setSessions(userSessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTerminateSession = async (sessionId: string) => {
    setTerminatingSession(sessionId);
    try {
      await terminateSession(sessionId);
      await loadSessions();
    } catch (error) {
      console.error('Error terminating session:', error);
    } finally {
      setTerminatingSession(null);
    }
  };

  const handleLogoutAllDevices = async () => {
    try {
      await logoutAllDevices();
      setShowLogoutAllDialog(false);
    } catch (error) {
      console.error('Error logging out all devices:', error);
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="h-5 w-5" />;
      case 'tablet':
        return <Tablet className="h-5 w-5" />;
      default:
        return <Monitor className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>Loading your active sessions...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>
                Manage devices where you're currently logged in
              </CardDescription>
            </div>
            {sessions.length > 1 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowLogoutAllDialog(true)}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout All Devices
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active sessions found.</p>
          ) : (
            sessions.map((session) => {
              const isCurrentSession = currentSession?.sessionId === session.sessionId;
              
              return (
                <div
                  key={session.sessionId}
                  className="flex items-start justify-between rounded-lg border p-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="rounded-full bg-muted p-2">
                      {getDeviceIcon(session.deviceInfo.device)}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {session.deviceInfo.browser} on {session.deviceInfo.os}
                        </p>
                        {isCurrentSession && (
                          <Badge variant="default">Current Session</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>{session.ipAddress}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            Last active {formatDistanceToNow(session.lastActivity, { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Signed in {formatDistanceToNow(session.createdAt, { addSuffix: true })}
                      </p>
                      {session.rememberMe && (
                        <Badge variant="secondary" className="text-xs">
                          Remember Me Enabled
                        </Badge>
                      )}
                    </div>
                  </div>
                  {!isCurrentSession && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTerminateSession(session.sessionId)}
                      disabled={terminatingSession === session.sessionId}
                    >
                      {terminatingSession === session.sessionId ? 'Terminating...' : 'Terminate'}
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showLogoutAllDialog} onOpenChange={setShowLogoutAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Logout from all devices?</AlertDialogTitle>
            <AlertDialogDescription>
              This will sign you out from all devices including this one. You'll need to log in again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogoutAllDevices}>
              Logout All Devices
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function SessionTimeoutWarning() {
  const { session } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    if (!session) return;

    // Check for timeout warning
    const warningTime = getSessionTimeoutWarning(session);
    
    if (warningTime > 0) {
      const warningTimer = setTimeout(() => {
        setShowWarning(true);
      }, warningTime);

      return () => clearTimeout(warningTimer);
    } else {
      setShowWarning(true);
    }
  }, [session]);

  useEffect(() => {
    if (!showWarning || !session) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, session.expiresAt.getTime() - Date.now());
      setTimeRemaining(remaining);

      if (remaining === 0) {
        setShowWarning(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [showWarning, session]);

  if (!showWarning || timeRemaining === 0) return null;

  const minutes = Math.floor(timeRemaining / 60000);
  const seconds = Math.floor((timeRemaining % 60000) / 1000);

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Card className="border-orange-500 bg-orange-50 dark:bg-orange-950">
        <CardHeader>
          <CardTitle className="text-orange-900 dark:text-orange-100">
            Session Expiring Soon
          </CardTitle>
          <CardDescription className="text-orange-700 dark:text-orange-300">
            Your session will expire in {minutes}:{seconds.toString().padStart(2, '0')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => {
              // Refresh session
              window.location.reload();
            }}
            className="w-full"
          >
            Stay Logged In
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
