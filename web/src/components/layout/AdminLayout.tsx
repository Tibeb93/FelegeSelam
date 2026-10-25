'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopBar } from './AdminTopBar';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { X, Clock, AlertTriangle, LogOut } from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  locale: string;
}

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const WARNING_TIMEOUT_MS = 28 * 60 * 1000; // 28 minutes (warning 2 mins before)

export function AdminLayout({ children, locale }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Inactivity timeout state
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(120);

  const lastActivityRef = useRef<number>(Date.now());
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const isLoginPage = pathname?.includes('/admin/login');

  const handleAdminLogout = useCallback(async (reason = 'inactivity') => {
    try {
      await fetch('/api/auth/admin/logout', { method: 'POST' });
    } catch {
      // Continue redirect even if network fails
    }
    setShowInactivityWarning(false);
    router.push(`/${locale}/admin/login?reason=${reason}`);
    router.refresh();
  }, [locale, router]);

  const resetActivityTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (showInactivityWarning) {
      setShowInactivityWarning(false);
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    }
  }, [showInactivityWarning]);

  // Set up inactivity detection
  useEffect(() => {
    if (isLoginPage) return;

    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    let throttleTimeout: NodeJS.Timeout | null = null;

    const onUserActivity = () => {
      // Only throttle resets when warning is not currently open
      if (!showInactivityWarning) {
        if (!throttleTimeout) {
          throttleTimeout = setTimeout(() => {
            lastActivityRef.current = Date.now();
            throttleTimeout = null;
          }, 1000);
        }
      }
    };

    activityEvents.forEach((event) => {
      window.addEventListener(event, onUserActivity, { passive: true });
    });

    const checkInterval = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;

      if (elapsed >= INACTIVITY_TIMEOUT_MS) {
        // Exceeded 30 minutes -> log out immediately
        clearInterval(checkInterval);
        handleAdminLogout('inactivity');
      } else if (elapsed >= WARNING_TIMEOUT_MS && !showInactivityWarning) {
        // Exceeded 28 minutes -> trigger warning dialog
        const remaining = Math.max(0, Math.ceil((INACTIVITY_TIMEOUT_MS - elapsed) / 1000));
        setSecondsRemaining(remaining);
        setShowInactivityWarning(true);
      }
    }, 2000);

    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, onUserActivity);
      });
      clearInterval(checkInterval);
      if (throttleTimeout) clearTimeout(throttleTimeout);
    };
  }, [isLoginPage, showInactivityWarning, handleAdminLogout]);

  // Countdown timer when warning modal is active
  useEffect(() => {
    if (showInactivityWarning) {
      countdownIntervalRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
            handleAdminLogout('inactivity');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    }

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [showInactivityWarning, handleAdminLogout]);

  // If this is the standalone Admin Login page, render directly without the sidebar/topbar shell
  if (isLoginPage) {
    return <>{children}</>;
  }

  const formatCountdown = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Desktop Persistent Sidebar */}
      <div className="hidden md:flex">
        <AdminSidebar
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
          locale={locale}
        />
      </div>

      {/* Mobile Drawer Overlay & Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          />

          {/* Drawer Sheet */}
          <div className="relative flex w-72 flex-col bg-card shadow-2xl animate-in slide-in-from-left duration-200">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 z-50 flex h-8 w-8 items-center justify-center rounded-lg border border-border text-foreground hover:bg-muted"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
            <AdminSidebar
              collapsed={false}
              onToggleCollapse={() => {}}
              locale={locale}
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminTopBar
          onToggleMobileMenu={() => setMobileOpen(true)}
          locale={locale}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <ErrorBoundary>
            <div className="mx-auto max-w-7xl">{children}</div>
          </ErrorBoundary>
        </main>
      </div>

      {/* Inactivity Warning Dialog Modal (30-minute timeout with 2-minute countdown) */}
      {showInactivityWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl text-card-foreground">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  {locale === 'am' ? 'የእንቅስቃሴ ማጣት ማስጠንቀቂያ' : 'Inactivity Warning'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {locale === 'am' ? 'የአስተዳደር ክፍለ-ጊዜዎ ሊያበቃ ነው' : 'Your staff session is about to expire'}
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
              {locale === 'am'
                ? 'ለደህንነት ሲባል ምንም እንቅስቃሴ ካልተገኘ ስርዓቱ ከ30 ደቂቃ በኋላ በራስ-ሰር ይዘጋል። ክፍለ-ጊዜዎን ለማራዘም ከታች ያለውን አዝራር ይጫኑ።'
                : 'For security reasons, your admin session will expire after 30 minutes of inactivity. Click below to remain signed in.'}
            </p>

            {/* Countdown Badge */}
            <div className="flex items-center justify-center gap-2 rounded-xl bg-muted/60 p-3 mb-5 border border-border">
              <Clock className="h-5 w-5 text-amber-500 animate-pulse" />
              <span className="text-xs font-medium text-foreground">
                {locale === 'am' ? 'የሚቀረው ጊዜ፦' : 'Remaining Time:'}
              </span>
              <span className="font-mono text-lg font-bold text-amber-600 dark:text-amber-400">
                {formatCountdown(secondsRemaining)}
              </span>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={resetActivityTimer}
                className="flex-1 rounded-xl bg-[#0F4C81] hover:bg-[#0A2E52] text-white font-bold text-xs py-2.5 px-4 shadow-sm transition-colors text-center"
              >
                {locale === 'am' ? 'እንቅስቃሴውን ቀጥል' : 'Stay Signed In'}
              </button>
              <button
                type="button"
                onClick={() => handleAdminLogout('manual')}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-border hover:bg-muted text-muted-foreground font-semibold text-xs py-2.5 px-4 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>{locale === 'am' ? 'አሁን ውጣ' : 'Sign Out Now'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

