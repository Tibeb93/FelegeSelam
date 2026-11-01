'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Sun,
  Moon,
  ShieldCheck,
  Lock,
  Globe,
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
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const navLinks = [
    { href: `/${locale}#hero`, label: t('navHome'), icon: Church, sectionId: 'hero' },
    { href: `/${locale}#about`, label: t('navAbout'), icon: Info, sectionId: 'about' },
    { href: `/${locale}/news`, label: t('navNews'), icon: Newspaper },
    { href: `/${locale}/mezmur`, label: t('navMezmur'), icon: Music },
    { href: `/${locale}#calendar`, label: t('navCalendar'), icon: Calendar, sectionId: 'calendar' },
    { href: `/${locale}/courses`, label: t('navCourses'), icon: BookOpen },
    { href: `/${locale}#contact`, label: t('navContact'), icon: Phone, sectionId: 'contact' },
  ];

  // Helper for language switch without full reload
  const getRedirectPath = (targetLocale: string) => {
    if (!pathname) return `/${targetLocale}`;
    const segments = pathname.split('/');
    segments[1] = targetLocale;
    return segments.join('/') || `/${targetLocale}`;
  };

  const handleLanguageSwitch = (targetLocale: string) => {
    document.cookie = `NEXT_LOCALE=${targetLocale}; path=/; max-age=31536000; SameSite=Lax`;
  };

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

  // Lock body scroll and focus management when mobile drawer opens
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      // Auto focus close button in drawer
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 50);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  // Close drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

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

    const sectionIds = ['hero', 'quick-links', 'about', 'courses', 'mezmur', 'calendar', 'contact'];
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
    <>
      {/* 
        ========================================================================
        MAIN STICKY HEADER
        - Desktop: Height ~80px, Logo + 2-line brand (no wrap), 7 nav items, controls
        - Mobile (<1024px): Height 64px, 1 row, 40px logo, short name, 44x44 hamburger
        ========================================================================
      */}
      <header
        role="banner"
        className="sticky top-0 z-40 w-full h-16 lg:h-auto bg-[#0F4C81] text-white shadow-[0_2px_8px_rgba(10,46,82,0.25)] border-b border-white/10 transition-colors"
      >
        {/* DESKTOP HEADER (1024px and wider) */}
        <div className="hidden lg:flex container mx-auto items-center justify-between px-6 py-3 min-h-[76px] gap-3">
          {/* Brand: 2 lines without text-wrapping */}
          <Link
            href={`/${locale}`}
            prefetch={true}
            onClick={(e) => handleLinkClick(e, `/${locale}#hero`, 'hero')}
            title={`${siteIdentity.schoolName} - ${siteIdentity.churchName}`}
            className="flex items-center gap-3.5 group focus:outline-none focus:ring-2 focus:ring-[#F2B233] rounded-xl p-1 shrink-0"
          >
            <div className="w-12 h-12 rounded-full border-[3px] border-white ring-2 ring-[#F2B233] overflow-hidden shrink-0 flex items-center justify-center bg-[#0A2E52] shadow-sm">
              <SchoolLogo size={48} />
            </div>
            <div className="flex flex-col text-left justify-center">
              <span className="text-base xl:text-lg font-bold text-white group-hover:text-[#E8F1FB] transition-colors leading-tight whitespace-nowrap">
                {siteIdentity.schoolName}
              </span>
              <span className="text-xs font-medium text-[#F2B233] leading-tight whitespace-nowrap">
                {siteIdentity.churchName}
                <span className="sr-only"> ({siteIdentity.combinedLine})</span>
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links (7 items) */}
          <nav className="flex items-center gap-1 xl:gap-1.5" aria-label="Main Navigation">
            {navLinks.map((link) => {
              const active = isActive(link.href, link.sectionId);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch={true}
                  onClick={(e) => handleLinkClick(e, link.href, link.sectionId)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all min-h-[44px] ${
                    active
                      ? 'bg-[#1E78C8] text-white shadow-xs'
                      : 'text-white/90 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <link.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="whitespace-nowrap">{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Desktop Controls: Language switch, Theme toggle, Member Portal CTA, Admin entrance */}
          <div className="flex items-center gap-3 shrink-0">
            <LanguageSwitcher currentLocale={locale as 'am' | 'en'} />

            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white hover:bg-white/20 transition-colors shadow-xs"
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
                <span>{locale === 'am' ? 'የእኔ ፖርታል' : 'My Portal'}</span>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href={`/${locale}/portal`}
                  className="flex items-center gap-2 rounded-xl bg-[#F2B233] px-4 py-2 text-sm font-bold text-[#0F2438] shadow-md hover:bg-[#e0a42b] transition-all min-h-[44px]"
                >
                  <ShieldCheck className="h-4 w-4 text-[#0F2438]" aria-hidden="true" />
                  <span>{locale === 'am' ? 'የአባላት ፖርታል' : 'Members Portal'}</span>
                </Link>

                <Link
                  href={`/${locale}/admin/login`}
                  className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white/90 hover:bg-white/20 transition-all min-h-[40px]"
                  title={locale === 'am' ? 'የአስተዳደር መግቢያ' : 'Admin Login'}
                >
                  <Lock className="h-3.5 w-3.5 text-white/80" aria-hidden="true" />
                  <span className="hidden xl:inline">{locale === 'am' ? 'አስተዳደር' : 'Admin'}</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* 
          MOBILE HEADER (below 1024px)
          - One single row, 64px high (h-16), sticky, no text wrapping
          - Left: 40px round logo with gold ring, short school name (Amharic: አዕማደ ሰላም / English: Aemade Selam)
          - Right: 44x44 hamburger button ONLY
        */}
        <div className="flex lg:hidden items-center justify-between h-16 px-4 pt-[env(safe-area-inset-top,0px)] max-w-full">
          {/* Left: 40px Logo + Short School Name on 1 Line */}
          <Link
            href={`/${locale}`}
            prefetch={true}
            onClick={(e) => handleLinkClick(e, `/${locale}#hero`, 'hero')}
            title={siteIdentity.schoolName}
            className="flex items-center gap-2.5 min-w-0 focus:outline-none focus:ring-2 focus:ring-[#F2B233] rounded-lg p-0.5"
          >
            <div className="w-10 h-10 rounded-full border-[3px] border-white ring-2 ring-[#F2B233] overflow-hidden shrink-0 flex items-center justify-center bg-[#0A2E52] shadow-sm">
              <SchoolLogo size={40} />
            </div>
            <span
              data-testid="mobile-header-short-name"
              className="text-[17px] font-bold text-white whitespace-nowrap truncate max-w-[210px] sm:max-w-xs"
            >
              {siteIdentity.shortName}
            </span>
          </Link>

          {/* Right: 44x44 Hamburger Button */}
          <button
            type="button"
            data-testid="mobile-menu-trigger"
            onClick={() => setMobileMenuOpen(true)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-white/12 border border-white/15 text-white hover:bg-white/20 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-[#F2B233]"
            aria-label="Open navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            <Menu className="h-6 w-6 text-white" aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* 
        ========================================================================
        MOBILE MENU DRAWER (hamburger)
        - Slides in from right: width 330px (max 85%), background #0A2E52, 200ms ease
        - Backdrop overlay (60% dark)
        - Top row: 40px logo, short school name, 44x44 close button
        - Menu rows: 52px high, radius 12px, active row in #1E78C8
        - Bottom area: Segmented language switch (44px) + dark toggle (44x44)
          followed by full-width gold Members Portal button (52px)
        ========================================================================
      */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Mobile Navigation Menu">
          {/* Dark Backdrop Overlay */}
          <div
            data-testid="mobile-drawer-backdrop"
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity duration-200"
            aria-hidden="true"
          />

          {/* Slide-in Drawer Container */}
          <div
            ref={drawerRef}
            data-testid="mobile-drawer-container"
            className="fixed top-0 right-0 z-50 h-full w-[330px] max-w-[85vw] bg-[#0A2E52] p-4 flex flex-col justify-between shadow-2xl transition-transform duration-200 ease-in-out text-white overflow-y-auto"
          >
            {/* Top Row: Logo, Short Name, Close Button */}
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/15">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-full border-[3px] border-white ring-2 ring-[#F2B233] overflow-hidden shrink-0 flex items-center justify-center bg-[#0F4C81] shadow-sm">
                    <SchoolLogo size={40} />
                  </div>
                  <span className="text-[17px] font-bold text-white whitespace-nowrap truncate max-w-[180px]">
                    {siteIdentity.shortName}
                  </span>
                </div>

                <button
                  ref={closeButtonRef}
                  type="button"
                  data-testid="mobile-drawer-close"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-white/10 hover:bg-white/15 active:scale-95 text-white transition-all focus:outline-none focus:ring-2 focus:ring-[#F2B233]"
                  aria-label="Close navigation menu"
                >
                  <X className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>

              {/* Menu Navigation Rows (52px high, 12px radius, active in #1E78C8) */}
              <nav className="mt-4 flex flex-col gap-1.5" aria-label="Mobile Drawer Navigation">
                {navLinks.map((link) => {
                  const active = isActive(link.href, link.sectionId);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      prefetch={true}
                      onClick={(e) => handleLinkClick(e, link.href, link.sectionId)}
                      className={`flex items-center gap-3 px-3.5 h-[52px] rounded-[12px] text-base font-semibold transition-all ${
                        active
                          ? 'bg-[#1E78C8] text-white shadow-sm'
                          : 'text-white/90 hover:bg-white/10 active:bg-white/15'
                      }`}
                    >
                      <link.icon className="h-[22px] w-[22px] shrink-0" aria-hidden="true" />
                      <span className="whitespace-nowrap">{link.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Bottom Controls Area: Language + Theme in one row, then Gold Portal Button */}
            <div className="mt-6 pt-4 border-t border-white/15 flex flex-col gap-3">
              {/* Row 1: Segmented Language Switch + Dark Mode Button */}
              <div className="flex items-center gap-2">
                {/* Segmented language pill (44px high, #D6E0EA bg, selected option navy #0A2E52 with white text) */}
                <div className="flex-1 flex items-center h-11 rounded-full bg-[#D6E0EA] p-1 shadow-inner">
                  <Globe className="h-4 w-4 text-[#0A2E52] ml-1.5 mr-1 shrink-0" aria-hidden="true" />
                  <Link
                    href={getRedirectPath('am')}
                    scroll={false}
                    onClick={() => handleLanguageSwitch('am')}
                    className={`flex-1 flex h-9 items-center justify-center rounded-full text-xs font-bold transition-all ${
                      locale === 'am'
                        ? 'bg-[#0A2E52] text-white shadow-sm'
                        : 'text-[#0A2E52] hover:bg-black/5'
                    }`}
                  >
                    አማርኛ
                  </Link>
                  <Link
                    href={getRedirectPath('en')}
                    scroll={false}
                    onClick={() => handleLanguageSwitch('en')}
                    className={`flex-1 flex h-9 items-center justify-center rounded-full text-xs font-bold transition-all ${
                      locale === 'en'
                        ? 'bg-[#0A2E52] text-white shadow-sm'
                        : 'text-[#0A2E52] hover:bg-black/5'
                    }`}
                  >
                    EN
                  </Link>
                </div>

                {/* Dark Mode Button (44x44, rounded 12px) */}
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-white/10 border border-white/15 text-white hover:bg-white/15 active:scale-95 transition-all shadow-xs focus:outline-none focus:ring-2 focus:ring-[#F2B233]"
                  aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
                >
                  {theme === 'dark' ? (
                    <Sun className="h-5 w-5 text-[#F2B233]" aria-hidden="true" />
                  ) : (
                    <Moon className="h-5 w-5 text-white" aria-hidden="true" />
                  )}
                </button>
              </div>

              {/* Row 2: Full-width Gold Members Portal Button (52px high, gold #F2B233, dark text #0F2438, bold) */}
              <Link
                href={user ? `/${locale}/portal` : `/${locale}/portal`}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 h-[52px] w-full rounded-[12px] bg-[#F2B233] text-[#0F2438] font-bold text-base shadow-md hover:bg-[#e0a42b] active:scale-[0.99] transition-all"
              >
                <ShieldCheck className="h-5 w-5 text-[#0F2438]" aria-hidden="true" />
                <span>
                  {user
                    ? locale === 'am'
                      ? 'የእኔ ፖርታል'
                      : 'My Portal'
                    : locale === 'am'
                    ? 'የአባላት ፖርታል'
                    : 'Members Portal'}
                </span>
              </Link>

              {/* Small Admin Login Link in Drawer Footer */}
              <Link
                href={`/${locale}/admin/login`}
                onClick={() => setMobileMenuOpen(false)}
                className="text-center text-xs text-white/60 hover:text-white py-1 transition-colors"
              >
                {locale === 'am' ? 'የአስተዳደር መግቢያ (Staff)' : 'Admin Login (Staff)'}
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
