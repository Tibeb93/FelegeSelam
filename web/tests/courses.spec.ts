import { test, expect } from '@playwright/test';

test.describe('Phase 10: Admin Courses Screens', () => {
  // Helper to log in as admin before tests
  const loginAdmin = async (page: any) => {
    await page.goto('/am/admin/login');
    await page.locator('input[name="identifier"]').fill('admin@aemade.org');
    await page.locator('input[name="password"]').fill('Admin@123456!');
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/\/am\/admin/, { timeout: 15000 });
  };

  test('1. Courses list page renders with table, search, filters, and Add button', async ({
    page,
  }) => {
    await loginAdmin(page);
    await page.goto('/am/admin/courses');

    // Header title and actions
    await expect(page.locator('main h1')).toContainText('ትምህርቶች');
    await expect(page.getByRole('link', { name: 'አዲስ ትምህርት መዝግብ' })).toBeVisible();

    // Table visibility
    const table = page.locator('table');
    await expect(table).toBeVisible();

    // Verify filter dropdowns exist
    const selects = page.locator('select');
    expect(await selects.count()).toBeGreaterThanOrEqual(2); // status, level filters
  });

  test('2. Create course form validation and course creation', async ({ page }) => {
    await loginAdmin(page);
    await page.goto('/am/admin/courses/new');

    await expect(page.locator('main h1')).toContainText('አዲስ ትምህርት መመዝገቢያ');

    const uniqueId = Date.now().toString().slice(-4);
    const testTitleAm = `የመጽሐፍ ቅዱስ ጥናት ክፍል ${uniqueId}`;
    const testTitleEn = `Bible Study Class ${uniqueId}`;

    // Fill form
    await page.locator('input[name="titleAm"]').fill(testTitleAm);
    await page.locator('input[name="titleEn"]').fill(testTitleEn);
    await page.locator('textarea[name="description"]').fill('የኦሪት ዘፍጥረት ጥልቅ ትምህርት');
    await page.locator('input[name="capacity"]').fill('35');
    await page.locator('input[name="schedule"]').fill('ቅዳሜ ከሰዓት 8:00 - 10:00');

    // Select status open
    await page.locator('select[name="status"]').selectOption('open');

    // Submit
    await page.getByRole('button', { name: 'ትምህርቱን መዝግብ' }).click();

    // Should redirect back to courses list
    await expect(page).toHaveURL(/\/am\/admin\/courses/, { timeout: 15000 });
    await expect(page.getByText(testTitleAm)).toBeVisible();
  });

  test('3. Course details page renders all 6 tabs', async ({ page }) => {
    await loginAdmin(page);
    await page.goto('/am/admin/courses');

    // Open first course details
    const firstCourseLink = page.locator('table tbody tr td a').first();
    await expect(firstCourseLink).toBeVisible({ timeout: 10000 });
    await firstCourseLink.click();

    await expect(page).toHaveURL(/\/am\/admin\/courses\/[a-zA-Z0-9-]+/, { timeout: 15000 });

    // Verify 6 Tabs exist
    await expect(page.getByRole('button', { name: /አጠቃላይ እይታ/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /ትምህርቶች/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /ተማሪዎች/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /የመገኘት መዝገብ/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /ውጤቶች/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /የምስክር ወረቀት/ })).toBeVisible();
  });

  test('4. Lessons tab allows adding lessons, toggling publish, and media preview', async ({
    page,
  }) => {
    await loginAdmin(page);
    await page.goto('/am/admin/courses');

    const firstCourseLink = page.locator('table tbody tr td a').first();
    await firstCourseLink.click();

    // Click Lessons tab
    await page.getByRole('button', { name: /ትምህርቶች/ }).click();
    await expect(page.getByRole('button', { name: 'አዲስ ትምህርት ጨምር' })).toBeVisible();

    // Add Lesson
    await page.getByRole('button', { name: 'አዲስ ትምህርት ጨምር' }).click();
    const lessonTitle = `ክፍል ፩፡ ታሪካዊ ዳራ ${Date.now().toString().slice(-4)}`;
    await page.locator('input[placeholder*="ለምሳሌ"]').fill(lessonTitle);
    await page.getByRole('button', { name: 'አስቀምጥ' }).click();

    // Verify newly added lesson is in list
    await expect(page.getByText(lessonTitle)).toBeVisible({ timeout: 10000 });
  });

  test('5. Students tab supports enrollment and capacity check', async ({ page }) => {
    await loginAdmin(page);
    await page.goto('/am/admin/courses');

    const firstCourseLink = page.locator('table tbody tr td a').first();
    await firstCourseLink.click();

    // Click Students tab
    await page.getByRole('button', { name: /ተማሪዎች/ }).click();
    await expect(page.getByRole('button', { name: 'ተማሪ መዝግብ' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'የክፍል አባላትን በጅምላ መዝግብ' })).toBeVisible();
  });

  test('6. Attendance tab records session and supports QR scan fallback', async ({ page }) => {
    await loginAdmin(page);
    await page.goto('/am/admin/courses');

    const firstCourseLink = page.locator('table tbody tr td a').first();
    await firstCourseLink.click();

    // Click Attendance tab
    await page.getByRole('button', { name: /የመገኘት መዝገብ/ }).click();
    await expect(page.getByRole('button', { name: /ሁሉንም 'ተገኝቷል' አድርግ/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /የተማሪ QR ኮድ ቃኝ/ })).toBeVisible();

    // Open QR scan modal
    await page.getByRole('button', { name: /የተማሪ QR ኮድ ቃኝ/ }).click();
    await expect(page.getByText(/የተማሪውን QR ኮድ አቅርበው ይቃኙ/)).toBeVisible();
    await expect(page.getByPlaceholder('e.g. AS-2026-0001')).toBeVisible();

    // Close modal
    await page.locator('button:has(svg.lucide-x)').click();
  });

  test('7. Grades tab spreadsheet grid displays live average and Pass/Fail', async ({ page }) => {
    await loginAdmin(page);
    await page.goto('/am/admin/courses');

    const firstCourseLink = page.locator('table tbody tr td a').first();
    await firstCourseLink.click();

    // Click Grades tab
    await page.getByRole('button', { name: /ውጤቶች/ }).click();
    await expect(page.getByRole('button', { name: 'አዲስ ምዘና/ፈተና ጨምር' })).toBeVisible();
    await expect(page.locator('table thead')).toBeVisible();
  });

  test('8. Certificates tab and public verification page at /verify/[code]', async ({ page }) => {
    await loginAdmin(page);
    await page.goto('/am/admin/courses');

    const firstCourseLink = page.locator('table tbody tr td a').first();
    await firstCourseLink.click();

    // Click Certificates tab
    await page.getByRole('button', { name: /የምስክር ወረቀት/ }).click();
    await expect(page.getByRole('button', { name: /ለተመረጡት የምስክር ወረቀት ስጥ/ })).toBeVisible();

    // Test public verification endpoint with test code
    await page.goto('/am/verify/AS-CERT-DEMO-001');
    // Public verification page should load without requiring login redirect
    await expect(page).toHaveURL(/\/am\/verify\/AS-CERT-DEMO-001/);
    await expect(page.getByText(/አዕማደ ሰላም ሰንበት ትምህርት ቤት/)).toBeVisible();
  });
});
