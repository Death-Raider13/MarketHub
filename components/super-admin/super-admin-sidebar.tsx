'use client';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  Store,
  Shield,
  DollarSign,
  BarChart3,
  FileText,
  Database,
  Settings,
  AlertTriangle,
  UserCog,
  Percent,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  description?: string;
}

// This sidebar is deprecated - use the tabbed interface in /super-admin/page.tsx instead
const superAdminNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/super-admin',
    icon: LayoutDashboard,
    description: 'Overview and stats',
  },
  {
    title: 'Admin Management',
    href: '/super-admin',
    icon: Shield,
    description: 'Manage administrators',
  },
  {
    title: 'Vendors',
    href: '/super-admin',
    icon: Store,
    badge: 12,
    description: 'Vendor oversight',
  },
  {
    title: 'Products',
    href: '/super-admin',
    icon: Package,
    badge: 28,
    description: 'Product management',
  },
  {
    title: 'Orders',
    href: '/super-admin',
    icon: ShoppingCart,
    description: 'Order management',
  },
  {
    title: 'Users',
    href: '/super-admin',
    icon: Users,
    description: 'User management',
  },
  {
    title: 'Financial Reports',
    href: '/super-admin',
    icon: DollarSign,
    description: 'Revenue and payouts',
  },
  {
    title: 'Commission Settings',
    href: '/super-admin',
    icon: Percent,
    description: 'Platform commission',
  },
  {
    title: 'Analytics',
    href: '/super-admin',
    icon: BarChart3,
    description: 'Platform analytics',
  },
  {
    title: 'Audit Logs',
    href: '/super-admin',
    icon: FileText,
    description: 'Admin activity logs',
  },
  {
    title: 'System Management',
    href: '/super-admin',
    icon: Database,
    description: 'Backups and maintenance',
  },
  {
    title: 'Platform Settings',
    href: '/super-admin',
    icon: Settings,
    description: 'Global settings',
  },
];

export function SuperAdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col border-r bg-muted/10">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <div>
            <h2 className="font-semibold">Super Admin</h2>
            <p className="text-xs text-muted-foreground">Full Control</p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-1">
          {superAdminNavItems.map((item) => {
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
                  title={item.description}
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

      {/* System Status */}
      <div className="border-t p-4">
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
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Critical Issues</span>
            <Badge variant="destructive">0</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
