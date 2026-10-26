import { test, expect } from '@playwright/test';

test.describe('TASK R4: Admin-Only Entry Page & Staff/Member Separation', () => {
  test('1. Public header displays small gold Admin Login button linking to /admin/login', async ({ page }) => {
    await page.goto('/am');

    // Header has the small gold button
    const adminLoginBtn = page.locator('header a[href*="/admin/login"]').first();
    await expect(adminLoginBtn).toBeVisible({ timeout: 10000 });
    await expect(adminLoginBtn).toHaveClass(/bg-\[#F2B233\]/);
    await expect(adminLoginBtn).toContainText(/የአስተዳደር መግቢያ|Admin Login/i);

    // Clicking it navigates to /am/admin/login
    await adminLoginBtn.click();
    await expect(page).toHaveURL(/\/am\/admin\/login/);
  });

  test('2. Dedicated /admin/login page layout verification', async ({ page }) => {
    await page.goto('/am/admin/login');

    // Navy background
    await expect(page.locator('main').first()).toBeVisible();

    // Title & Logo
    await expect(page.locator('h1')).toContainText(/አዕማደ ሰላም ሰንበት ትምህርት ቤት|Aemade Selam/i);
    await expect(page.locator('h2')).toContainText(/የአስተዳደር መግቢያ|Admin Sign In/i);

    // Form fields
    await expect(page.locator('input[name="identifier"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Must NOT contain public menu, register links, or social links
    await expect(page.locator('a[href*="/register"]')).toHaveCount(0);
    await expect(page.locator('nav a[href*="/news"]')).toHaveCount(0);
    await expect(page.locator('nav a[href*="/about"]')).toHaveCount(0);

    // Has back to home link
    await expect(page.locator('a[href="/am"]').first()).toBeVisible();
  });

  test('3. Unauthenticated access to /admin/* redirects to /admin/login', async ({ page, context }) => {
    // Clear cookies
    await context.clearCookies();

    // Attempt to access admin dashboard directly
    await page.goto('/am/admin');

    // Must be redirected to /am/admin/login with redirect parameter
    await expect(page).toHaveURL(/\/am\/admin\/login\?redirect=.*admin/, { timeout: 10000 });
  });

  test('4. Member credentials cannot log into /admin/login (gets generic error)', async ({ page }) => {
    await page.goto('/am/admin/login');

    // Enter member credentials
    await page.locator('input[name="identifier"]').fill('member@aemade.org');
    await page.locator('input[name="password"]').fill('Member@123456!');
    await page.locator('button[type="submit"]').click();

    // Expect generic error message (exact same as wrong password)
    await expect(page.getByText(/የተሳሳተ የተጠቃሚ ስም ወይም የይለፍ ቃል|Invalid credentials/i).first()).toBeVisible({ timeout: 10000 });

    // Ensure we are STILL on /admin/login, not in admin dashboard
    await expect(page).toHaveURL(/\/am\/admin\/login/);
  });

  test('5. Staff cannot log in via member portal /login (directed to admin door)', async ({ page }) => {
    await page.goto('/am/login');

    // Enter staff credentials
    await page.locator('input[name="identifier"]').fill('admin@aemade.org');
    await page.locator('input[name="password"]').fill('Admin@123456!');
    await page.getByRole('button', { name: /ግባ|Sign In/i }).click();

    // Expect message rejecting staff from member portal
    await expect(page.getByText(/ይህ መግቢያ ለአባላት ብቻ ነው|This portal is for members only/i).first()).toBeVisible({ timeout: 10000 });

    // Has direct helpful link to admin login
    const adminDoorLink = page.locator('a[href*="/admin/login"]').first();
    await expect(adminDoorLink).toBeVisible();

    // Ensure user was NOT logged in to /admin or /portal
    await expect(page).toHaveURL(/\/am\/login/);
  });

  test('6. Staff logs into /admin/login successfully and enters admin dashboard', async ({ page }) => {
    await page.goto('/am/admin/login');

    // Fill valid staff credentials
    await page.locator('input[name="identifier"]').fill('admin@aemade.org');
    await page.locator('input[name="password"]').fill('Admin@123456!');
    await page.locator('button[type="submit"]').click();

    // Successfully reaches admin dashboard
    await expect(page).toHaveURL(/\/am\/admin$/, { timeout: 15000 });
    await expect(page.locator('main h1')).toBeVisible();
  });

  test('7. Admin top bar has Sign Out and Sign Out Everywhere buttons', async ({ page }) => {
    await page.goto('/am/admin/login');
    await page.locator('input[name="identifier"]').fill('admin@aemade.org');
    await page.locator('input[name="password"]').fill('Admin@123456!');
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/\/am\/admin$/, { timeout: 15000 });

    // Open user menu
    const profileBtn = page.locator('button[aria-label="User profile menu"]');
    await profileBtn.click();

    // Check for Sign Out button in top bar user menu
    await expect(page.locator('header').getByRole('button', { name: 'ውጣ', exact: true })).toBeVisible();

    // Check for Sign Out Everywhere button in top bar user menu
    await expect(page.locator('header').getByRole('button', { name: /ከሁሉም መሳሪያዎች ውጣ|Sign Out Everywhere/i })).toBeVisible();
  });
});
