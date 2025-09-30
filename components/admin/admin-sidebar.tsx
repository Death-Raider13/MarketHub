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
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/firebase/auth-context';
import { hasPermission } from '@/lib/admin/permissions';
import type { AdminRole } from '@/lib/admin/permissions';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  permission?: string;
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
    badge: 12,
    permission: 'vendors.view',
  },
  {
    title: 'Products',
    href: '/admin/products',
    icon: Package,
    badge: 28,
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
    badge: 5,
    permission: 'ads.view',
  },
  {
    title: 'Reviews',
    href: '/admin/reviews',
    icon: MessageSquare,
    badge: 15,
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
    badge: 3,
    permission: 'reviews.view',
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
    
    // Allow admin and super_admin roles access to all admin features
    return ['admin', 'super_admin', 'moderator', 'support'].includes(userProfile.role);
  };

  return (
    <div className="flex h-full w-64 flex-col border-r bg-muted/10">
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-1">
          {navItems.map((item) => {
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

      {/* Quick Stats */}
      <div className="border-t p-4">
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Pending Approvals</span>
            <Badge variant="outline">45</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Active Issues</span>
            <Badge variant="destructive">3</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
