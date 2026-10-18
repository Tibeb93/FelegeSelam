'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../providers/AuthProvider';
import { UserRoleName } from '../../types/api';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  CalendarCheck,
  Award,
  Music,
  FileText,
  Calendar,
  Bell,
  ClipboardList,
  DollarSign,
  BarChart3,
  ShieldAlert,
  UserCog,
  Settings,
  Database,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Cross,
} from 'lucide-react';

interface SidebarItem {
  titleAm: string;
  titleEn: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRoleName[];
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  {
    titleAm: 'ዳሽቦርድ',
    titleEn: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    roles: ['super_admin', 'admin', 'teacher'],
  },
  {
    titleAm: 'አባላት',
    titleEn: 'Members',
    href: '/admin/members',
    icon: Users,
    roles: ['super_admin', 'admin'],
  },
  {
    titleAm: 'ትምህርቶች',
    titleEn: 'Courses',
    href: '/admin/courses',
    icon: BookOpen,
    roles: ['super_admin', 'admin', 'teacher'],
  },
  {
    titleAm: 'የመገኘት መዝገብ',
    titleEn: 'Attendance',
    href: '/admin/attendance',
    icon: CalendarCheck,
    roles: ['super_admin', 'admin', 'teacher'],
  },
  {
    titleAm: 'ውጤቶችና ምስክር',
    titleEn: 'Grades & Certs',
    href: '/admin/grades',
    icon: Award,
    roles: ['super_admin', 'admin', 'teacher'],
  },
  {
    titleAm: 'መዝሙራት',
    titleEn: 'Mezmur',
    href: '/admin/mezmur',
    icon: Music,
    roles: ['super_admin', 'admin', 'content_manager'],
  },
  {
    titleAm: 'ዕለታዊ መልዕክቶች',
    titleEn: 'Daily Posts',
    href: '/admin/posts',
    icon: FileText,
    roles: ['super_admin', 'admin', 'content_manager'],
  },
  {
    titleAm: 'መርሐ-ግብሮች',
    titleEn: 'Events',
    href: '/admin/events',
    icon: Calendar,
    roles: ['super_admin', 'admin', 'content_manager'],
  },
  {
    titleAm: 'ማሳወቂያዎች',
    titleEn: 'Notifications',
    href: '/admin/notifications',
    icon: Bell,
    roles: ['super_admin', 'admin', 'content_manager'],
  },
  {
    titleAm: 'የመስመር ላይ ቅጾች',
    titleEn: 'Online Forms',
    href: '/admin/forms',
    icon: ClipboardList,
    roles: ['super_admin', 'admin'],
  },
  {
    titleAm: 'ስጦታና ክፍያዎች',
    titleEn: 'Contributions',
    href: '/admin/contributions',
    icon: DollarSign,
    roles: ['super_admin', 'admin'],
  },
  {
    titleAm: 'ሪፖርቶች',
    titleEn: 'Reports',
    href: '/admin/reports',
    icon: BarChart3,
    roles: ['super_admin', 'admin'],
  },
  {
    titleAm: 'የክትትል መዝገብ',
    titleEn: 'Audit Logs',
    href: '/admin/audit-logs',
    icon: ShieldAlert,
    roles: ['super_admin'],
  },
  {
    titleAm: 'ተጠቃሚዎችና ሚናዎች',
    titleEn: 'Users & Roles',
    href: '/admin/users',
    icon: UserCog,
    roles: ['super_admin'],
  },
  {
    titleAm: 'ማስተካከያዎች',
    titleEn: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    roles: ['super_admin', 'admin'],
  },
  {
    titleAm: 'የውሂብ ምትኬ (Backup)',
    titleEn: 'Backups',
    href: '/admin/backups',
    icon: Database,
    roles: ['super_admin'],
  },
];

interface AdminSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  locale: string;
  onNavigate?: () => void;
}

export function AdminSidebar({
  collapsed,
  onToggleCollapse,
  locale,
  onNavigate,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const userRole = (user?.role?.name as UserRoleName) || 'super_admin';

  // Filter navigation items by role
  const menuItems = SIDEBAR_ITEMS.filter((item) =>
    item.roles.includes(userRole),
  );

  return (
    <aside
      className={`relative flex h-full flex-col border-r border-border bg-card transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Sidebar Header with Church Logo & Name */}
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        <Link
          href={`/${locale}/admin`}
          className="flex items-center gap-3 overflow-hidden"
          onClick={onNavigate}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
            <Cross className="h-5 w-5 text-secondary" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="truncate text-sm font-bold text-foreground">
                {locale === 'am' ? 'አዕማደ ሰላም' : 'Aemade Selam'}
              </h1>
              <p className="truncate text-xs text-secondary font-medium">
                {locale === 'am' ? 'ሰንበት ትምህርት ቤት' : 'Sunday School'}
              </p>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {menuItems.map((item) => {
          const itemHref = `/${locale}${item.href}`;
          const isExact = pathname === itemHref;
          const isChild =
            item.href !== '/admin' && pathname.startsWith(itemHref);
          const isActive = isExact || isChild;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={itemHref}
              onClick={onNavigate}
              title={collapsed ? (locale === 'am' ? item.titleAm : item.titleEn) : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm font-semibold'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              }`}
            >
              <Icon
                className={`h-5 w-5 shrink-0 ${
                  isActive ? 'text-secondary' : 'text-muted-foreground'
                }`}
              />
              {!collapsed && (
                <span className="truncate">
                  {locale === 'am' ? item.titleAm : item.titleEn}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer with Role Indicator and Collapse Button */}
      <div className="border-t border-border p-3 space-y-2">
        {!collapsed && user && (
          <div className="rounded-lg bg-muted/40 p-2.5 text-xs">
            <p className="truncate font-semibold text-foreground">
              {user.email || user.phone || 'Admin User'}
            </p>
            <p className="text-secondary font-medium uppercase tracking-wide">
              {user.role?.name || userRole}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-2 rounded-lg p-2 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
            title="ውጣ (Sign out)"
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span>{locale === 'am' ? 'ውጣ' : 'Sign Out'}</span>}
          </button>

          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden md:flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
