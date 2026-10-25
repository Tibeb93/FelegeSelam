import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
});

const ADMIN_ROLES = ['super_admin', 'admin', 'teacher', 'content_manager'];

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Extract locale and path segments
  const segments = pathname.split('/').filter(Boolean);
  const maybeLocale = segments[0];
  const currentLocale = locales.includes(maybeLocale as any)
    ? maybeLocale
    : defaultLocale;

  // Determine path without locale prefix
  const pathWithoutLocale = locales.includes(maybeLocale as any)
    ? '/' + segments.slice(1).join('/')
    : pathname;

  // Check separate Admin session cookies (fs_admin_session, fs_admin_refresh_token)
  const adminSessionCookie = request.cookies.get('fs_admin_session')?.value;
  const adminRefreshCookie = request.cookies.get('fs_admin_refresh_token')?.value;

  let adminSession: { role?: string; status?: string } | null = null;
  if (adminSessionCookie) {
    try {
      adminSession = JSON.parse(adminSessionCookie);
    } catch {
      adminSession = null;
    }
  }

  const isAdminAuthenticated = Boolean(
    (adminSession && adminSession.role && ADMIN_ROLES.includes(adminSession.role)) ||
      adminRefreshCookie,
  );
  const adminRole = adminSession?.role || (adminRefreshCookie ? 'admin' : null);

  // Check separate Member session cookies (fs_session, fs_refresh_token)
  const memberSessionCookie = request.cookies.get('fs_session')?.value;
  const memberRefreshCookie = request.cookies.get('fs_refresh_token')?.value;

  let memberSession: { role?: string; status?: string } | null = null;
  if (memberSessionCookie) {
    try {
      memberSession = JSON.parse(memberSessionCookie);
    } catch {
      memberSession = null;
    }
  }

  const isMemberAuthenticated = Boolean(memberSession || memberRefreshCookie);

  // 1. Staff Admin Login Page: /admin/login
  if (pathWithoutLocale === '/admin/login') {
    if (isAdminAuthenticated && adminRole) {
      if (adminRole === 'teacher') {
        return NextResponse.redirect(new URL(`/${currentLocale}/admin/attendance`, request.url));
      } else if (adminRole === 'content_manager') {
        return NextResponse.redirect(new URL(`/${currentLocale}/admin/posts`, request.url));
      }
      return NextResponse.redirect(new URL(`/${currentLocale}/admin`, request.url));
    }
    // Allow unauthenticated staff to access /admin/login
    return intlMiddleware(request);
  }

  // 2. Protect Admin routes: /admin/* (Staff door only)
  if (pathWithoutLocale.startsWith('/admin')) {
    if (!isAdminAuthenticated || !adminRole || !ADMIN_ROLES.includes(adminRole)) {
      const adminLoginUrl = new URL(`/${currentLocale}/admin/login`, request.url);
      adminLoginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(adminLoginUrl);
    }
  }

  // 3. Protect Member Portal routes: /portal/* (Member door)
  if (pathWithoutLocale.startsWith('/portal')) {
    if (!isMemberAuthenticated) {
      const loginUrl = new URL(`/${currentLocale}/login`, request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 4. Member auth pages (login, register): redirect already authenticated members to portal
  if (
    (pathWithoutLocale === '/login' || pathWithoutLocale === '/register') &&
    isMemberAuthenticated
  ) {
    return NextResponse.redirect(new URL(`/${currentLocale}/portal`, request.url));
  }

  // Continue through next-intl localization middleware
  return intlMiddleware(request);
}

export const config = {
  matcher: ['/', '/(am|en)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)'],
};
