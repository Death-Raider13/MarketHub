'use client';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  Megaphone,
  Settings,
  Store,
  MessageSquare,
  DollarSign,
  BarChart3,
  FileText,
  Shield,
  AlertCircle,
  Flag,
  Wallet,
  Bell,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth, type UserRole } from '@/lib/firebase/auth-context';
import { hasPermission } from '@/lib/admin/permissions';
import type { AdminRole } from '@/lib/admin/permissions';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  permission?: string;
}

// Role-specific dashboard routes
const getRoleDashboard = (role: UserRole) => {
  switch (role) {
    case 'super_admin': return '/super-admin'
    case 'admin': return '/admin/dashboard'
    case 'moderator': return '/moderator/dashboard'
    case 'support': return '/support/dashboard'
    default: return '/admin/dashboard'
  }
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Vendors',
    href: '/admin/vendors',
    icon: Store,
    permission: 'vendors.view',
  },
  {
    title: 'Products',
    href: '/admin/products',
    icon: Package,
    permission: 'products.view',
  },
  {
    title: 'Orders',
    href: '/admin/orders',
    icon: ShoppingCart,
    permission: 'orders.view',
  },
  {
    title: 'Users',
    href: '/admin/users',
    icon: Users,
    permission: 'users.view',
  },
  {
    title: 'Advertising',
    href: '/admin/advertising',
    icon: Megaphone,

    permission: 'ads.view',
  },
  {
    title: 'Reviews',
    href: '/admin/reviews',
    icon: MessageSquare,
    
    permission: 'reviews.view',
  },
  {
    title: 'Finance',
    href: '/admin/finance',
    icon: DollarSign,
    permission: 'finance.view',
  },
  {
    title: 'Payouts',
    href: '/admin/payouts',
    icon: Wallet,
    permission: 'finance.view',
  },
  {
    title: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
    permission: 'analytics.view',
  },
  {
    title: 'Reports',
    href: '/admin/reports',
    icon: FileText,
    permission: 'analytics.view',
  },
  {
    title: 'Audit Logs',
    href: '/admin/audit-logs',
    icon: Shield,
    permission: 'system.logs',
  },
  {
    title: 'Reported Items',
    href: '/admin/reports-abuse',
    icon: Flag,
    permission: 'reviews.view',
  },
  {
    title: 'Notifications',
    href: '/admin/notifications',
    icon: Bell,
    permission: 'system.maintenance',
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    permission: 'settings.view',
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { userProfile } = useAuth();

  const canAccessItem = (item: NavItem) => {
    if (!item.permission) return true;
    if (!userProfile?.role) return false;
    
    // Use proper permission checking
    return hasPermission(userProfile.role as AdminRole, item.permission as any);
  };

  // Get role-specific dashboard
  const dashboardHref = userProfile?.role ? getRoleDashboard(userProfile.role as UserRole) : '/admin/dashboard';

  // Update dashboard item to use role-specific route
  const updatedNavItems = navItems.map(item => 
    item.title === 'Dashboard' ? { ...item, href: dashboardHref } : item
  );

  return (
    <div className="flex h-full w-64 flex-col border-r bg-muted/10">
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-1">
          {updatedNavItems.map((item) => {
            if (!canAccessItem(item)) return null;

            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start',
                    isActive && 'bg-secondary font-medium'
                  )}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  <span className="flex-1 text-left">{item.title}</span>
                  {item.badge && item.badge > 0 && (
                    <Badge variant="destructive" className="ml-auto">
                      {item.badge}
                    </Badge>
                  )}
                </Button>
              </Link>
            );
          })}
        </div>
      </ScrollArea>

      {/* Role Info & Quick Stats */}
      <div className="border-t p-4">
        {/* Role Indicator */}
        <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-semibold text-blue-800">
              {userProfile?.role === 'super_admin' ? 'Super Admin' :
               userProfile?.role === 'admin' ? 'Admin' :
               userProfile?.role === 'moderator' ? 'Moderator' :
               userProfile?.role === 'support' ? 'Support' : 'Admin'}
            </span>
          </div>
          <p className="text-xs text-blue-600">
            {userProfile?.role === 'super_admin' ? 'Full platform control' :
             userProfile?.role === 'admin' ? 'Operations management' :
             userProfile?.role === 'moderator' ? 'Content moderation' :
             userProfile?.role === 'support' ? 'Customer support' : 'Platform management'}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Pending Approvals</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Active Issues</span>
          </div>
        </div>
      </div>
    </div>
  );
}
