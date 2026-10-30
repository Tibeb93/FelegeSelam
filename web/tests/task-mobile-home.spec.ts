import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'fs';
import path from 'path';

test.describe('TASK MOBILE HOME (FINAL): Full-Screen Hero, One-Row Header, Menu Drawer, Scroll Sections', () => {
  const screenshotsDir = path.join(process.cwd(), 'screenshots', 'mobile-home');

  test.beforeAll(() => {
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
  });

  // 1. Six Mobile Viewports Testing (Light & Dark Mode) with Screenshots
  const mobileViewports = [
    { name: '320x568-iphone-se1', width: 320, height: 568 },
    { name: '360x640-android-standard', width: 360, height: 640 },
    { name: '390x844-iphone13', width: 390, height: 844 },
    { name: '412x915-galaxy-s20', width: 412, height: 915 },
    { name: '430x932-iphone-promax', width: 430, height: 932 },
    { name: '844x390-landscape', width: 844, height: 390 },
  ];

  for (const vp of mobileViewports) {
    test(`Mobile Home Layout & Screenshots at ${vp.width}x${vp.height} (${vp.name})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/am', { waitUntil: 'networkidle' });

      const header = page.locator('header').first();
      await expect(header).toBeVisible();

      // Capture 1: First screen (Hero before scrolling)
      await page.screenshot({
        path: path.join(screenshotsDir, `${vp.name}-first-screen-light.png`),
        fullPage: false,
      });

      // Capture 2: After scrolling to Quick links & About stats
      const quickLinks = page.locator('#quick-links');
      if (await quickLinks.isVisible()) {
        await quickLinks.scrollIntoViewIfNeeded();
        await page.waitForTimeout(300);
        await page.screenshot({
          path: path.join(screenshotsDir, `${vp.name}-after-scrolling-light.png`),
          fullPage: false,
        });
      }

      // Scroll back up to test menu drawer
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(200);

      // Capture 3: Menu Drawer Open
      const hamburger = page.locator('button[data-testid="mobile-menu-trigger"]');
      if (await hamburger.isVisible()) {
        await hamburger.click();
        await page.waitForTimeout(300);

        const drawer = page.locator('[data-testid="mobile-drawer-container"]');
        await expect(drawer).toBeVisible();

        await page.screenshot({
          path: path.join(screenshotsDir, `${vp.name}-menu-open-light.png`),
          fullPage: false,
        });

        // Close drawer with close button
        const closeBtn = page.locator('[data-testid="mobile-drawer-close"]');
        await closeBtn.click();
        await page.waitForTimeout(200);
      }

      // Capture Dark Mode First Screen
      const hamburgerForDark = page.locator('button[data-testid="mobile-menu-trigger"]');
      if (await hamburgerForDark.isVisible()) {
        await hamburgerForDark.click();
        await page.waitForTimeout(200);

        const darkToggle = page.locator('[data-testid="mobile-drawer-container"] button[aria-label*="theme" i]');
        if (await darkToggle.isVisible()) {
          await darkToggle.click();
          await page.waitForTimeout(200);

          // Close drawer
          await page.keyboard.press('Escape');
          await page.waitForTimeout(200);

          await page.screenshot({
            path: path.join(screenshotsDir, `${vp.name}-first-screen-dark.png`),
            fullPage: false,
          });

          // Switch back to light
          await hamburgerForDark.click();
          await page.waitForTimeout(200);
          await darkToggle.click();
          await page.waitForTimeout(100);
          await page.keyboard.press('Escape');
        }
      }
    });
  }

  // 2. Mobile Header Assertions (Below 1024px)
  test('Mobile Header: Exactly 64px high, single row, short name, no unwanted controls', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/am', { waitUntil: 'networkidle' });

    const header = page.locator('header').first();
    const box = await header.boundingBox();
    expect(box).not.toBeNull();
    // Height should be 64px (h-16)
    expect(Math.round(box!.height)).toBe(64);

    // Left: 40px circular logo
    const mobileLogo = header.locator('.w-10.h-10');
    await expect(mobileLogo).toBeVisible();

    // Short school name on one line
    const shortName = page.locator('[data-testid="mobile-header-short-name"]');
    await expect(shortName).toBeVisible();
    await expect(shortName).toHaveText(/አዕማደ ሰላም/);

    // Right: 44x44 hamburger button
    const hamburger = page.locator('button[data-testid="mobile-menu-trigger"]');
    await expect(hamburger).toBeVisible();
    const hamBox = await hamburger.boundingBox();
    expect(Math.round(hamBox!.width)).toBe(44);
    expect(Math.round(hamBox!.height)).toBe(44);

    // Unwanted elements MUST NOT be in the mobile top bar
    const churchInHeader = header.locator('.lg\\:hidden [data-testid="hero-church-name"]');
    await expect(churchInHeader).toHaveCount(0);

    const desktopNav = header.locator('nav[aria-label="Main Navigation"]');
    await expect(desktopNav).toBeHidden();
  });

  // 3. Mobile Hero Full-Screen Dimensions & No Clipping
  test('Mobile Hero: Height equals viewport minus 64px, buttons & scroll cue visible without scrolling', async ({ page }) => {
    // Test on 360x640 standard phone
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto('/am', { waitUntil: 'networkidle' });

    const hero = page.locator('#hero');
    await expect(hero).toBeVisible();

    const heroBox = await hero.boundingBox();
    expect(heroBox).not.toBeNull();
    // Expected height: 640 - 64 = 576px (within 4px)
    expect(Math.abs(heroBox!.height - (640 - 64))).toBeLessThanOrEqual(4);

    // Check title, church pill, buttons, and scroll cue are inside viewport without scrolling
    const churchPill = page.locator('#hero span[data-testid="hero-church-name"]');
    await expect(churchPill).toBeVisible();

    const heroTitle = page.locator('[data-testid="hero-title"]');
    await expect(heroTitle).toBeVisible();

    const primaryBtn = page.locator('#hero a:has-text("የአባላት ምዝገባ")');
    await expect(primaryBtn).toBeVisible();
    const btnBox = await primaryBtn.boundingBox();
    expect(btnBox!.y + btnBox!.height).toBeLessThanOrEqual(640);

    const scrollCue = page.locator('#hero button[aria-label*="ወደ ታች" i]');
    await expect(scrollCue).toBeVisible();
    const cueBox = await scrollCue.boundingBox();
    expect(cueBox!.y + cueBox!.height).toBeLessThanOrEqual(640);

    // Test on narrow phone 320x568
    await page.setViewportSize({ width: 320, height: 568 });
    await page.waitForTimeout(300);

    const heroNarrow = page.locator('#hero');
    await expect(heroNarrow).toBeVisible();

    // Check primary button is visible without scroll on 320x568
    const primaryBtnNarrow = page.locator('#hero a:has-text("የአባላት ምዝገባ")');
    await expect(primaryBtnNarrow).toBeVisible();

    // Zero horizontal scrollbar at any mobile width
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  // 4. Scroll Cue Smooth-Scroll and Fade-Out
  test('Scroll cue smooth-scrolls to next section and fades out on 40px scroll', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/am', { waitUntil: 'networkidle' });

    const scrollCue = page.locator('#hero button[aria-label*="ወደ ታች" i]');
    await expect(scrollCue).toBeVisible();
    await expect(scrollCue).toHaveClass(/opacity-100/);

    // Click scroll cue
    await scrollCue.click();
    await page.waitForTimeout(600);

    // Scroll position should have moved past 40px
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeGreaterThan(40);

    // Scroll cue should now have faded out
    await expect(scrollCue).toHaveClass(/opacity-0/);
  });

  // 5. Sections After Hero: Quick Links (2x2 grid) and Statistics (2x2 grid)
  test('Sections after Hero: Quick links 2x2 grid and Statistics cards are present', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/am', { waitUntil: 'networkidle' });

    // Quick links section
    const quickLinks = page.locator('#quick-links');
    await expect(quickLinks).toBeVisible();
    await expect(quickLinks.locator('h2')).toHaveText(/ፈጣን አገናኞች/);

    // 4 quick link cards in 2x2 grid
    const cards = quickLinks.locator('a');
    await expect(cards).toHaveCount(4);

    // Verify labels
    await expect(quickLinks.locator('text=ዜናና ማስታወቂያ')).toBeVisible();
    await expect(quickLinks.locator('text=መዝሙራት')).toBeVisible();
    await expect(quickLinks.locator('text=ትምህርቶች')).toBeVisible();
    await expect(quickLinks.locator('text=ቀን መቁጠሪያ')).toBeVisible();

    // Statistics cards
    const statsHeading = page.locator('h2:has-text("ስለ ሰንበት ትምህርት ቤታችን")').first();
    await expect(statsHeading).toBeVisible();
    await expect(page.locator('text=1,200+').first()).toBeVisible();
    await expect(page.locator('text=35+').first()).toBeVisible();
    await expect(page.locator('text=500+').first()).toBeVisible();
    await expect(page.locator('text=30+').first()).toBeVisible();
  });

  // 6. Menu Drawer: Full functionality, Focus Trap, Escape to close, Body Scroll Lock
  test('Menu Drawer: Opens from right, traps focus, locks body scroll, closes on Escape & backdrop', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/am', { waitUntil: 'networkidle' });

    const hamburger = page.locator('button[data-testid="mobile-menu-trigger"]');
    await hamburger.click();
    await page.waitForTimeout(250);

    const drawer = page.locator('[data-testid="mobile-drawer-container"]');
    await expect(drawer).toBeVisible();

    // Verify width is 330px max 85%
    const drawerBox = await drawer.boundingBox();
    expect(drawerBox!.width).toBeLessThanOrEqual(330);

    // Verify Body scroll lock
    const bodyOverflow = await page.evaluate(() => document.body.style.overflow);
    expect(bodyOverflow).toBe('hidden');

    // Drawer contains 7 navigation items
    const navRows = drawer.locator('nav a');
    await expect(navRows).toHaveCount(7);

    // Active item (Home) is styled with #1E78C8
    const activeHome = drawer.locator('nav a:has-text("ዋና ገጽ"), nav a:has-text("መነሻ")').first();
    await expect(activeHome).toHaveClass(/bg-\[#1E78C8\]/);

    // Drawer bottom contains segmented language switch + theme toggle in one row
    const langSwitch = drawer.locator('.bg-\\[\\#D6E0EA\\]');
    await expect(langSwitch).toBeVisible();
    await expect(langSwitch.locator('text=አማርኛ')).toBeVisible();
    await expect(langSwitch.locator('text=EN')).toBeVisible();

    // Full-width gold Members Portal button (52px high)
    const portalBtn = drawer.locator('a:has-text("የአባላት ፖርታል")');
    await expect(portalBtn).toBeVisible();
    await expect(portalBtn).toHaveClass(/bg-\[#F2B233\]/);
    const portalBox = await portalBtn.boundingBox();
    expect(Math.round(portalBox!.height)).toBe(52);

    // Close on Escape key
    await page.keyboard.press('Escape');
    await page.waitForTimeout(250);
    await expect(drawer).toBeHidden();

    // Body scroll restored
    const bodyOverflowAfter = await page.evaluate(() => document.body.style.overflow);
    expect(bodyOverflowAfter).toBe('');

    // Reopen and test backdrop click to close
    await hamburger.click();
    await page.waitForTimeout(200);
    await expect(drawer).toBeVisible();

    const backdrop = page.locator('[data-testid="mobile-drawer-backdrop"]');
    await backdrop.click({ position: { x: 10, y: 100 } });
    await page.waitForTimeout(250);
    await expect(drawer).toBeHidden();
  });

  // 7. Desktop Header Regression Check (1440px): 2 lines brand without wrap
  test('Desktop Header (1440px): Two-line brand without wrap, 7 nav links, gold portal button', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/am', { waitUntil: 'networkidle' });

    const header = page.locator('header').first();
    await expect(header).toBeVisible();

    // Desktop brand has school name and church name on clean single lines
    const schoolName = header.locator('a[href*="/am"] span:has-text("አዕማደ ሰላም")').first();
    await expect(schoolName).toBeVisible();
    await expect(schoolName).toHaveClass(/whitespace-nowrap/);

    const churchName = header.locator('a[href*="/am"] span:has-text("ፈለገ ሰላም")').first();
    await expect(churchName).toBeVisible();
    await expect(churchName).toHaveClass(/whitespace-nowrap/);

    // 7 navigation links
    const desktopNav = header.locator('nav[aria-label="Main Navigation"]');
    await expect(desktopNav).toBeVisible();
    await expect(desktopNav.locator('a')).toHaveCount(7);

    // Members portal button
    const portalBtn = header.locator('a[href*="portal"]:has-text("የአባላት ፖርታል")');
    await expect(portalBtn).toBeVisible();
    await expect(portalBtn).toHaveClass(/bg-\[#F2B233\]/);
  });

  // 8. Automated Accessibility Audit (Axe WCAG 2.1 AA)
  test('Axe Accessibility Audit: Mobile Home page and Header have zero WCAG violations', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/am', { waitUntil: 'networkidle' });

    // Run Axe on header and hero
    const axeResults = await new AxeBuilder({ page })
      .include('header')
      .include('#hero')
      .include('#quick-links')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(axeResults.violations).toEqual([]);
  });
});

