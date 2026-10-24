'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import {
  Cross,
  LayoutDashboard,
  User,
  BookOpen,
  GraduationCap,
  Music,
  FileText,
  Calendar,
  Bell,
  Wallet,
  ShieldCheck,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useTheme } from '@/providers/ThemeProvider';
import { useAuth } from '@/providers/AuthProvider';
import { apiRequest } from '@/lib/api-client';
import { SchoolLogo } from '@/components/common/SchoolLogo';

interface PortalLayoutProps {
  children: React.ReactNode;
  params: { locale: string };
}

export default function PortalLayout({ children, params: { locale } }: PortalLayoutProps) {
  const t = useTranslations('Portal');
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Check unread notifications count
  const { data: notifData } = useQuery<{ unreadCount?: number }>({
    queryKey: ['notifications', 'my'],
    queryFn: () => apiRequest('/notifications', { params: { limit: 1 } }),
    enabled: !!user,
    refetchInterval: 30000,
  });

  const unreadCount = notifData?.unreadCount || 0;

  const portalNav = [
    { href: `/${locale}/portal`, label: t('dashboard'), icon: LayoutDashboard },
    { href: `/${locale}/portal/profile`, label: t('myProfile'), icon: User },
    { href: `/${locale}/portal/courses`, label: t('myCourses'), icon: BookOpen },
    { href: `/${locale}/portal/academic`, label: t('attendanceGrades'), icon: GraduationCap },
    { href: `/${locale}/portal/favorites`, label: t('favorites'), icon: Music },
    { href: `/${locale}/portal/forms`, label: t('forms'), icon: FileText },
    { href: `/${locale}/portal/events`, label: t('events'), icon: Calendar },
    {
      href: `/${locale}/portal/notifications`,
      label: t('notifications'),
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    { href: `/${locale}/portal/contributions`, label: t('contributions'), icon: Wallet },
    { href: `/${locale}/portal/privacy`, label: t('privacy'), icon: ShieldCheck },
  ];

  const isActive = (href: string) => {
    if (href === `/${locale}/portal`) {
      return pathname === href || pathname === `/${locale}/portal/`;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Top Portal App Bar */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur-md px-4 py-3 shadow-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
              className="lg:hidden flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-foreground hover:bg-muted"
              aria-label={mobileDrawerOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileDrawerOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <Link href={`/${locale}/portal`} className="flex items-center gap-2.5">
              <SchoolLogo size={38} className="shrink-0" />
              <div className="hidden sm:block">
                <h1 className="text-sm font-bold text-foreground">
                  {locale === 'am' ? 'የአባላት ፖርታል' : 'Member Portal'}
                </h1>
                <p className="text-[11px] text-primary-700 dark:text-primary-300 font-semibold">
                  {locale === 'am' ? 'አዕማደ ሰላም ሰንበት ትምህርት ቤት' : 'Aemade Selam Sunday School'}
                </p>
              </div>
            </Link>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2.5">
            <Link
              href={`/${locale}`}
              className="hidden md:inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>{locale === 'am' ? 'የህዝብ ድረ-ገጽ' : 'Public Site'}</span>
            </Link>

            {/* Notification Bell with Badge */}
            <Link
              href={`/${locale}/portal/notifications`}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-foreground hover:bg-muted transition-colors"
              aria-label={`Notifications (${unreadCount} unread)`}
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-xs animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            <LanguageSwitcher currentLocale={locale as 'am' | 'en'} />

            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-foreground hover:bg-muted transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 text-secondary" />
              ) : (
                <Moon className="h-4 w-4 text-primary" />
              )}
            </button>

            {/* User status & Logout */}
            <div className="flex items-center gap-2 pl-1 border-l border-border/80">
              <button
                type="button"
                onClick={logout}
                className="flex items-center gap-1.5 rounded-xl border border-destructive/30 px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors min-h-[40px]"
                title={locale === 'am' ? 'ውጣ' : 'Sign Out'}
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{locale === 'am' ? 'ውጣ' : 'Sign Out'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Body with Sidebar */}
      <div className="flex-1 mx-auto max-w-7xl w-full flex">
        {/* Desktop Sidebar */}
        <aside
          className="hidden lg:block w-64 shrink-0 border-r border-border bg-card/60 p-4 space-y-6"
          aria-label="Member Navigation"
        >
          {/* User mini profile card */}
          <div className="rounded-2xl border border-border bg-card p-3.5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-sm shrink-0">
              <User className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-foreground truncate">
                {user?.member?.firstName
                  ? `${user.member.firstName} ${user.member.fatherName}`
                  : user?.email || user?.phone || 'የሰንበት ት/ቤት አባል'}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                {user?.member?.memberNo || 'አባል (Member)'}
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {portalNav.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors min-h-[42px] ${
                    active
                      ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                      : 'text-foreground/80 hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                        active
                          ? 'bg-white text-primary'
                          : 'bg-red-600 text-white'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileDrawerOpen && (
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden">
            <div className="fixed inset-y-0 left-0 w-72 bg-card p-4 shadow-xl space-y-6 flex flex-col justify-between overflow-y-auto">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Cross className="h-5 w-5 text-primary" />
                    <span className="font-bold text-sm">{t('title')}</span>
                  </div>
                  <button
                    onClick={() => setMobileDrawerOpen(false)}
                    className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
                    aria-label="Close drawer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <nav className="space-y-1">
                  {portalNav.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileDrawerOpen(false)}
                        className={`flex items-center justify-between px-3 py-3 rounded-xl text-sm font-medium min-h-[48px] ${
                          active
                            ? 'bg-primary text-primary-foreground font-semibold'
                            : 'text-foreground hover:bg-muted'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className="h-5 w-5 shrink-0" />
                          <span>{item.label}</span>
                        </div>
                        {item.badge !== undefined && (
                          <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-xs font-bold">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={logout}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-destructive px-4 py-3 text-sm font-semibold text-destructive min-h-[48px]"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{locale === 'am' ? 'ውጣ' : 'Sign Out'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <main id="main-content" className="flex-1 p-4 md:p-8 min-w-0" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
