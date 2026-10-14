'use client';

import React, { useState } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopBar } from './AdminTopBar';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { X } from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  locale: string;
}

export function AdminLayout({ children, locale }: AdminLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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
    </div>
  );
}
