'use client';

import { useAuth, type UserRole } from '@/lib/firebase/auth-context';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { LogOut, Settings, User, Shield, LayoutDashboard, Crown, Briefcase, Flag, Headphones } from 'lucide-react';
import { NotificationBell } from '@/components/notifications/notification-bell';
import Link from 'next/link';

export function AdminHeader() {
  const { user, userProfile, logout } = useAuth();

  const getInitials = (name?: string) => {
    if (!name) return 'AD';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get role-specific dashboard info
  const getRoleDashboardInfo = (role?: UserRole) => {
    switch (role) {
      case 'super_admin':
        return {
          href: '/super-admin',
          label: 'Super Admin Dashboard',
          icon: Crown,
          description: 'Full platform control'
        };
      case 'admin':
        return {
          href: '/admin/dashboard',
          label: 'Admin Dashboard',
          icon: Briefcase,
          description: 'Operations management'
        };
      case 'moderator':
        return {
          href: '/moderator/dashboard',
          label: 'Moderator Dashboard',
          icon: Flag,
          description: 'Content moderation'
        };
      case 'support':
        return {
          href: '/support/dashboard',
          label: 'Support Dashboard',
          icon: Headphones,
          description: 'Customer support'
        };
      default:
        return {
          href: '/admin/dashboard',
          label: 'Admin Dashboard',
          icon: LayoutDashboard,
          description: 'Platform management'
        };
    }
  };

  const dashboardInfo = getRoleDashboardInfo(userProfile?.role);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Admin Panel</span>
          </Link>
          <Badge variant="secondary" className="hidden sm:inline-flex">
            {userProfile?.role === 'super_admin' ? 'Super Admin' :
             userProfile?.role === 'admin' ? 'Admin' :
             userProfile?.role === 'moderator' ? 'Moderator' :
             userProfile?.role === 'support' ? 'Support' : 'Admin'}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {/* Notifications */}
          <NotificationBell />

          {/* Admin Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={userProfile?.photoURL} alt={userProfile?.displayName} />
                  <AvatarFallback>{getInitials(userProfile?.displayName)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{userProfile?.displayName || 'Admin'}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {userProfile?.role === 'super_admin' ? 'Super Admin' :
                       userProfile?.role === 'admin' ? 'Admin' :
                       userProfile?.role === 'moderator' ? 'Moderator' :
                       userProfile?.role === 'support' ? 'Support' : 'Admin'}
                    </Badge>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {/* Role-specific Dashboard Link */}
              <DropdownMenuItem asChild>
                <Link href={dashboardInfo.href} className="cursor-pointer">
                  <div className="flex items-start gap-2 w-full">
                    <dashboardInfo.icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{dashboardInfo.label}</span>
                      <span className="text-xs text-muted-foreground">{dashboardInfo.description}</span>
                    </div>
                  </div>
                </Link>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem asChild>
                <Link href="/admin/profile" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/admin/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
