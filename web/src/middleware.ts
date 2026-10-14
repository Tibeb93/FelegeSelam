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

  // Check session cookie
  const sessionCookie = request.cookies.get('fs_session')?.value;
  const refreshTokenCookie = request.cookies.get('fs_refresh_token')?.value;

  let session: { role?: string; status?: string } | null = null;
  if (sessionCookie) {
    try {
      session = JSON.parse(sessionCookie);
    } catch {
      session = null;
    }
  }

  const isAuthenticated = Boolean(session || refreshTokenCookie);
  const userRole = session?.role || (refreshTokenCookie ? 'member' : null);

  // 1. Protect Admin routes: /admin/*
  if (pathWithoutLocale.startsWith('/admin')) {
    if (!isAuthenticated) {
      const loginUrl = new URL(`/${currentLocale}/login`, request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (userRole && !ADMIN_ROLES.includes(userRole)) {
      // Member trying to access admin dashboard -> redirect to portal
      return NextResponse.redirect(new URL(`/${currentLocale}/portal`, request.url));
    }
  }

  // 2. Protect Member Portal routes: /portal/*
  if (pathWithoutLocale.startsWith('/portal')) {
    if (!isAuthenticated) {
      const loginUrl = new URL(`/${currentLocale}/login`, request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 3. Auth pages (login, register): redirect already authenticated users to appropriate area
  if (
    (pathWithoutLocale === '/login' || pathWithoutLocale === '/register') &&
    isAuthenticated &&
    userRole
  ) {
    if (ADMIN_ROLES.includes(userRole)) {
      return NextResponse.redirect(new URL(`/${currentLocale}/admin`, request.url));
    } else {
      return NextResponse.redirect(new URL(`/${currentLocale}/portal`, request.url));
    }
  }

  // Continue through next-intl localization middleware
  return intlMiddleware(request);
}

export const config = {
  matcher: ['/', '/(am|en)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)'],
};
