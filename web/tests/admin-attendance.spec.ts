import { test, expect } from '@playwright/test';

test.describe('TASK R5: Admin-Only Attendance System', () => {
  // Helper to log in as super_admin
  const loginAdmin = async (page: any) => {
    await page.context().clearCookies();
    await page.goto('/am/admin/login');
    await page.locator('input[name="identifier"]').fill('admin@aemade.org');
    await page.locator('input[name="password"]').fill('Admin@123456!');
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/\/am\/admin(?:\?.*)?$/, { timeout: 15000 });
  };

  test('1. Member role cannot access /admin/attendance and is redirected', async ({ page }) => {
    // Attempting direct navigation to /am/admin/attendance while unauthenticated
    await page.goto('/am/admin/attendance');
    await expect(page).toHaveURL(/\/am\/admin\/login\?redirect=.*attendance/, { timeout: 10000 });

    // Login as normal member via /login
    await page.goto('/am/login');
    await page.locator('input[name="identifier"]').fill('member@aemade.org');
    await page.locator('input[name="password"]').fill('Member@123456!');
    await page.getByRole('button', { name: /ግባ|Sign In/i }).click();
    await expect(page).toHaveURL(/\/am\/portal/, { timeout: 15000 });

    // Member portal must NOT display any attendance marking screen or admin attendance link
    await expect(page.locator('a[href*="/admin/attendance"]')).toHaveCount(0);

    // Attempting direct URL access while logged in as member redirects away from admin area
    await page.goto('/am/admin/attendance');
    await expect(page).toHaveURL(/\/am\/admin\/login/, { timeout: 10000 });
  });

  test('2. Admin attendance page layout, Ethiopian/Gregorian dates, live clock, and session dropdown', async ({
    page,
  }) => {
    await loginAdmin(page);
    await page.goto('/am/admin/attendance');

    // Page title and layout
    await expect(page.locator('main h1')).toContainText(/የዛሬው የመገኘት መዝገብ|Today's Attendance/i);

    // Soft blue background check
    const bgContainer = page.locator('div.bg-\\[\\#E8F1FB\\]').first();
    await expect(bgContainer).toBeVisible();

    // Ethiopian date, Gregorian date & live clock
    await expect(page.locator('span').filter({ hasText: '•' }).first()).toBeVisible();

    // Session dropdown is present with active session
    const sessionSelect = page.locator('select').first();
    await expect(sessionSelect).toBeVisible();
    await expect(sessionSelect.locator('option').first()).toBeAttached({ timeout: 10000 });
    const options = await sessionSelect.locator('option').all();
    expect(options.length).toBeGreaterThan(0);

    // Live KPI counters
    await expect(page.getByText('የተገኙ', { exact: true })).toBeVisible();
    await expect(page.getByText('ያልተገኙ', { exact: true })).toBeVisible();
    await expect(page.getByText('ያረፈዱ', { exact: true })).toBeVisible();
    await expect(page.getByText('ፈቃድ', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('ቀሪዎች', { exact: true })).toBeVisible();
    await expect(page.getByText('ተሳታፊዎች', { exact: true })).toBeVisible();

    // Search input is ready & focused
    const searchInput = page.locator('input[placeholder*="የአባል ስም ወይም መለያ ቁጥር"]');
    await expect(searchInput).toBeVisible();
  });

  test('3. Search member by name/ID, select, and mark Present with instant feedback', async ({ page }) => {
    await loginAdmin(page);
    await page.goto('/am/admin/attendance');

    const searchInput = page.locator('input[placeholder*="የአባል ስም ወይም መለያ ቁጥር"]');
    await searchInput.fill('ዮናስ');

    // Wait for dropdown search item to appear
    const searchResultItem = page.locator('button').filter({ hasText: 'ዮናስ ታደሰ' }).first();
    await expect(searchResultItem).toBeVisible({ timeout: 5000 });

    // Click to select
    await searchResultItem.click();

    // Selected member card appears
    await expect(page.locator('h2').filter({ hasText: 'ዮናስ ታደሰ' })).toBeVisible();
    await expect(page.getByText('MEM-0003')).toBeVisible();

    // Big action buttons are visible
    const presentBtn = page.locator('button').filter({ hasText: 'ተገኝቷል' }).first();
    const absentBtn = page.locator('button').filter({ hasText: 'አልተገኘም' }).first();
    const lateBtn = page.locator('button').filter({ hasText: 'አርፍዷል' }).first();
    const excusedBtn = page.locator('button').filter({ hasText: 'ፈቃድ' }).first();

    await expect(presentBtn).toBeVisible();
    await expect(absentBtn).toBeVisible();
    await expect(lateBtn).toBeVisible();
    await expect(excusedBtn).toBeVisible();

    // Click Present
    await presentBtn.click();

    // Undo toast bar appears with member name
    const undoToast = page.locator('div').filter({ hasText: /ተመዝግቧል|Marked/i }).first();
    await expect(undoToast).toBeVisible();
    await expect(page.getByRole('button', { name: /መልስ \(Undo\)|Undo/i })).toBeVisible();

    // Member shows in marked roster table
    const rosterRow = page.locator('tr').filter({ hasText: 'ዮናስ ታደሰ' }).first();
    await expect(rosterRow).toBeVisible();
    await expect(rosterRow.locator('select')).toHaveValue('present');
  });

  test('4. Keyboard shortcuts P, A, L, and Esc for rapid attendance marking', async ({ page }) => {
    await loginAdmin(page);
    await page.goto('/am/admin/attendance');

    const searchInput = page.locator('input[placeholder*="የአባል ስም ወይም መለያ ቁጥር"]');

    // 1. Search and mark Absent with 'A' key
    await searchInput.fill('ዳንኤል');
    const danielResult = page.locator('button').filter({ hasText: 'ዳንኤል ግርማ' }).first();
    await expect(danielResult).toBeVisible({ timeout: 5000 });
    await danielResult.click();

    await expect(page.locator('h2').filter({ hasText: 'ዳንኤል ግርማ' })).toBeVisible();
    // Press 'A' key on page
    await page.keyboard.press('KeyA');

    // Verify marked in roster as absent
    const danielRow = page.locator('tr').filter({ hasText: 'ዳንኤል ግርማ' }).first();
    await expect(danielRow).toBeVisible();
    await expect(danielRow.locator('select')).toHaveValue('absent');

    // 2. Search and mark Late with 'L' key
    await searchInput.fill('ሳራ');
    const saraResult = page.locator('button').filter({ hasText: 'ሳራ በቀለ' }).first();
    await expect(saraResult).toBeVisible({ timeout: 5000 });
    await saraResult.click();

    await expect(page.locator('h2').filter({ hasText: 'ሳራ በቀለ' })).toBeVisible();
    // Press 'L' key on page
    await page.keyboard.press('KeyL');

    // Verify marked in roster as late
    const saraRow = page.locator('tr').filter({ hasText: 'ሳራ በቀለ' }).first();
    await expect(saraRow).toBeVisible();
    await expect(saraRow.locator('select')).toHaveValue('late');

    // 3. Search and cancel selection with 'Esc' key
    await searchInput.fill('ሩት');
    const ruthResult = page.locator('button').filter({ hasText: 'ሩት አስፋው' }).first();
    await expect(ruthResult).toBeVisible({ timeout: 5000 });
    await ruthResult.click();

    await expect(page.locator('h2').filter({ hasText: 'ሩት አስፋው' })).toBeVisible();
    await page.keyboard.press('Escape');

    // Selected member card disappears, returns to idle state
    await expect(page.locator('h2').filter({ hasText: 'ሩት አስፋው' })).toHaveCount(0);
    await expect(page.getByText('አባል በመፈለጊያው ሳጥን ይፈልጉ')).toBeVisible();
  });

  test('5. Undo action immediately reverts attendance status', async ({ page }) => {
    await loginAdmin(page);
    await page.goto('/am/admin/attendance');

    const searchInput = page.locator('input[placeholder*="የአባል ስም ወይም መለያ ቁጥር"]');

    // Search for Ruth
    await searchInput.fill('ሩት');
    const ruthResult = page.locator('button').filter({ hasText: 'ሩት አስፋው' }).first();
    await expect(ruthResult).toBeVisible({ timeout: 5000 });
    await ruthResult.click();

    // Mark as Present
    const presentBtn = page.locator('button').filter({ hasText: 'ተገኝቷል' }).first();
    await presentBtn.click();

    // Undo toast appears
    const undoBtn = page.getByRole('button', { name: /መልስ \(Undo\)|Undo/i }).first();
    await expect(undoBtn).toBeVisible();

    // Click Undo
    await undoBtn.click();

    // Status is reverted: Ruth should no longer be in the marked roster (was unmarked)
    await expect(page.locator('tr').filter({ hasText: 'ሩት አስፋው' })).toHaveCount(0);
  });

  test('6. In-line status change in the marked roster table updates immediately', async ({ page }) => {
    await loginAdmin(page);
    await page.goto('/am/admin/attendance');

    // Select Daniel (marked absent in test 4)
    const danielRow = page.locator('tr').filter({ hasText: 'ዳንኤል ግርማ' }).first();
    await expect(danielRow).toBeVisible();

    // Change status to 'present' using the inline select
    const statusSelect = danielRow.locator('select');
    await statusSelect.selectOption('present');

    // Verify it stays present
    await expect(statusSelect).toHaveValue('present');
  });

  test('7. Close Session and Reopen Session by Super Admin', async ({ page }) => {
    await loginAdmin(page);
    await page.goto('/am/admin/attendance');

    // Click Close Session button
    const closeBtn = page.getByRole('button', { name: /ክፍለ-ጊዜውን ዝጋ|Close Session/i });
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();

    // Confirm dialog appears
    const confirmBtn = page.getByRole('button', { name: /አዎ.*ዝጋ|Close/i }).first();
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    // Session badge now shows Closed
    await expect(page.getByText('የተዘጋ (Closed)')).toBeVisible({ timeout: 5000 });

    // Marking controls / search are disabled
    const searchInput = page.locator('input[placeholder*="የአባል ስም ወይም መለያ ቁጥር"]');
    await expect(searchInput).toBeDisabled();

    // Super Admin sees Reopen Session button
    const reopenBtn = page.getByRole('button', { name: /ክፍለ-ጊዜውን መልሰው ይክፈቱ|Reopen Session/i });
    await expect(reopenBtn).toBeVisible();
    await reopenBtn.click();

    // Session badge returns to Open
    await expect(page.getByText('ክፍት (Open)')).toBeVisible({ timeout: 5000 });
    await expect(searchInput).toBeEnabled();
  });
});
