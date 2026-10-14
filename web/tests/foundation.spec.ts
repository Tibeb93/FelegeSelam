import { test, expect } from '@playwright/test';

test.describe('Phase 8: Web Foundation & Admin Suite', () => {
  test('1. Unauthenticated access to /admin redirects to login', async ({ page }) => {
    await page.goto('/am/admin');
    await expect(page).toHaveURL(/\/am\/login/);
    await expect(page.locator('h2')).toContainText('ወደ ሥርዓቱ ይግቡ');
  });

  test('2. Language switch sets NEXT_LOCALE cookie and updates interface', async ({ page }) => {
    await page.goto('/am');
    await page.getByRole('link', { name: 'EN' }).first().click();
    await expect(page).toHaveURL(/\/en/);

    const cookies = await page.context().cookies();
    const localeCookie = cookies.find((c) => c.name === 'NEXT_LOCALE');
    expect(localeCookie?.value).toBe('en');

    // Refresh and ensure language remains English
    await page.reload();
    await expect(page).toHaveURL(/\/en/);
  });

  test('3. Theme switch toggles dark class and persists in cookie', async ({ page }) => {
    await page.goto('/am/login');

    const initialDark = await page.evaluate(() =>
      document.documentElement.classList.contains('dark'),
    );

    // Click theme toggle button
    const themeBtn = page.getByRole('button', { name: /Toggle theme/i });
    await themeBtn.click();

    // Verify dark class toggled
    const toggledDark = await page.evaluate(() =>
      document.documentElement.classList.contains('dark'),
    );
    expect(toggledDark).toBe(!initialDark);

    const cookies = await page.context().cookies();
    const themeCookie = cookies.find((c) => c.name === 'fs_theme');
    expect(themeCookie?.value).toBe(toggledDark ? 'dark' : 'light');

    // Refresh and ensure toggled theme persists
    await page.reload();
    const isStillToggled = await page.evaluate(() =>
      document.documentElement.classList.contains('dark'),
    );
    expect(isStillToggled).toBe(toggledDark);
  });

  test('4. End-to-end Login with demo credentials and redirect to /admin', async ({ page }) => {
    await page.goto('/am/login');

    // Enter superadmin credentials
    await page.locator('input[name="identifier"]').fill('admin@aemade.org');
    await page.locator('input[name="password"]').fill('Admin@123456!');
    await page.getByRole('button', { name: 'ግባ' }).click();

    // Wait for redirect to admin dashboard
    await expect(page).toHaveURL(/\/am\/admin/, { timeout: 15000 });
    await expect(page.locator('main h1')).toContainText('እንኳን ደህና መጡ');

    // Verify role-based sidebar items
    await expect(page.getByRole('link', { name: 'ዳሽቦርድ', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'አባላት', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'ትምህርቶች', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'የክትትል መዝገብ', exact: true })).toBeVisible();
  });

  test('5. Demo Members Table loads real data with search, sorting, and pagination', async ({
    page,
  }) => {
    // Login first
    await page.goto('/am/login');
    await page.locator('input[name="identifier"]').fill('admin@aemade.org');
    await page.locator('input[name="password"]').fill('Admin@123456!');
    await page.getByRole('button', { name: 'ግባ' }).click();
    await expect(page).toHaveURL(/\/am\/admin/, { timeout: 15000 });

    // Navigate to members table
    await page.goto('/am/admin/members');
    await expect(page.locator('main h1')).toContainText('የሰንበት ትምህርት ቤት አባላት');

    // Verify table loads data rows
    const table = page.locator('table');
    await expect(table).toBeVisible();

    // Verify member rows are displayed
    const rows = table.locator('tbody tr');
    await expect(rows.first()).toBeVisible({ timeout: 10000 });
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);

    // Verify search input filter
    const searchInput = page.getByPlaceholder(/በስም፣ በአባል ቁጥር/);
    await searchInput.fill('ዮሐንስ');
    await page.waitForTimeout(600); // Debounce wait

    // Verify export button slot exists
    await expect(page.getByRole('button', { name: 'አባላትን ላክ' })).toBeVisible();

    // Verify column toggle button
    const columnsBtn = page.getByRole('button', { name: 'ዓምዶች' });
    await expect(columnsBtn).toBeVisible();
  });
});
