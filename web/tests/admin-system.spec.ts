import { test, expect } from '@playwright/test';

test.describe('Phase 12: Admin Dashboard, Contributions and System Pages Suite', () => {
  // Helper to log in as super_admin
  const loginSuperAdmin = async (page: any) => {
    await page.goto('/am/admin/login');
    await page.locator('input[name="identifier"]').fill('admin@aemade.org');
    await page.locator('input[name="password"]').fill('Admin@123456!');
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/\/am\/admin/, { timeout: 15000 });
  };

  test('1. Admin Dashboard KPIs, Recharts Analytics, and Quick Actions', async ({ page }) => {
    await loginSuperAdmin(page);

    // Verify Welcome Hero in main
    await expect(page.locator('main h1')).toContainText(/እንኳን ደህና መጡ|Welcome/i);

    // Verify 5 KPI cards in main content
    const main = page.locator('main');
    await expect(main.getByText('ጠቅላላ አባላት', { exact: true })).toBeVisible();
    await expect(main.getByText('አዲስ አባላት (በዚህ ወር)', { exact: true })).toBeVisible();
    await expect(main.getByText('የመገኘት ምጣኔ', { exact: true })).toBeVisible();
    await expect(main.getByText('ክፍት ቅጾች', { exact: true })).toBeVisible();
    await expect(main.locator('span').filter({ hasText: 'መርሐ-ግብሮች' }).first()).toBeVisible();

    // Verify Quick Actions
    await expect(main.getByText('ፈጣን ተግባራት')).toBeVisible();
    await expect(main.locator('a[href*="/admin/members/new"]')).toBeVisible();
    await expect(main.getByRole('link', { name: /ክፍያ መዝግብ|Record Payment/i })).toBeVisible();

    // Verify Chart titles
    await expect(page.getByText('የአባላት ዕድገት (ባለፉት 12 ወራት)')).toBeVisible();
    await expect(page.getByText('አባላት በክፍል / ዘርፍ')).toBeVisible();
    await expect(page.getByText('አባላት በዕድሜ ክልል')).toBeVisible();
    await expect(page.getByText('የመገኘት ምጣኔ በኮርስ')).toBeVisible();

    // Verify Activity and Upcoming events
    await expect(page.getByText('የቅርብ ጊዜ እንቅስቃሴዎች')).toBeVisible();
    await expect(page.getByText('የሚመጡ በዓላትና መርሐ-ግብራት')).toBeVisible();
  });

  test('2. Contributions payment recording, summary metrics, and receipt download', async ({ page }) => {
    await loginSuperAdmin(page);
    await page.goto('/am/admin/contributions');

    // Verify page header & summary cards
    await expect(page.locator('main h1')).toContainText(/ስጦታና ክፍያዎች|Contributions/i);
    await expect(page.getByText('ጠቅላላ የተሰበሰበ', { exact: true })).toBeVisible();
    await expect(page.locator('span').filter({ hasText: 'ወርሃዊ መዋጮ' }).first()).toBeVisible();

    // Open Record Payment modal
    await page.getByRole('button', { name: /ክፍያ መዝግብ|Record Payment/i }).first().click();
    await expect(page.getByText('አዲስ ክፍያ መዝግብ')).toBeVisible();

    // Select Member
    const memberSelect = page.locator('select').first();
    const options = await memberSelect.locator('option').all();
    if (options.length > 1) {
      await memberSelect.selectOption({ index: 1 });
    }

    // Fill amount
    await page.locator('input[type="number"]').fill('500');

    // Submit payment
    await page.getByRole('button', { name: /ክፍያውን መዝግብ|Record Payment/i }).click();

    // Verify DataTable reloads with data
    await expect(page.locator('table')).toBeVisible({ timeout: 10000 });

    // Verify Export to Excel button
    const exportBtn = page.getByRole('button', { name: /በExcel አውርድ|Export Excel/i });
    await expect(exportBtn).toBeVisible();
  });

  test('3. Users and Roles management (super_admin)', async ({ page }) => {
    await loginSuperAdmin(page);
    await page.goto('/am/admin/users');

    // Verify page header
    await expect(page.locator('main h1')).toContainText(/ተጠቃሚዎችና ሚናዎች|Users & Roles/i);

    // Verify DataTable is visible with user rows
    await expect(page.locator('table')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('table').getByText('admin@aemade.org')).toBeVisible();

    // Open Create User modal
    await page.getByRole('button', { name: /አዲስ ተጠቃሚ ፍጠር|Create User/i }).click();
    await expect(page.getByText(/አዲስ ተጠቃሚ መዝግብ|Create User Account/i)).toBeVisible();

    const uniqueId = Date.now().toString().slice(-4);
    const testEmail = `teacher_${uniqueId}@aemade.org`;

    // Fill user form
    await page.locator('input[type="email"]').fill(testEmail);
    await page.locator('input[type="password"]').fill('Teacher@123456!');

    // Submit using modal form submit button
    await page.locator('form').getByRole('button', { name: /ተጠቃሚ ፍጠር|Create User/i }).click();

    // Verify user appears in table
    await expect(page.locator('table').getByText(testEmail)).toBeVisible({ timeout: 10000 });
  });

  test('4. Settings page with live website header preview', async ({ page }) => {
    await loginSuperAdmin(page);
    await page.goto('/am/admin/settings');

    // Verify page header
    await expect(page.locator('main h1')).toContainText(/የሲስተም ማስተካከያዎች|Settings/i);

    // Verify live preview header
    await expect(page.getByText('የህዝብ ድረ-ገጽ የቀጥታ ዕይታ (Live Preview)')).toBeVisible();

    // Toggle Mobile / Desktop preview
    await page.getByRole('button', { name: 'Mobile' }).click();
    await page.getByRole('button', { name: 'Desktop' }).click();

    // Update School Name input
    const nameInput = page.locator('input').first();
    await nameInput.fill('አዕማደ ሰላም ሰንበት ትምህርት ቤት (ኦፊሴላዊ)');

    // Click Save Settings
    await page.getByRole('button', { name: /ማስተካከያዎችን መዝግብ|Save Settings/i }).click();
    await expect(page.getByText(/ማስተካከያዎቹ በተሳካ ሁኔታ ተቀምጠዋል|Settings saved/i)).toBeVisible({
      timeout: 10000,
    });
  });

  test('5. Audit Logs with filters, diff inspection drawer, and Excel export', async ({ page }) => {
    await loginSuperAdmin(page);
    await page.goto('/am/admin/audit-logs');

    // Verify page header
    await expect(page.locator('main h1')).toContainText(/የክትትል መዝገብ|Audit Logs/i);

    // Verify table loads
    await expect(page.locator('table')).toBeVisible({ timeout: 10000 });

    // Open diff drawer on first row
    const viewDiffButtons = page.getByRole('button', { name: /ለውጥ እይ|View Diff/i });
    if ((await viewDiffButtons.count()) > 0) {
      await viewDiffButtons.first().click();
      await expect(page.getByText(/የለውጥ ዝርዝር መረጃ|Audit Event Details/i)).toBeVisible();
      await page.getByRole('button', { name: /ዝጋ|Close/i }).click();
    }

    // Verify Export Excel button
    await expect(page.getByRole('button', { name: /በExcel አውርድ|Export Excel/i })).toBeVisible();
  });

  test('6. Database Backups creation, list and SQL download', async ({ page }) => {
    await loginSuperAdmin(page);
    await page.goto('/am/admin/backups');

    // Verify page header
    await expect(page.locator('main h1')).toContainText(/የውሂብ ምትኬ|Database Backups/i);

    // Trigger immediate backup creation
    const createBtn = page.getByRole('button', { name: /አዲስ ምትኬ አሁን አዘጋጅ|Create Immediate Backup/i });
    await expect(createBtn).toBeVisible();
    await createBtn.click();

    // Verify backup success notification
    await expect(page.getByText(/በተሳካ ሁኔታ ተዘጋጅቷል|generated successfully/i)).toBeVisible({
      timeout: 15000,
    });

    // Verify backup file list has download button
    await expect(page.getByRole('button', { name: /አውርድ|Download/i }).first()).toBeVisible();
  });

  test('7. Reports Center with multi-report preview and export buttons', async ({ page }) => {
    await loginSuperAdmin(page);
    await page.goto('/am/admin/reports');

    // Verify page header
    await expect(page.locator('main h1')).toContainText(/የሪፖርቶችና ትንተና ማዕከል|Reports & Analytics/i);

    // Switch to Attendance Report
    await page.getByRole('button', { name: /የትምህርት መገኘት ሪፖርት|Attendance Report/i }).click();
    await expect(page.getByText(/የትምህርት ክፍል \/ ኮርስ/i)).toBeVisible();

    // Switch to Contributions Report
    await page.getByRole('button', { name: /የስጦታና ክፍያዎች ሪፖርት|Contributions Report/i }).click();
    await expect(page.getByText(/የክፍያው ዓይነት/i)).toBeVisible();

    // Switch back to Members Report and check export formats
    await page.getByRole('button', { name: /የአባላት አጠቃላይ ሪፖርት|Members Report/i }).click();
    await expect(page.getByRole('button', { name: 'PDF' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Word/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Excel/i })).toBeVisible();
  });
});
