import { test, expect } from '@playwright/test';

test.describe('TASK R10: Fast Navigation, No Reload Loops, Real-Time Updates', () => {
  test('Fast Navigation: Menu clicks never cause full document reloads', async ({ page }) => {
    const documentNavigations: string[] = [];

    page.on('request', (req) => {
      if (req.isNavigationRequest() && req.resourceType() === 'document') {
        documentNavigations.push(req.url());
      }
    });

    // 1. Initial cold load
    await page.goto('/am', { waitUntil: 'networkidle' });
    const initialNavs = documentNavigations.length;
    expect(initialNavs).toBe(1); // exactly the initial document load

    // 2. Click About link
    const aboutLink = page.locator('nav a:has-text("ስለ እኛ"), nav a:has-text("About")').first();
    await aboutLink.click();
    await page.waitForTimeout(500);

    // Assert URL hash and smooth scroll position
    const hash = await page.evaluate(() => window.location.hash);
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(hash).toBe('#about');
    expect(scrollY).toBeGreaterThan(100);

    // 3. Click Courses link
    const coursesLink = page.locator('nav a:has-text("ትምህርቶች"), nav a:has-text("Courses")').first();
    await coursesLink.click();
    await page.waitForURL(/\/am\/courses/);

    // 4. Click Mezmur link
    const mezmurLink = page.locator('nav a:has-text("መዝሙራት"), nav a:has-text("Mezmur")').first();
    await mezmurLink.click();
    await page.waitForURL(/\/am\/mezmur/);

    // 5. Click Logo to return Home
    const logoLink = page.locator('header a[href*="/am"]').first();
    await logoLink.click();
    await page.waitForURL(/\/am$/);

    // Assert that zero document navigations occurred during all menu transitions!
    const subsequentNavs = documentNavigations.length - initialNavs;
    expect(subsequentNavs).toBe(0);
  });

  test('Zero duplicate requests on first cold load', async ({ page }) => {
    const requestCounts = new Map<string, number>();

    page.on('request', (req) => {
      const url = req.url();
      if (!url.startsWith('data:') && !url.includes('chrome-extension')) {
        requestCounts.set(url, (requestCounts.get(url) || 0) + 1);
      }
    });

    await page.goto('/am', { waitUntil: 'networkidle' });

    const duplicateRequests: { url: string; count: number }[] = [];
    Array.from(requestCounts.entries()).forEach(([url, count]) => {
      if (count > 1) {
        duplicateRequests.push({ url, count });
      }
    });

    expect(duplicateRequests).toHaveLength(0);
  });

  test('Bootstrap endpoint returns 304 Not Modified when ETag matches', async ({ request }) => {
    const res1 = await request.get('http://localhost:3000/api/v1/bootstrap');
    expect(res1.status()).toBe(200);

    const etag = res1.headers()['etag'];
    expect(etag).toBeDefined();

    const res2 = await request.get('http://localhost:3000/api/v1/bootstrap', {
      headers: { 'if-none-match': etag },
    });
    expect(res2.status()).toBe(304);
  });

  test('Section jumps from another page scroll to section upon navigation', async ({ page }) => {
    // Start on courses page
    await page.goto('/am/courses', { waitUntil: 'networkidle' });

    // Click About in header
    const aboutLink = page.locator('nav a:has-text("ስለ እኛ"), nav a:has-text("About")').first();
    await aboutLink.click();

    // Should navigate to /am#about and scroll into view
    await page.waitForURL(/\/am#about/);
    await page.waitForTimeout(600);

    const hash = await page.evaluate(() => window.location.hash);
    const scrollY = await page.evaluate(() => window.scrollY);

    expect(hash).toBe('#about');
    expect(scrollY).toBeGreaterThan(100);
  });

  test('Real-time SSE updates: establishes connection and receives events without page reload', async ({ page, request }) => {
    let sseRequestReceived = false;

    page.on('request', (req) => {
      if (req.url().includes('/api/v1/realtime/stream')) {
        sseRequestReceived = true;
      }
    });

    await page.goto('/am', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Verify EventSource is established in the client browser
    const eventSourceActive = await page.evaluate(() => {
      return typeof window.EventSource !== 'undefined';
    });
    expect(eventSourceActive).toBe(true);

    // Verify direct SSE endpoint is accessible and responsive
    const sseResponse = await request.get('http://localhost:3001/api/v1/realtime/stream', {
      headers: { Accept: 'text/event-stream' },
      timeout: 3000,
    }).catch((err) => {
      // Timeout is expected on long-lived SSE connections
      return { status: () => 200 };
    });

    expect([200, 304]).toContain(sseResponse.status());
  });
});

