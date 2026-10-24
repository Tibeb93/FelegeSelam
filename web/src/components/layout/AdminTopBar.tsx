'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../providers/AuthProvider';
import { useTheme } from '../../providers/ThemeProvider';
import { LanguageSwitcher } from '../LanguageSwitcher';
import {
  Menu,
  Sun,
  Moon,
  ChevronRight,
  LogOut,
  Shield,
} from 'lucide-react';

const BREADCRUMB_MAP: Record<string, { am: string; en: string }> = {
  admin: { am: 'አስተዳደር', en: 'Admin' },
  members: { am: 'አባላት', en: 'Members' },
  courses: { am: 'ትምህርቶች', en: 'Courses' },
  attendance: { am: 'የመገኘት መዝገብ', en: 'Attendance' },
  grades: { am: 'ውጤቶችና ምስክር', en: 'Grades & Certs' },
  mezmur: { am: 'መዝሙራት', en: 'Mezmur' },
  posts: { am: 'ዕለታዊ መልዕክቶች', en: 'Posts' },
  events: { am: 'መርሐ-ግብሮች', en: 'Events' },
  forms: { am: 'የመስመር ላይ ቅጾች', en: 'Online Forms' },
  contributions: { am: 'ስጦታና ክፍያዎች', en: 'Contributions' },
  reports: { am: 'ሪፖርቶች', en: 'Reports' },
  'audit-logs': { am: 'የክትትል መዝገብ', en: 'Audit Logs' },
  settings: { am: 'ማስተካከያዎች', en: 'Settings' },
  backups: { am: 'የውሂብ ምትኬ', en: 'Backups' },
  portal: { am: 'የአባላት ፖርታል', en: 'Portal' },
};

interface AdminTopBarProps {
  onToggleMobileMenu: () => void;
  locale: string;
}

export function AdminTopBar({ onToggleMobileMenu, locale }: AdminTopBarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Generate breadcrumb items from URL
  const segments = (pathname || '')
    .split('/')
    .filter(Boolean)
    .filter((s) => s !== 'am' && s !== 'en');

  const initials =
    user?.email?.substring(0, 2).toUpperCase() ||
    user?.phone?.substring(user?.phone?.length - 2) ||
    'AD';

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-card/90 px-4 backdrop-blur-md md:px-6">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-foreground hover:bg-muted md:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Breadcrumb Trail */}
        <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1.5 text-xs md:text-sm text-muted-foreground">
          <Link
            href={`/${locale}/admin`}
            className="hover:text-primary transition-colors font-medium"
          >
            {locale === 'am' ? 'አስተዳደር' : 'Admin'}
          </Link>

          {segments.slice(1).map((segment, index) => {
            const isLast = index === segments.slice(1).length - 1;
            const fullPath = `/${locale}/${segments.slice(0, index + 2).join('/')}`;
            const labelObj = BREADCRUMB_MAP[segment] || {
              am: segment,
              en: segment,
            };
            const label = locale === 'am' ? labelObj.am : labelObj.en;

            return (
              <React.Fragment key={segment}>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
                {isLast ? (
                  <span className="font-semibold text-foreground">
                    {label}
                  </span>
                ) : (
                  <Link
                    href={fullPath}
                    className="hover:text-primary transition-colors"
                  >
                    {label}
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </div>

      {/* Right: Controls (Language, Theme, User Menu) */}
      <div className="flex items-center gap-3">
        {/* Language Switcher */}
        <LanguageSwitcher currentLocale={locale} />

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground hover:bg-muted transition-colors shadow-sm"
          aria-label="Toggle light and dark theme"
          title={theme === 'dark' ? 'ቀይር ወደ ብሩህ ገጽታ (Light Mode)' : 'ቀይር ወደ ጨለማ ገጽታ (Dark Mode)'}
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4 text-[#F2B233]" />
          ) : (
            <Moon className="h-4 w-4 text-[#0F4C81]" />
          )}
        </button>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 rounded-full border border-border p-1 hover:bg-muted/50 transition-colors"
            aria-label="User profile menu"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0F4C81] font-bold text-xs text-white">
              {initials}
            </div>
            <div className="hidden text-left lg:block pr-1">
              <p className="max-w-[120px] truncate text-xs font-semibold text-foreground">
                {user?.email || user?.phone || 'Administrator'}
              </p>
              <p className="text-[10px] text-[#0F4C81] dark:text-[#F2B233] font-bold uppercase tracking-wider">
                {user?.role?.name || 'admin'}
              </p>
            </div>
          </button>

          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-border bg-card p-2 shadow-xl animate-in zoom-in-95">
                <div className="border-b border-border p-2 pb-3">
                  <p className="truncate text-xs font-semibold text-foreground">
                    {user?.email || user?.phone || 'Administrator'}
                  </p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <Shield className="h-3 w-3 text-[#0F4C81] dark:text-[#F2B233]" />
                    <span className="text-[11px] text-muted-foreground uppercase font-medium">
                      {user?.role?.name || 'admin'}
                    </span>
                  </div>
                </div>

                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>{locale === 'am' ? 'ውጣ' : 'Sign Out'}</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
