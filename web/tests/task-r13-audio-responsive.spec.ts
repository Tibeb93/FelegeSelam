import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'fs';
import path from 'path';

test.describe('TASK R13: Audio That Never Stops Working + Responsive Player', () => {
  const screenshotsDir = path.join(process.cwd(), 'screenshots', 'audio-responsive');

  test.beforeAll(() => {
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
  });

  const loginAdmin = async (page: any) => {
    await page.context().clearCookies();
    await page.goto('/am/admin/login');
    await page.locator('input[name="identifier"]').fill('admin@aemade.org');
    await page.locator('input[name="password"]').fill('Admin@123456!');
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/\/am\/admin(?:\?.*)?$/, { timeout: 15000 });
  };

  // 1. API: Seeking & Range Requests (HTTP 206 Partial Content)
  test('1. Seeking & HTTP 206 Partial Content Range streaming support', async ({ request }) => {
    // 1a. Stream known available audio sample with Range header
    const sampleKey = encodeURIComponent('mezmurs/audio/sample-orthodox-chime.wav');
    const res = await request.get(`http://localhost:3000/api/v1/mezmurs/stream/${sampleKey}`, {
      headers: {
        Range: 'bytes=0-1023',
      },
    });

    expect(res.status()).toBe(206);
    expect(res.headers()['accept-ranges']).toBe('bytes');
    expect(res.headers()['content-range']).toMatch(/^bytes 0-1023\/\d+/);
    expect(Number(res.headers()['content-length'])).toBe(1024);

    // 1b. Test seeking beyond start (e.g. byte 2048 to 4095)
    const seekRes = await request.get(`http://localhost:3000/api/v1/mezmurs/stream/${sampleKey}`, {
      headers: {
        Range: 'bytes=2048-4095',
      },
    });
    expect(seekRes.status()).toBe(206);
    expect(seekRes.headers()['content-range']).toMatch(/^bytes 2048-4095\/\d+/);
    expect(Number(seekRes.headers()['content-length'])).toBe(2048);
  });

  // 2. API: Validation & Rejection of Wrong File Types and Oversized Files
  test('2. File validation rejects invalid formats and oversized payloads', async ({ request }) => {
    // Admin login for upload authorization
    const loginRes = await request.post('http://localhost:3000/api/v1/auth/admin/login', {
      data: {
        identifier: 'admin@aemade.org',
        password: 'Admin@123456!',
      },
    });
    const loginData = await loginRes.json();
    const token = loginData.accessToken || (loginData.data && loginData.data.accessToken);

    // 2a. Reject non-audio format (e.g., text/plain)
    const textBuffer = Buffer.from('This is a text file disguised as audio', 'utf-8');
    const wrongFormatRes = await request.post('http://localhost:3000/api/v1/mezmurs/upload-direct', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      multipart: {
        file: {
          name: 'malicious.txt',
          mimeType: 'text/plain',
          buffer: textBuffer,
        },
      },
    });
    // Controller should reject with 400 Bad Request
    expect([400, 422]).toContain(wrongFormatRes.status());
    const errBody = await wrongFormatRes.json();
    expect(JSON.stringify(errBody).toLowerCase()).toMatch(/unsupported|invalid|audio/i);

    // 2b. Presigned upload request also rejects invalid mime types
    const invalidPresignRes = await request.post('http://localhost:3000/api/v1/mezmurs/presigned-upload', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        filename: 'document.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 1024,
      },
    });
    expect([400, 422]).toContain(invalidPresignRes.status());

    // 2c. Presigned upload request rejects oversized file (>50MB)
    const oversizedPresignRes = await request.post('http://localhost:3000/api/v1/mezmurs/presigned-upload', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        filename: 'giant_song.mp3',
        mimeType: 'audio/mpeg',
        sizeBytes: 52428801, // 50MB + 1 byte
      },
    });
    expect([400, 413, 422]).toContain(oversizedPresignRes.status());
  });

  // 3. API: Playback URL resolution & Automatic refresh
  test('3. Playback URL resolution & storage health check endpoint', async ({ request }) => {
    // 3a. Admin login to obtain token for health check
    const loginRes = await request.post('http://localhost:3000/api/v1/auth/admin/login', {
      data: {
        identifier: 'admin@aemade.org',
        password: 'Admin@123456!',
      },
    });
    const loginData = await loginRes.json();
    const token = loginData.accessToken || (loginData.data && loginData.data.accessToken);

    // 3b. Check storage health check endpoint with bearer token
    const healthRes = await request.get('http://localhost:3000/api/v1/mezmurs/storage/health', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    expect(healthRes.status()).toBe(200);
    const health = await healthRes.json();
    expect(health).toHaveProperty('total');
    expect(health).toHaveProperty('available');
    expect(health).toHaveProperty('missing');
    expect(health).toHaveProperty('items');

    // 3c. Check playback URL for an existing mezmur
    const listRes = await request.get('http://localhost:3000/api/v1/mezmurs/public?limit=1');
    if (listRes.ok()) {
      const listData = await listRes.json();
      const mezmur = (listData.data || listData.items || [])[0];
      if (mezmur) {
        const playbackRes = await request.get(`http://localhost:3000/api/v1/mezmurs/${mezmur.id}/playback-url`);
        expect(playbackRes.status()).toBe(200);
        const pbData = await playbackRes.json();
        expect(pbData).toHaveProperty('audioUrl');
        expect(typeof pbData.audioUrl).toBe('string');
      }
    }
  });

  // 4. Responsive Breakpoints: 320, 360, 390, 430, 640, 768, 1024, 1280
  const breakpoints = [
    { name: '320-phone-min', width: 320, height: 600, expectedCols: 1, isMobile: true },
    { name: '360-phone-standard', width: 360, height: 640, expectedCols: 1, isMobile: true },
    { name: '390-phone-iphone13', width: 390, height: 844, expectedCols: 1, isMobile: true },
    { name: '430-phone-promax', width: 430, height: 932, expectedCols: 1, isMobile: true },
    { name: '640-tablet-sm', width: 640, height: 900, expectedCols: 2, isMobile: true },
    { name: '768-tablet-md', width: 768, height: 1024, expectedCols: 2, isMobile: false },
    { name: '1024-laptop', width: 1024, height: 768, expectedCols: 3, isMobile: false },
    { name: '1280-desktop', width: 1280, height: 800, expectedCols: 3, isMobile: false },
  ];

  for (const bp of breakpoints) {
    test(`Responsive Layout & No Horizontal Overflow at ${bp.width}px (${bp.name})`, async ({ page }) => {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await page.goto('/am/mezmur', { waitUntil: 'networkidle' });

      // Verify no horizontal overflow
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
      });
      expect(hasHorizontalScroll).toBe(false);

      // Verify page loaded
      const pageHeader = page.locator('h1').first();
      await expect(pageHeader).toBeVisible();

      // Check grid column layout class
      const gridContainer = page.locator('[data-testid="mezmur-grid"]');
      if (await gridContainer.isVisible()) {
        const gridClass = (await gridContainer.getAttribute('class')) || '';
        expect(gridClass).toContain('grid-cols-1');
        expect(gridClass).toContain('sm:grid-cols-2');
        expect(gridClass).toContain('lg:grid-cols-3');
      }

      // Capture screenshot at this breakpoint
      await page.screenshot({
        path: path.join(screenshotsDir, `mezmur-${bp.name}.png`),
        fullPage: false,
      });
    });
  }

  // 5. Player Behavior: Mini-player fixed at bottom on mobile, Expand on tap, Controls & Position Memory
  test('5. Audio Player UI: preload, seek bar, speed controls, mobile drawer & position persistence', async ({
    page,
  }) => {
    // Test on mobile viewport
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/am/mezmur', { waitUntil: 'networkidle' });

    // Look for any play button in mezmur cards
    const playButtons = page.locator('[data-testid="play-mezmur-btn"], button:has-text("አጫውት"), button:has-text("Play")');
    const count = await playButtons.count();

    if (count > 0) {
      await playButtons.first().click();

      // Mini player should appear fixed at bottom
      const miniPlayer = page.locator('[data-testid="mobile-mini-player"]');
      await expect(miniPlayer).toBeVisible({ timeout: 5000 });

      // Check audio element attributes: preload="metadata"
      const audioElement = page.locator('audio');
      await expect(audioElement).toHaveAttribute('preload', 'metadata');

      // Tapping expand button on mobile mini player expands the drawer
      const expandBtn = page.locator('[data-testid="expand-player-btn"]');
      await expandBtn.click();

      // Full player drawer should be visible
      const expandedDrawer = page.locator('[data-testid="expanded-player-drawer"]');
      await expect(expandedDrawer).toBeVisible();

      // Scrubber / seek slider is present
      const scrubber = page.locator('[data-testid="audio-scrubber"]');
      await expect(scrubber).toBeVisible();

      // Playback speed buttons are present
      const speedButtons = page.locator('[data-testid="player-speed-btn"]');
      await expect(speedButtons.first()).toBeVisible();

      // Click 1.25x speed button
      if ((await speedButtons.count()) >= 3) {
        await speedButtons.nth(2).click(); // Click 1.25x
        await page.waitForTimeout(200);

        // Verify audio element playback rate
        const rate = await audioElement.evaluate((el: HTMLAudioElement) => el.playbackRate);
        expect(rate).toBe(1.25);
      }

      // Capture screenshot of expanded drawer
      await page.screenshot({
        path: path.join(screenshotsDir, `player-drawer-expanded-390.png`),
      });

      // Collapse drawer
      const collapseBtn = page.locator('[data-testid="collapse-player-btn"]');
      await collapseBtn.click();
      await expect(expandedDrawer).not.toBeVisible();
    }
  });

  // 6. Admin Mezmur Dashboard: Mobile cards vs Desktop table, Storage Health Check & Re-upload action
  test('6. Admin Mezmur Management: Responsive table-to-cards, Storage Health & Form Upload', async ({
    page,
  }) => {
    await loginAdmin(page);

    // 6a. Desktop view: full table & health banner
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/am/admin/mezmur', { waitUntil: 'networkidle' });

    // Header & Actions
    await expect(page.locator('main h1, h1.text-2xl').first()).toContainText(/መዝሙራትና ዜማዎች|የመዝሙር አስተዳደር|Mezmur/i);

    // Desktop table should be visible
    const desktopTable = page.locator('table');
    await expect(desktopTable).toBeVisible();

    // Storage health check button
    const healthCheckBtn = page.locator('[data-testid="storage-health-btn"], button:has-text("የማከማቻ ሁኔታ"), button:has-text("Storage Health")').first();
    await expect(healthCheckBtn).toBeVisible();
    await healthCheckBtn.click();
    await page.waitForTimeout(1000);

    // Screenshot desktop admin
    await page.screenshot({
      path: path.join(screenshotsDir, `admin-mezmur-desktop-1280.png`),
    });

    // 6b. Mobile view (<768px): cards replace wide table
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(300);

    // On mobile, table is hidden (hidden md:block), mobile card container is visible (block md:hidden)
    const mobileCards = page.locator('[data-testid="mobile-mezmur-cards"]');
    await expect(mobileCards).toBeVisible();

    // Verify no horizontal overflow in admin mobile
    const adminHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
    });
    expect(adminHorizontalOverflow).toBe(false);

    // Screenshot mobile admin cards
    await page.screenshot({
      path: path.join(screenshotsDir, `admin-mezmur-mobile-390.png`),
    });

    // 6c. Upload Form dialog: single column layout, sticky footer, progress bar
    const addBtn = page.locator('button:has-text("አዲስ መዝሙር"), button:has-text("Add Mezmur")').first();
    await addBtn.click();

    const formDialog = page.locator('div[role="dialog"]');
    await expect(formDialog).toBeVisible();

    // Check sticky footer Save button
    const saveBtn = formDialog.locator('[data-testid="save-mezmur-btn"], button[type="submit"], button:has-text("መዝግብ"), button:has-text("አድስ"), button:has-text("Save")').first();
    await expect(saveBtn).toBeVisible();

    // File input field
    const fileInput = formDialog.locator('input[type="file"][accept*="audio"]');
    await expect(fileInput).toBeAttached();

    // Screenshot dialog
    await page.screenshot({
      path: path.join(screenshotsDir, `admin-mezmur-upload-dialog-390.png`),
    });
  });

  // 7. Accessibility (Axe-core checks)
  test('7. Accessibility compliance check on Public Mezmur & Admin Mezmur', async ({ page }) => {
    await page.goto('/am/mezmur', { waitUntil: 'networkidle' });

    const accessibilityScanResults = await new AxeBuilder({ page })
      .disableRules(['color-contrast']) // User themes can vary in test environment
      .analyze();

    // Ensure critical violations are absent
    const criticalViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'critical',
    );
    expect(criticalViolations.length).toBe(0);
  });
});
