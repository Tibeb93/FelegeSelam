import { test, expect } from '@playwright/test';

test.describe('TASK R6: Site Settings (Super Admin Control)', () => {
  // Helper to log in as Super Admin via dedicated Admin Login door
  const loginSuperAdmin = async (page: any) => {
    await page.context().clearCookies();
    await page.goto('/am/admin/login');
    await page.locator('input[name="identifier"]').fill('admin@aemade.org');
    await page.locator('input[name="password"]').fill('Admin@123456!');
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/\/am\/admin(?:\?.*)?$/, { timeout: 15000 });
  };

  test('1. Unauthenticated users cannot access /admin/site and are redirected to /admin/login', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/am/admin/site');
    await expect(page).toHaveURL(/\/am\/admin\/login\?redirect=.*site/, { timeout: 10000 });
  });

  test('2. Super Admin can access /admin/site with all 7 control tabs', async ({ page }) => {
    await loginSuperAdmin(page);
    await page.goto('/am/admin/site');

    // Verify main page header
    await expect(page.locator('main h1')).toContainText(/የጣቢያ ቅንብሮች|Site Identity & Appearance/i);

    // Verify presence of all 7 tabs
    await expect(page.locator('[data-testid="tab-identity"]')).toBeVisible();
    await expect(page.locator('[data-testid="tab-appearance"]')).toBeVisible();
    await expect(page.locator('[data-testid="tab-home"]')).toBeVisible();
    await expect(page.locator('[data-testid="tab-about"]')).toBeVisible();
    await expect(page.locator('[data-testid="tab-system"]')).toBeVisible();
    await expect(page.locator('[data-testid="tab-roles"]')).toBeVisible();
    await expect(page.locator('[data-testid="tab-danger"]')).toBeVisible();

    // Verify navigating between tabs activates corresponding panels
    await page.locator('[data-testid="tab-appearance"]').click();
    await expect(page.getByText(/የቀለም ንፅፅር ደረጃ|WCAG Contrast Ratio/i)).toBeVisible();

    await page.locator('[data-testid="tab-home"]').click();
    await expect(page.getByText(/የመነሻ ገጽ ይዘቶች|Home Content/i).first()).toBeVisible();

    await page.locator('[data-testid="tab-roles"]').click();
    await expect(page.getByText(/የሚናዎችና የፈቃዶች|Roles & Permissions/i).first()).toBeVisible();

    await page.locator('[data-testid="tab-danger"]').click();
    await expect(page.getByText(/የተሰረዙ አባላትን መልስ|Restore Soft-Deleted Members/i)).toBeVisible();
  });

  test('3. Appearance Tab: Desktop vs Mobile Viewport Switcher & WCAG Contrast Calculator', async ({ page }) => {
    await loginSuperAdmin(page);
    await page.goto('/am/admin/site');

    // Switch to Appearance tab
    await page.locator('[data-testid="tab-appearance"]').click();

    // Verify Contrast Calculator badge is rendered
    await expect(page.getByText(/Pass AA|Pass AAA/i).first()).toBeVisible();

    // Test viewport toggle in preview
    const mobileBtn = page.getByRole('button', { name: /Mobile/i }).first();
    const desktopBtn = page.getByRole('button', { name: /Desktop/i }).first();

    await expect(mobileBtn).toBeVisible();
    await expect(desktopBtn).toBeVisible();

    // Click Mobile and verify frame shrinks
    await mobileBtn.click();
    const previewBox = page.locator('[data-testid="preview-frame"]');
    await expect(previewBox).toBeVisible();
    await expect(previewBox).toHaveClass(/max-w-\[360px\]/);

    // Click Desktop and verify frame expands
    await desktopBtn.click();
    await expect(previewBox).toHaveClass(/w-full/);
  });

  test('4. Super Admin updates school name and tagline; changes reflect immediately on public website without redeploy', async ({
    page,
  }) => {
    await loginSuperAdmin(page);
    await page.goto('/am/admin/site');

    // Tab 1: Identity
    await page.locator('[data-testid="tab-identity"]').click();

    const uniqueSuffix = 'ተዋሕዶ ማዕከል';
    const testAmharicName = `አዕማደ ሰላም ${uniqueSuffix}`;
    const testEnglishName = 'Aemade Selam Tewahedo Center';
    const testTagline = 'በሃይማኖት ጽኑ፥ በመልካም ምግባር አብሩ (የቀጥታ ማስተካከያ)';

    // Fill in new values
    const inputAm = page.locator('[data-testid="input-name-am"]');
    await inputAm.clear();
    await inputAm.fill(testAmharicName);

    const inputEn = page.locator('[data-testid="input-name-en"]');
    await inputEn.clear();
    await inputEn.fill(testEnglishName);

    const inputTagline = page.locator('[data-testid="input-tagline-am"]');
    await inputTagline.clear();
    await inputTagline.fill(testTagline);

    // Save changes
    await page.locator('[data-testid="save-site-settings-btn"]').click();

    // Wait for success toast notification
    await expect(
      page.getByText('ቅንብሩ በተሳካ ሁኔታ ተቀምጧል').first(),
    ).toBeVisible({ timeout: 10000 });

    // Navigate to public home page (Amharic)
    await page.goto('/am');

    // Verify public header reflects the updated school name dynamically
    await expect(page.locator('header').getByText(testAmharicName)).toBeVisible({ timeout: 10000 });

    // Navigate to public home page (English)
    await page.goto('/en');

    // Verify public header reflects the updated English school name dynamically
    await expect(page.locator('header').getByText(testEnglishName)).toBeVisible({ timeout: 10000 });
  });

  test('5. Version History Drawer opens, lists versions, and Reset to Default restores initial branding', async ({
    page,
  }) => {
    await loginSuperAdmin(page);
    await page.goto('/am/admin/site');

    // Open Version History
    await page.getByRole('button', { name: /የቀደሙ ቅጂዎች|Version History/i }).click();

    // Drawer opens with versions
    const drawer = page.locator('[data-testid="version-history-drawer"]');
    await expect(drawer).toBeVisible();

    // Close drawer
    await drawer.locator('button').first().click();
    await expect(drawer).toHaveCount(0);

    // Reset Identity to Default
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    await page.getByRole('button', { name: /ወደ መደበኛ መልስ|Reset Tab/i }).click();

    // Verify toast confirms reset
    await expect(
      page.getByText(/ወደ መደበኛ ሁኔታ ተመልሷል|Reset to default/i).first(),
    ).toBeVisible({ timeout: 10000 });

    // Check public page reverted to default
    await page.goto('/am');
    await expect(page.locator('header').getByText('አዕማደ ሰላም ሰንበት ትምህርት ቤት')).toBeVisible({ timeout: 10000 });
  });

  test('6. Danger Zone requires exact uppercase confirmation strings to execute destructive actions', async ({
    page,
  }) => {
    await loginSuperAdmin(page);
    await page.goto('/am/admin/site');

    // Navigate to Danger Zone tab
    await page.locator('[data-testid="tab-danger"]').click();

    // Click Purge Audit Logs action
    await page.locator('[data-testid="btn-open-purge-modal"]').click();

    // Modal opens
    await expect(page.getByText(/የኦዲት መዝገብን ለማጽዳት ያረጋግጡ|Confirm Audit Log Purge/i)).toBeVisible();

    const confirmBtn = page.locator('[data-testid="btn-confirm-danger-action"]');
    const confirmInput = page.locator('[data-testid="input-typed-confirmation"]');

    // Initially disabled
    await expect(confirmBtn).toBeDisabled();

    // Lowercase should keep it disabled
    await confirmInput.fill('purge');
    await expect(confirmBtn).toBeDisabled();

    // Random string should keep it disabled
    await confirmInput.fill('CONFIRM');
    await expect(confirmBtn).toBeDisabled();

    // Exact uppercase "PURGE" should enable the button
    await confirmInput.fill('PURGE');
    await expect(confirmBtn).toBeEnabled();

    // Cancel modal without executing
    await page.getByRole('button', { name: /ይቅር|Cancel/i }).click();
    await expect(page.locator('[data-testid="btn-confirm-danger-action"]')).toHaveCount(0);
  });
});
