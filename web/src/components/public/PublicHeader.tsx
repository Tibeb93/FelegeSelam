'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Church,
  Menu,
  X,
  BookOpen,
  Music,
  Calendar,
  Newspaper,
  Phone,
  Info,
  LogIn,
  Sun,
  Moon,
  ShieldCheck,
} from 'lucide-react';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { useTheme } from '../../providers/ThemeProvider';
import { useAuth } from '../../providers/AuthProvider';
import { DateDisplay } from '../DateDisplay';

interface PublicHeaderProps {
  locale: string;
}

export function PublicHeader({ locale }: PublicHeaderProps) {
  const t = useTranslations('Website');
  const tCommon = useTranslations('Common');
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: `/${locale}`, label: t('navHome'), icon: Church },
    { href: `/${locale}/about`, label: t('navAbout'), icon: Info },
    { href: `/${locale}/news`, label: t('navNews'), icon: Newspaper },
    { href: `/${locale}/mezmur`, label: t('navMezmur'), icon: Music },
    { href: `/${locale}/calendar`, label: t('navCalendar'), icon: Calendar },
    { href: `/${locale}/courses`, label: t('navCourses'), icon: BookOpen },
    { href: `/${locale}/contact`, label: t('navContact'), icon: Phone },
  ];

  const isActive = (href: string) => {
    if (href === `/${locale}`) {
      return pathname === href || pathname === `/${locale}/`;
    }
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 transition-colors shadow-sm">
      {/* Top micro-bar for church details & quick actions */}
      <div className="hidden border-b border-border/40 bg-muted/40 py-1.5 px-4 sm:block">
        <div className="container mx-auto flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="font-medium text-foreground">
              {locale === 'am' ? 'ደብረ ሰላም ቅዱስ እስጢፋኖስ' : 'Debre Selam Saint Stephen'}
            </span>
            <span aria-hidden="true">•</span>
            <span>{locale === 'am' ? 'ስልክ: +251 91 123 4567' : 'Tel: +251 91 123 4567'}</span>
          </div>
          <div className="flex items-center gap-4">
            <DateDisplay locale={locale as 'am' | 'en'} />
            <span aria-hidden="true">•</span>
            <span className="text-secondary font-semibold">
              {locale === 'am' ? 'በሃይማኖት ጽኑ፥ በመልካም ምግባር አብሩ' : 'Firm in Faith, Shining in Good Deeds'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        {/* Brand / Logo */}
        <Link
          href={`/${locale}`}
          className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-primary rounded-xl p-1"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-secondary shadow-md group-hover:scale-105 transition-transform">
            <Church className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold uppercase tracking-wider text-secondary">
              {tCommon('churchName')}
            </span>
            <span className="text-base font-bold text-foreground group-hover:text-primary transition-colors sm:text-lg">
              {tCommon('schoolName')}
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1" aria-label="Main Navigation">
          {navLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                  active
                    ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                    : 'text-foreground/85 hover:bg-muted hover:text-foreground'
                }`}
              >
                <link.icon className="h-4 w-4" aria-hidden="true" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Controls & CTA buttons */}
        <div className="hidden lg:flex items-center gap-3">
          <LanguageSwitcher currentLocale={locale as 'am' | 'en'} />

          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card text-foreground hover:bg-muted transition-colors shadow-xs"
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-secondary" aria-hidden="true" />
            ) : (
              <Moon className="h-4 w-4 text-primary" aria-hidden="true" />
            )}
          </button>

          {user ? (
            <Link
              href={`/${locale}/portal`}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-md hover:bg-primary/90 transition-all min-h-[44px]"
            >
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              <span>{t('navPortal')}</span>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href={`/${locale}/login`}
                className="flex items-center gap-1.5 rounded-xl border border-primary/40 px-3.5 py-2 text-sm font-semibold text-foreground hover:bg-primary/10 transition-colors min-h-[44px]"
              >
                <LogIn className="h-4 w-4 text-primary" aria-hidden="true" />
                <span>{t('navLogin')}</span>
              </Link>
              <Link
                href={`/${locale}/register`}
                className="flex items-center gap-1.5 rounded-xl bg-secondary px-3.5 py-2 text-sm font-semibold text-secondary-foreground shadow-sm hover:bg-secondary/90 transition-colors min-h-[44px]"
              >
                <span>{t('navRegister')}</span>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile controls & hamburger toggle */}
        <div className="flex items-center gap-2 lg:hidden">
          <LanguageSwitcher currentLocale={locale as 'am' | 'en'} />

          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card text-foreground hover:bg-muted"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-secondary" />
            ) : (
              <Moon className="h-4 w-4 text-primary" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card text-foreground hover:bg-muted"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="border-b border-border bg-card p-4 lg:hidden shadow-lg animate-in slide-in-from-top-2">
          <nav className="flex flex-col gap-1.5">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-base font-medium min-h-[48px] ${
                    active
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <link.icon className="h-5 w-5" aria-hidden="true" />
                  <span>{link.label}</span>
                </Link>
              );
            })}

            <div className="mt-3 pt-3 border-t border-border flex flex-col gap-2">
              {user ? (
                <Link
                  href={`/${locale}/portal`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-base font-semibold text-primary-foreground min-h-[48px]"
                >
                  <ShieldCheck className="h-5 w-5" />
                  <span>{t('navPortal')}</span>
                </Link>
              ) : (
                <>
                  <Link
                    href={`/${locale}/login`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-xl border border-primary px-4 py-3 text-base font-semibold text-foreground min-h-[48px]"
                  >
                    <LogIn className="h-5 w-5 text-primary" />
                    <span>{t('navLogin')}</span>
                  </Link>
                  <Link
                    href={`/${locale}/register`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-3 text-base font-semibold text-secondary-foreground min-h-[48px]"
                  >
                    <span>{t('navRegister')}</span>
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
