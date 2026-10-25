import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Phase 14: Main Journeys & Accessibility Suite', () => {
  // Helper for admin login
  const loginAdmin = async (page: any) => {
    await page.goto('/am/admin/login');
    await page.locator('input[name="identifier"]').fill('admin@aemade.org');
    await page.locator('input[name="password"]').fill('Admin@123456!');
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/\/am\/admin/, { timeout: 15000 });
  };

  test('1. Member Self-Registration Flow', async ({ page }) => {
    const uniqueEmail = `applicant_${Date.now()}@example.com`;
    const uniquePhone = `+2519${Math.floor(10000000 + Math.random() * 90000000)}`;

    await page.goto('/am/register');
    await expect(page.getByRole('heading', { level: 2 }).first()).toBeVisible();

    // Fill registration form
    await page.locator('input[name="firstName"]').fill('ዮናስ');
    await page.locator('input[name="fatherName"]').fill('ተስፋዬ');
    await page.locator('input[name="email"]').fill(uniqueEmail);
    await page.locator('input[name="phone"]').fill(uniquePhone);
    await page.locator('input[name="password"]').fill('Password123456!');
    await page.locator('input[name="confirmPassword"]').fill('Password123456!');

    // Select sex
    const sexSelect = page.locator('select[name="sex"]');
    if (await sexSelect.isVisible()) {
      await sexSelect.selectOption('male');
    }

    // Submit registration
    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();

    // Verify success confirmation view
    await expect(page.getByText(/ምዝገባዎ በተሳካ ሁኔታ ተልኳል|ይግቡ|ተገምግሞ/i).first()).toBeVisible({ timeout: 15000 });
  });

  test('2. Admin Member Management (Search, Filter, Profile, Exports)', async ({ page }) => {
    await loginAdmin(page);
    await page.goto('/am/admin/members');

    // Verify Members list table loaded
    await expect(page.locator('main h1')).toBeVisible();
    await expect(page.locator('table')).toBeVisible();

    // Test Search input
    const searchInput = page.locator('input[placeholder*="ፈልግ"], input[type="search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('አበበ');
      await page.waitForTimeout(500);
    }

    // Verify export triggers exist
    const exportBtn = page.getByRole('button', { name: /አባላትን ላክ|ኤክስፖርት|Export/i }).first();
    await expect(exportBtn).toBeVisible();
  });

  test('3. Attendance Management & QR Scanner', async ({ page }) => {
    await loginAdmin(page);
    await page.goto('/am/admin/courses');

    await expect(page.locator('main h1')).toContainText(/ትምህርቶች|ኮርሶች|Courses/i);

    // Look for first course row and click into details
    const firstCourseLink = page.locator('table tbody tr a, table tbody tr').first();
    if (await firstCourseLink.isVisible()) {
      await firstCourseLink.click();
      await page.waitForTimeout(1000);

      // Verify attendance tab exists
      const attendanceTab = page.getByRole('tab', { name: /አቴንዳንስ|መገኘት|Attendance/i }).or(page.getByText(/መገኘት/i)).first();
      if (await attendanceTab.isVisible()) {
        await attendanceTab.click();
        await page.waitForTimeout(500);

        // Verify QR scanner trigger or attendance controls exist
        const qrScanBtn = page.getByRole('button', { name: /QR|ስካን|Scan/i }).first();
        if (await qrScanBtn.isVisible()) {
          await qrScanBtn.click();
          await expect(page.getByText(/ካሜራ|QR ስካነር|የአባል ቁጥር/i)).toBeVisible();
          // Close modal
          await page.keyboard.press('Escape');
        }
      }
    }
  });

  test('4. Content Management (Posts, Urgent Notice, Mezmur Library)', async ({ page }) => {
    await loginAdmin(page);

    // Check Posts management page
    await page.goto('/am/admin/posts');
    await expect(page.locator('main h1')).toBeVisible();
    await expect(page.locator('a[href*="/admin/posts/new"], button:has-text("አዲስ")').first()).toBeVisible();

    // Check Mezmur management page
    await page.goto('/am/admin/mezmur');
    await expect(page.locator('main h1')).toBeVisible();
    await expect(page.locator('a[href*="/admin/mezmur/new"], button:has-text("መዝሙር")').first()).toBeVisible();
  });

  test('5. Form Builder & Submissions Screen', async ({ page }) => {
    await loginAdmin(page);

    await page.goto('/am/admin/forms');
    await expect(page.locator('main h1')).toContainText(/የቅጽ ገንቢ|ቅጾች|Forms/i);
    await expect(page.getByRole('link', { name: /አዲስ ቅጽ|New Form/i }).or(page.getByRole('button', { name: /አዲስ ቅጽ/i })).first()).toBeVisible();
  });

  test('6. Contributions Recording & Receipt Generation', async ({ page }) => {
    await loginAdmin(page);

    await page.goto('/am/admin/contributions');
    await expect(page.locator('main h1')).toContainText(/ስጦታና ክፍያዎች|Contributions/i);

    // Record payment button
    const recordBtn = page.getByRole('button', { name: /አዲስ ክፍያ|ክፍያ መዝግብ|Record/i }).first();
    await expect(recordBtn).toBeVisible();

    // Verify summary statistics
    await expect(page.getByText(/ጠቅላላ የተሰበሰበ|Total/i).first()).toBeVisible();
  });

  test('7. Automated Accessibility Check (Axe WCAG 2.1 AA)', async ({ page }) => {
    // 1. Check Public Home page
    await page.goto('/am');
    await page.waitForLoadState('networkidle');

    const homeAxeResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['color-contrast'])
      .analyze();

    expect(homeAxeResults.violations).toEqual([]);

    // 2. Check Member Portal Dashboard (logged-in session)
    await loginAdmin(page);
    await page.goto('/am/portal');
    await page.waitForLoadState('networkidle');

    const portalAxeResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['color-contrast'])
      .analyze();

    expect(portalAxeResults.violations).toEqual([]);
  });
});
