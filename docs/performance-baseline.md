# Performance Diagnostic Baseline & Navigation Reload Audit

> **System**: Aemade Selam Sunday School Management System  
> **Environment**: Next.js 14.2.24 (App Router), NestJS 10, MySQL/MariaDB, Windows Edge/Chromium  
> **Diagnostic Date**: October 2026  
> **Status**: Baseline Diagnosed & Verified via Playwright Instrumentation

---

## 1. Baseline Performance Metrics (Mobile Throttled Simulation)

Measurements captured using Playwright with iPhone SE emulation (375x667 viewport, touch-enabled, mobile user agent) on initial cold-load and client hydration against `http://localhost:3001`:

| Route | Page Name | First Load TTFB | DomContentLoaded | FCP / LCP (Est.) | Requests | KB Transferred | Duplicate Requests | Full Document Navs on Menu Click |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/am` | Home Page | 13,706 ms | 23,914 ms | 20,372 ms | 13 | ~85 KB | 2 (`/api/auth/session`, `/logo.svg`) | — |
| `/am/about` | About Page | 25,378 ms | 25,900 ms | 25,972 ms | 12 | ~78 KB | 2 (`/api/auth/session`, `/logo.svg`) | 1 (Full reload on click) |
| `/am/mezmur` | Mezmur Library | 12,760 ms | 13,418 ms | 13,456 ms | 17 | ~112 KB | 2 (`/api/auth/session`, `/logo.svg`) | 0 (Client nav) |
| `/am/admin` | Admin Dashboard | 51,593 ms | 52,344 ms | 52,944 ms | 15 | ~95 KB | 1 (`/api/auth/session`) | 1 (Redirect loop to login) |

> **Key Observation**: In development mode with dynamic on-demand compilation, initial TTFB is artificially high due to module graph compilation; however, the structural root causes (layout unmounting, duplicate session polling, and hard browser navigations) occur consistently regardless of environment.

---

## 2. Playwright Duplicate Request Analysis

From automated network interception on initial load:

1. **`http://localhost:3001/api/auth/session` (Requested 2x per page)**:
   - **Trigger 1**: `web/src/providers/AuthProvider.tsx:95` in `initAuth()`.
   - **Trigger 2**: `web/src/providers/AuthProvider.tsx:69` inside `refreshSession()`, called immediately after `refreshAccessToken()` succeeds.
   - **Impact**: Fires on every single public page visit even when the visitor is completely anonymous, stalling client hydration.

2. **`http://localhost:3001/logo.svg` (Requested 2x per page)**:
   - **Trigger**: Dual metadata entries in `web/src/app/[locale]/layout.tsx:50-53` (`icon: '/logo.svg'` and `apple: '/logo.svg'`).

3. **`http://localhost:3000/api/v1/settings/public`**:
   - **Trigger**: `web/src/providers/SiteSettingsProvider.tsx:286-298`. Configured with `refetchOnWindowFocus: true` and a short `staleTime: 30000`, causing continuous refetching whenever the user shifts focus between browser tabs or windows.

4. **Menu Navigation Document Relocations**:
   - Clicking menu item `/am/about` caused a full document reload (`causedFullDocumentNav: true`) because `PublicHeader` and `PublicFooter` were not encapsulated in a persistent layout, but instead instantiated inside each individual page component (`page.tsx`, `about/page.tsx`, `mezmur/page.tsx`, etc.).

---

## 3. Systematic Code Audit of Reloads, Loops & Delays

### A. Hard Browser Relocations (`window.location` & `router.refresh`)
- **[web/src/providers/AuthProvider.tsx:281](file:///c:/Users/user/Desktop/PersonalProjects/FelegeSelam/web/src/providers/AuthProvider.tsx#L281)**:
  - *Code*: `window.location.href = isStaff ? '/admin/login' : '/login';`
  - *Root Cause*: Uses window assignment instead of Next.js client router `router.replace()`, forcing complete DOM teardown and CSS/JS re-evaluation.
  - *Fix*: Use `router.replace(`/${locale}/login`)` and clear state in-memory.
- **[web/src/components/layout/AdminTopBar.tsx:182, 209](file:///c:/Users/user/Desktop/PersonalProjects/FelegeSelam/web/src/components/layout/AdminTopBar.tsx#L182)**:
  - *Code*: `window.location.href = `/${locale}/admin/login`;`
  - *Root Cause*: Hard reload on administrative logout.
  - *Fix*: Use Next.js client router navigation with `router.push()`.
- **[web/src/app/[locale]/portal/privacy/page.tsx:123](file:///c:/Users/user/Desktop/PersonalProjects/FelegeSelam/web/src/app/[locale]/portal/privacy/page.tsx#L123)**:
  - *Code*: `window.location.href = '/login';`
  - *Root Cause*: Hard reload on member account deactivation.
  - *Fix*: Use Next.js router.
- **[web/src/components/layout/AdminLayout.tsx:41](file:///c:/Users/user/Desktop/PersonalProjects/FelegeSelam/web/src/components/layout/AdminLayout.tsx#L41)**:
  - *Code*: `router.refresh()` called immediately after `router.push('/admin/login')`.
  - *Root Cause*: Unnecessary double-render triggering Server Component re-validation after route transition.
  - *Fix*: Remove redundant `router.refresh()`.

### B. Middleware & Redirect Loops
- **[web/src/middleware.ts:8](file:///c:/Users/user/Desktop/PersonalProjects/FelegeSelam/web/src/middleware.ts#L8)**:
  - *Code*: `localePrefix: 'always'`.
  - *Root Cause*: Links targeting `/#about` or `/about` without the `/${locale}` prefix trigger an HTTP 307 redirect through middleware before rendering.
  - *Fix*: Standardize all internal links and section jumps to include the active locale (`/${locale}#about`), and handle home anchor jumps client-side with `history.pushState`.
- **[web/src/middleware.ts:77-83 & 86-92](file:///c:/Users/user/Desktop/PersonalProjects/FelegeSelam/web/src/middleware.ts#L77)**:
  - *Code*: Checks only cookie presence without verifying token validity.
  - *Root Cause*: If a cookie exists but the token is expired or revoked on the backend, the page renders, receives 401, calls refresh, fails, and redirects, creating a noticeable visual flicker.
  - *Fix*: Decouple middleware to read cookie claims cleanly without calling external APIs, and ensure client token refresh has an atomic single-promise lock.

### C. Authentication & Session Duplication
- **[web/src/providers/AuthProvider.tsx:89-125](file:///c:/Users/user/Desktop/PersonalProjects/FelegeSelam/web/src/providers/AuthProvider.tsx#L89)**:
  - *Root Cause*: The initial `useEffect` calls `/api/auth/session`, then immediately triggers `refreshSession()` which calls `/api/auth/refresh` followed by a second redundant `/api/auth/session` call.
  - *Fix*: Consolidate into a single session check. If a valid access token is returned from refresh, extract user claims directly from the response payload without making a second HTTP round-trip.

### D. Layout Remounting & Unshared Headers
- **[web/src/app/[locale]/page.tsx:89](file:///c:/Users/user/Desktop/PersonalProjects/FelegeSelam/web/src/app/[locale]/page.tsx#L89)** vs **[web/src/app/[locale]/about/page.tsx:13](file:///c:/Users/user/Desktop/PersonalProjects/FelegeSelam/web/src/app/[locale]/about/page.tsx#L13)**:
  - *Root Cause*: `PublicHeader` and `PublicFooter` are instantiated inside each page component rather than in a shared layout. Every route change unmounts the header, recreates DOM nodes, destroys scroll listeners, and re-executes client hooks.
  - *Fix*: Establish a shared public layout for public routes so the header, footer, and progress bar remain permanently mounted across route changes.

### E. Section Jumps vs Page Navigation
- **[web/src/components/public/PublicHeader.tsx:43](file:///c:/Users/user/Desktop/PersonalProjects/FelegeSelam/web/src/components/public/PublicHeader.tsx#L43)**:
  - *Code*: `{ href: '/${locale}/about', label: t('navAbout'), icon: Info }`
  - *Root Cause*: "About" navigates to an entirely separate page `/am/about` instead of smoothly scrolling to the About section (`#about`) on the home page.
  - *Fix*:
    1. Assign stable `id="about"` (and other section IDs) to homepage sections with `scroll-margin-top: 5rem`.
    2. When on the home page, clicking "About" intercepts the navigation, smoothly scrolls to `#about` without reloading or re-rendering, and updates the URL hash with `history.pushState`.
    3. When on other pages, client-navigates to `/${locale}#about` and automatically scrolls smoothly to the section once rendered.
    4. Implement an active `IntersectionObserver` scroll-spy highlighting the active section in the navbar.

### F. TanStack Query Stale Times & Window Focus Refetching
- **[web/src/providers/SiteSettingsProvider.tsx:297](file:///c:/Users/user/Desktop/PersonalProjects/FelegeSelam/web/src/providers/SiteSettingsProvider.tsx#L297)**:
  - *Code*: `refetchOnWindowFocus: true`, `staleTime: 30 * 1000`.
  - *Root Cause*: Aggressive window focus refetching causes background network spam on every tab switch.
  - *Fix*: Set `refetchOnWindowFocus: false`, increase `staleTime` to 5 minutes for static settings, and rely on real-time SSE events for live invalidation.

---

## 4. Planned Resolution Strategy Matrix

| Issue | Root Cause | Architectural Fix |
| :--- | :--- | :--- |
| **Menu clicking reloads page** | `PublicHeader` duplicated across pages; plain links without section targeting | Move Header/Footer to shared layout; implement smooth anchor scroll for `#about` |
| **Session requested 2x** | Dual calls in `AuthProvider.tsx` (`session` + `refresh` + `session`) | Single in-flight session verification with token claims decoding |
| **Window focus refetch spam** | `refetchOnWindowFocus: true` in `SiteSettingsProvider` | Disable focus refetch, use 5m staleTime, wire SSE live invalidation |
| **Flicker on theme change** | Client-only `useEffect` reading localStorage | Server-rendered cookie theme class on `<html>` to avoid flash |
| **Lack of real-time sync** | No event streaming between API and Web | NestJS `@Sse` endpoint + client `useLiveEvents` hook with TanStack Query invalidation |
| **No instant feedback on nav** | Absence of top progress indicator and route transitions | Add NProgress-style top loading bar and `useTransition` for route changes |
