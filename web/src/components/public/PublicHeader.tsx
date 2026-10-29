'use client';

import React, { useState, useEffect } from 'react';
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
  Lock,
} from 'lucide-react';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { useTheme } from '../../providers/ThemeProvider';
import { useAuth } from '../../providers/AuthProvider';
import { SchoolLogo } from '../common/SchoolLogo';
import { useSiteIdentity } from '../../hooks/useSiteIdentity';

interface PublicHeaderProps {
  locale: string;
}

export function PublicHeader({ locale }: PublicHeaderProps) {
  const t = useTranslations('Website');
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const siteIdentity = useSiteIdentity(locale);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('hero');

  const navLinks = [
    { href: `/${locale}#hero`, label: t('navHome'), icon: Church, sectionId: 'hero' },
    { href: `/${locale}#about`, label: t('navAbout'), icon: Info, sectionId: 'about' },
    { href: `/${locale}/courses`, label: t('navCourses'), icon: BookOpen },
    { href: `/${locale}/mezmur`, label: t('navMezmur'), icon: Music },
    { href: `/${locale}#calendar`, label: t('navCalendar'), icon: Calendar, sectionId: 'calendar' },
    { href: `/${locale}/news`, label: t('navNews'), icon: Newspaper },
    { href: `/${locale}#contact`, label: t('navContact'), icon: Phone, sectionId: 'contact' },
  ];

  // Client-side smooth scroll & section jump
  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string, sectionId?: string) => {
    const isHome = pathname === `/${locale}` || pathname === `/${locale}/`;

    if (sectionId && isHome) {
      e.preventDefault();
      const el = document.getElementById(sectionId);
      if (el) {
        const prefersReducedMotion =
          typeof window !== 'undefined' &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        el.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
        window.history.pushState(null, '', `#${sectionId}`);
        setActiveSection(sectionId);

        const heading = el.querySelector('h1, h2, h3, h4') as HTMLElement | null;
        if (heading) {
          heading.setAttribute('tabindex', '-1');
          heading.focus({ preventScroll: true });
        }
      }
      setMobileMenuOpen(false);
    } else {
      setMobileMenuOpen(false);
    }
  };

  // IntersectionObserver scroll-spy and cross-page anchor restoration
  useEffect(() => {
    const isHome = pathname === `/${locale}` || pathname === `/${locale}/`;
    if (!isHome || typeof window === 'undefined') return;

    if (window.location.hash) {
      const id = window.location.hash.replace('#', '');
      const el = document.getElementById(id);
      if (el) {
        setTimeout(() => {
          const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          el.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
          const heading = el.querySelector('h1, h2, h3, h4') as HTMLElement | null;
          if (heading) {
            heading.setAttribute('tabindex', '-1');
            heading.focus({ preventScroll: true });
          }
        }, 120);
      }
    }

    const sectionIds = ['hero', 'about', 'courses', 'mezmur', 'calendar', 'contact'];
    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-20% 0px -60% 0px',
        threshold: 0,
      },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [pathname, locale]);

  const isActive = (href: string, sectionId?: string) => {
    const isHome = pathname === `/${locale}` || pathname === `/${locale}/`;
    if (isHome && sectionId) {
      return activeSection === sectionId;
    }
    if (href === `/${locale}` || href === `/${locale}#hero`) {
      return isHome && activeSection === 'hero';
    }
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0F4C81] text-white shadow-md border-b border-[#0A2E52] transition-colors">
      {/* Main Navigation Bar */}
      <div className="container mx-auto flex items-center justify-between px-4 py-2.5 sm:py-3">
        {/* Brand / Logo: School name with Church name under it */}
        <Link
          href={`/${locale}`}
          prefetch={true}
          onClick={(e) => handleLinkClick(e, `/${locale}#hero`, 'hero')}
          title={`${siteIdentity.schoolName} - ${siteIdentity.churchName}`}
          className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-[#F2B233] rounded-xl p-1"
        >
          <SchoolLogo size={42} />
          <div className="flex flex-col">
            <span className="text-base font-bold text-white group-hover:text-[#E8F1FB] transition-colors sm:text-lg leading-tight">
              {siteIdentity.schoolName}
            </span>
            <span className="text-[11px] font-medium text-[#F2B233] leading-tight">
              {siteIdentity.churchName}
              <span className="sr-only"> ({siteIdentity.combinedLine})</span>
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1" aria-label="Main Navigation">
          {navLinks.map((link) => {
            const active = isActive(link.href, link.sectionId);
            return (
              <Link
                key={link.href}
                href={link.href}
                prefetch={true}
                onClick={(e) => handleLinkClick(e, link.href, link.sectionId)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                  active
                    ? 'bg-[#1E78C8] text-white font-semibold shadow-xs'
                    : 'text-white/85 hover:bg-white/10 hover:text-white'
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
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white hover:bg-white/20 transition-colors shadow-xs"
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-[#F2B233]" aria-hidden="true" />
            ) : (
              <Moon className="h-4 w-4 text-white" aria-hidden="true" />
            )}
          </button>

          {user ? (
            <Link
              href={`/${locale}/portal`}
              className="flex items-center gap-2 rounded-xl bg-[#F2B233] px-4 py-2 text-sm font-bold text-[#0F2438] shadow-md hover:bg-[#e0a42b] transition-all min-h-[44px]"
            >
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              <span>{t('navPortal')}</span>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href={`/${locale}/login`}
                className="flex items-center gap-1.5 rounded-xl border border-white/30 bg-white/5 px-3 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-white/15 transition-colors min-h-[40px]"
              >
                <LogIn className="h-4 w-4 text-white/90" aria-hidden="true" />
                <span>{t('navLogin')}</span>
              </Link>

              {/* Small Gold Button for Admin Login (Staff Entrance) */}
              <Link
                href={`/${locale}/admin/login`}
                className="flex items-center gap-1.5 rounded-xl bg-[#F2B233] px-3.5 py-2 text-xs sm:text-sm font-bold text-[#0F2438] shadow-sm hover:bg-[#e0a42b] active:scale-[0.98] transition-all min-h-[40px]"
              >
                <Lock className="h-3.5 w-3.5 text-[#0F2438]" aria-hidden="true" />
                <span>{locale === 'am' ? 'የአስተዳደር መግቢያ' : 'Admin Login'}</span>
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
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white hover:bg-white/20"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-[#F2B233]" />
            ) : (
              <Moon className="h-4 w-4 text-white" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white hover:bg-white/20"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="border-b border-[#0A2E52] bg-[#0A2E52] p-4 lg:hidden shadow-xl animate-in slide-in-from-top-2 text-white">
          <nav className="flex flex-col gap-1.5">
            {navLinks.map((link) => {
              const active = isActive(link.href, link.sectionId);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch={true}
                  onClick={(e) => handleLinkClick(e, link.href, link.sectionId)}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-base font-medium min-h-[48px] ${
                    active
                      ? 'bg-[#1E78C8] text-white font-semibold'
                      : 'text-white/85 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <link.icon className="h-5 w-5" aria-hidden="true" />
                  <span>{link.label}</span>
                </Link>
              );
            })}

            <div className="mt-3 pt-3 border-t border-white/15 flex flex-col gap-2">
              {user ? (
                <Link
                  href={`/${locale}/portal`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#F2B233] px-4 py-3 text-base font-bold text-[#0F2438] min-h-[48px]"
                >
                  <ShieldCheck className="h-5 w-5" />
                  <span>{t('navPortal')}</span>
                </Link>
              ) : (
                <>
                  <Link
                    href={`/${locale}/login`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-xl border border-white/30 px-4 py-3 text-base font-semibold text-white min-h-[48px]"
                  >
                    <LogIn className="h-5 w-5 text-white/90" />
                    <span>{t('navLogin')}</span>
                  </Link>
                  <Link
                    href={`/${locale}/admin/login`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#F2B233] px-4 py-3 text-base font-bold text-[#0F2438] min-h-[48px]"
                  >
                    <Lock className="h-5 w-5 text-[#0F2438]" />
                    <span>{locale === 'am' ? 'የአስተዳደር መግቢያ' : 'Admin Login'}</span>
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
