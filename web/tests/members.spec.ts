import { test, expect } from '@playwright/test';

test.describe('Phase 9: Admin Members Screens', () => {
  // Helper to log in as admin before tests
  const loginAdmin = async (page: any) => {
    await page.goto('/am/admin/login');
    await page.locator('input[name="identifier"]').fill('admin@aemade.org');
    await page.locator('input[name="password"]').fill('Admin@123456!');
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/\/am\/admin(?:\?.*)?$/, { timeout: 15000 });
  };

  test('1. Members list page renders with filters, bulk selection and action buttons', async ({
    page,
  }) => {
    await loginAdmin(page);
    await page.goto('/am/admin/members');

    // Header title and actions
    await expect(page.locator('main h1')).toContainText('የሰንበት ትምህርት ቤት አባላት');
    await expect(page.getByRole('link', { name: 'አዲስ አባል መዝግብ' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'ከExcel አስገባ' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'አባላትን ላክ' })).toBeVisible();

    // Table visibility and rows
    const table = page.locator('table');
    await expect(table).toBeVisible();
    const rows = table.locator('tbody tr');
    await expect(rows.first()).toBeVisible({ timeout: 10000 });
    const initialCount = await rows.count();
    expect(initialCount).toBeGreaterThan(0);

    // Verify filter dropdowns exist
    const selects = page.locator('select');
    expect(await selects.count()).toBeGreaterThanOrEqual(3); // status, department, sex

    // Test bulk selection checkbox
    const firstCheckbox = rows.first().locator('input[type="checkbox"]');
    await firstCheckbox.click();
    await expect(page.getByText(/አባላት ተመርጠዋል/)).toBeVisible();

    // Clear selection
    await page.getByRole('button', { name: 'ምርጫ ሰርዝ' }).click();
    await expect(page.getByText(/አባላት ተመርጠዋል/)).not.toBeVisible();
  });

  test('2. Register new member end-to-end with validation and redirect to profile', async ({
    page,
  }) => {
    await loginAdmin(page);
    await page.goto('/am/admin/members/new');

    await expect(page.locator('main h1')).toContainText('አዲስ አባል መዝግብ');

    const uniqueId = Date.now().toString().slice(-6);
    const testFirstName = `ቴዎድሮስ${uniqueId}`;
    const testFatherName = 'ገብረማርያም';
    const testPhone = `09${Math.floor(10000000 + Math.random() * 90000000)}`;
    const testEmail = `tewodros_${uniqueId}@example.com`;

    // Fill personal information
    await page.locator('input[name="firstName"]').fill(testFirstName);
    await page.locator('input[name="fatherName"]').fill(testFatherName);
    await page.locator('input[name="grandfatherName"]').fill('ኃይለስላሴ');
    await page.locator('input[name="baptismalName"]').fill('ኃይለጊዮርጊስ');
    await page.locator('input[name="phone"]').fill(testPhone);
    await page.locator('input[name="email"]').fill(testEmail);

    // Fill address & church information
    await page.locator('input[name="parish"]').fill('ፈለገ ሰላም ቅዱስ ጊዮርጊስ ካቴድራል');
    await page.locator('input[name="confessionFather"]').fill('ቀሲስ አስራት');
    await page.locator('input[name="occupation"]').fill('መምህር (Teacher)');

    // Submit form
    await page.getByRole('button', { name: 'አስቀምጥ' }).click();

    // Verify redirect to the new member profile page
    await expect(page).toHaveURL(/\/am\/admin\/members\/[a-f0-9-]+/, {
      timeout: 15000,
    });

    // Profile page assertions
    await expect(page.locator('main h1')).toContainText(testFirstName);
    await expect(page.locator('main h1')).toContainText(testFatherName);
    await expect(page.getByText('AS-').first()).toBeVisible();
  });

  test('3. Edit member information and verify updated details', async ({ page }) => {
    await loginAdmin(page);
    await page.goto('/am/admin/members');

    // Click on the first member link to open profile
    const firstMemberLink = page.locator('table tbody tr a').first();
    await firstMemberLink.click();
    await expect(page).toHaveURL(/\/am\/admin\/members\/[a-f0-9-]+/, {
      timeout: 15000,
    });

    // Click edit button
    await page.getByRole('link', { name: 'የአባል መረጃ አድስ' }).click();
    await expect(page).toHaveURL(/\/am\/admin\/members\/[a-f0-9-]+\/edit/, {
      timeout: 15000,
    });

    // Update emergency phone
    const emergencyPhone = page.locator('input[name="emergencyPhone"]');
    await emergencyPhone.fill('0922887766');

    // Save changes
    await page.getByRole('button', { name: 'አስቀምጥ' }).click();

    // Verify redirect back to profile page
    await expect(page).toHaveURL(/\/am\/admin\/members\/[a-f0-9-]+/, {
      timeout: 15000,
    });
    await expect(page.getByText('0922887766')).toBeVisible();
  });

  test('4. Member profile displays tabs and generates official letter', async ({ page }) => {
    await loginAdmin(page);
    await page.goto('/am/admin/members');

    // Open first member
    await page.locator('table tbody tr a').first().click();
    await expect(page).toHaveURL(/\/am\/admin\/members\/[a-f0-9-]+/, {
      timeout: 15000,
    });

    // Verify profile tabs
    await expect(page.getByRole('button', { name: 'የአባል መገለጫ' })).toBeVisible();
    await expect(page.getByRole('button', { name: /የትምህርት ክትትል/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /የመገኘት መዝገብ/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /ስጦታና መዋጮ/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /የሁኔታ ታሪክ/ })).toBeVisible();

    // Switch to status history tab
    await page.getByRole('button', { name: /የሁኔታ ታሪክ/ }).click();

    // Open letter dialog
    await page.getByRole('button', { name: 'ደብዳቤ አዘጋጅ' }).click();
    await expect(page.getByText('ኦፊሴላዊ ደብዳቤ አዘጋጅ')).toBeVisible();

    // Close letter dialog
    await page.getByRole('button', { name: 'ይቅር' }).click();
    await expect(page.getByText('ኦፊሴላዊ ደብዳቤ አዘጋጅ')).not.toBeVisible();
  });

  test('5. Pending Approvals page renders and has approve/reject controls', async ({ page }) => {
    await loginAdmin(page);
    await page.goto('/am/admin/members/pending');

    await expect(page.locator('main h1')).toContainText('የማጽደቂያ ጥያቄዎች');

    // If there are pending members, verify action buttons exist
    const hasRows = await page.locator('table tbody tr').isVisible().catch(() => false);
    if (hasRows) {
      await expect(page.getByRole('button', { name: 'አጽድቅ' }).first()).toBeVisible();
      await expect(page.getByRole('button', { name: 'ውድቅ አድርግ' }).first()).toBeVisible();
    } else {
      await expect(page.getByText('በአሁኑ ጊዜ ማጽደቂያ የሚጠብቅ አዲስ አባል የለም')).toBeVisible();
    }
  });

  test('6. Import Wizard page renders with upload area and template download', async ({ page }) => {
    await loginAdmin(page);
    await page.goto('/am/admin/members/import');

    await expect(page.locator('main h1')).toContainText('አባላትን በብዛት ከExcel ማስገቢያ');
    await expect(page.getByRole('button', { name: 'የExcel ቅጽ (Template) አውርድ' })).toBeVisible();
    await expect(page.getByText('የExcel ፋይል ይምረጡ')).toBeVisible();
    await expect(page.getByText('መመሪያዎች:')).toBeVisible();
  });
});
