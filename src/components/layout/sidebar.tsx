'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface SidebarItem {
  title: string;
  href: string;
  icon: string;
  badge?: string | number;
  description?: string;
}

interface SidebarProps {
  className?: string;
  isCollapsed?: boolean;
}

export function Sidebar({ className, isCollapsed = false }: SidebarProps) {
  const pathname = usePathname();

  const navigationItems: SidebarItem[] = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: '📊',
      description: 'Overview and statistics'
    },
    {
      title: 'My Polls',
      href: '/dashboard/polls',
      icon: '📝',
      badge: 5,
      description: 'Polls you created'
    },
    {
      title: 'Browse Polls',
      href: '/polls',
      icon: '🔍',
      description: 'Discover new polls'
    },
    {
      title: 'Create Poll',
      href: '/polls/create',
      icon: '➕',
      description: 'Create a new poll'
    },
  ];

  const accountItems: SidebarItem[] = [
    {
      title: 'Profile',
      href: '/profile',
      icon: '👤',
      description: 'Manage your profile'
    },
    {
      title: 'Settings',
      href: '/settings',
      icon: '⚙️',
      description: 'App preferences'
    },
    {
      title: 'Analytics',
      href: '/analytics',
      icon: '📈',
      description: 'View detailed analytics'
    },
  ];

  const renderSidebarItem = (item: SidebarItem) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

    return (
      <Button
        key={item.href}
        variant={isActive ? 'secondary' : 'ghost'}
        className={cn(
          'w-full justify-start gap-3 h-10',
          isActive && 'bg-secondary font-medium',
          isCollapsed && 'px-2'
        )}
        asChild
      >
        <Link href={item.href}>
          <span className="text-lg">{item.icon}</span>
          {!isCollapsed && (
            <>
              <span className="flex-1 text-left">{item.title}</span>
              {item.badge && (
                <Badge variant="secondary" className="ml-auto">
                  {item.badge}
                </Badge>
              )}
            </>
          )}
        </Link>
      </Button>
    );
  };

  return (
    <div
      className={cn(
        'flex h-full flex-col border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        isCollapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      {/* Logo Section */}
      <div className="flex h-16 items-center border-b px-4">
        {!isCollapsed ? (
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold">P</span>
            </div>
            <span className="font-bold text-xl">Polly</span>
          </Link>
        ) : (
          <Link href="/" className="flex items-center justify-center">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold">P</span>
            </div>
          </Link>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-auto py-4">
        <div className="space-y-1 px-3">
          {!isCollapsed && (
            <div className="px-3 py-2">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Navigation
              </h2>
            </div>
          )}

          {navigationItems.map(renderSidebarItem)}
        </div>

        <Separator className="my-4" />

        <div className="space-y-1 px-3">
          {!isCollapsed && (
            <div className="px-3 py-2">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Account
              </h2>
            </div>
          )}

          {accountItems.map(renderSidebarItem)}
        </div>
      </div>

      {/* Footer / User Info */}
      <div className="border-t p-3">
        {!isCollapsed ? (
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
              <span className="text-sm font-medium">U</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">User Name</p>
              <p className="text-xs text-muted-foreground truncate">user@example.com</p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
              <span className="text-sm font-medium">U</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
