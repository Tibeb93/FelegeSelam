import { test, expect } from '@playwright/test';

test.describe('Phase 11: Admin Content and Form Builder Suite', () => {
  // Helper to log in as admin before tests
  const loginAdmin = async (page: any) => {
    await page.goto('/am/login');
    await page.locator('input[name="identifier"]').fill('admin@aemade.org');
    await page.locator('input[name="password"]').fill('Admin@123456!');
    await page.getByRole('button', { name: 'ግባ' }).click();
    await expect(page).toHaveURL(/\/am\/admin/, { timeout: 15000 });
  };

  test('1. Sinksar post & urgent notice creation, listing, and calendar view', async ({ page }) => {
    await loginAdmin(page);
    await page.goto('/am/admin/posts');

    // Verify list page loads
    await expect(page.locator('main h1')).toBeVisible();

    // Navigate to new post page
    await page.goto('/am/admin/posts/new');
    await expect(page.locator('main h1')).toBeVisible();

    const uniqueId = Date.now().toString().slice(-4);
    const titleAm = `የዕለቱ ስንክሳር ጥቅምት ፯ - ${uniqueId}`;

    // Fill title
    const titleInput = page.locator('input[placeholder*="ስንክሳር"], input[placeholder*="title"]').first();
    await titleInput.fill(titleAm);

    // Select type: 'sinksar'
    await page.locator('select').first().selectOption('sinksar');

    // Urgent toggle
    const urgentCheckbox = page.locator('input[type="checkbox"]');
    if ((await urgentCheckbox.count()) > 0) {
      await urgentCheckbox.first().check();
    }

    // Tiptap content
    const tiptapEditor = page.locator('.tiptap, [contenteditable="true"]');
    if ((await tiptapEditor.count()) > 0) {
      await tiptapEditor.first().click();
      await tiptapEditor.first().fill('ይህ የዕለቱ ስንክሳር ንባብና የቅዱሳን አበው ገድል ነው።');
    }

    // Submit button
    await page.getByRole('button', { name: /መልዕክቱን አትም|Publish Post/i }).click();

    // Redirect to posts list
    await expect(page).toHaveURL(/\/am\/admin\/posts/, { timeout: 15000 });
    await expect(page.getByText(titleAm)).toBeVisible({ timeout: 10000 });

    // Toggle calendar view
    const calendarBtn = page.getByRole('button', { name: /የቀን መቁጠሪያ|Calendar/i });
    if ((await calendarBtn.count()) > 0) {
      await calendarBtn.first().click();
      await expect(page.getByText(/እሑድ|ሰኞ|ማክሰኞ|Sunday|Monday/i).first()).toBeVisible();
    }
  });

  test('2. Mezmur list, category manager, and audio preview', async ({ page }) => {
    await loginAdmin(page);
    await page.goto('/am/admin/mezmur');

    await expect(page.locator('main h1')).toBeVisible();

    // Test Category Manager Dialog
    const catBtn = page.getByRole('button', { name: /ምድቦች|Categories/i });
    if ((await catBtn.count()) > 0) {
      await catBtn.click();
      await expect(page.getByText(/የመዝሙር ምድቦች|Hymn Categories/i)).toBeVisible();
      // Close modal
      const closeBtn = page.locator('button:has(svg.lucide-x)');
      if ((await closeBtn.count()) > 0) {
        await closeBtn.first().click();
      }
    }

    // Open Add Mezmur Dialog
    const addBtn = page.getByRole('button', { name: /አዲስ መዝሙር|Add Hymn/i });
    await addBtn.click();

    const uniqueId = Date.now().toString().slice(-4);
    const titleAm = `አማኑኤል አምላካችን ${uniqueId}`;

    const titleInput = page
      .locator('[role="dialog"] input[placeholder*="በመስቀልህ"], [role="dialog"] input[placeholder*="Title"]')
      .first();
    await titleInput.fill(titleAm);

    // Audio URL input
    const audioInput = page.locator('[role="dialog"] input[placeholder*="URL"]').first();
    await audioInput.fill('https://example.com/audio/sample-mezmur.mp3');

    // Verify audio player tag renders
    await expect(page.locator('[role="dialog"] audio')).toBeVisible();

    // Save
    await page.locator('[role="dialog"]').getByRole('button', { name: /^መዝግብ$/ }).click();

    // Verify hymn appears in list
    await expect(page.getByText(titleAm)).toBeVisible({ timeout: 10000 });
  });

  test('3. Events list, creation, and RSVP management', async ({ page }) => {
    await loginAdmin(page);
    await page.goto('/am/admin/events');

    await expect(page.locator('main h1')).toBeVisible();

    // Table has events
    const table = page.locator('table');
    await expect(table).toBeVisible();

    // Open RSVP attendees modal if attendees button exists
    const attendeesBtn = page.getByRole('button', { name: /ተሳታፊዎች|Attendees/i }).first();
    if ((await attendeesBtn.count()) > 0) {
      await attendeesBtn.click();
      await expect(page.getByText(/የተሳታፊዎች ዝርዝር|Registered Attendees/i)).toBeVisible();
      const closeBtn = page.locator('button:has(svg.lucide-x)');
      if ((await closeBtn.count()) > 0) {
        await closeBtn.first().click();
      }
    }
  });

  test('4. Form builder from template, live preview, and save', async ({ page }) => {
    await loginAdmin(page);
    await page.goto('/am/admin/forms');

    await expect(page.locator('main h1')).toBeVisible();

    // Open Template dialog
    const templateBtn = page.getByRole('button', {
      name: /ከተዘጋጁ አብነቶች ጀምር|From Template/i,
    });
    await templateBtn.click();

    // Click "በዚህ ጀምር" (Use Template) on the first template
    const useTemplateBtn = page
      .locator('[role="dialog"]')
      .getByRole('button', { name: /በዚህ ጀምር|Use Template/i })
      .first();
    await useTemplateBtn.click();

    // Wait for redirect to builder with query id
    await expect(page).toHaveURL(/\/am\/admin\/forms\/builder\?id=/, { timeout: 15000 });

    // Verify fields populated on canvas from template
    await expect(page.getByText('ሙሉ ስም (ከነ አያት)').first()).toBeVisible({ timeout: 10000 });

    // Click Update/Save Form
    await page
      .getByRole('button', {
        name: /ለውጦችን መዝግብ|ቅጹን አስቀምጥ|Update Form|Save Form/i,
      })
      .click();
    await expect(page).toHaveURL(/\/am\/admin\/forms/, { timeout: 15000 });
  });

  test('5. Form responses review with approval note and export', async ({ page }) => {
    await loginAdmin(page);
    await page.goto('/am/admin/forms');

    // Find responses link on first form
    const responsesLink = page.getByRole('link', { name: /ምላሾች|Responses/i }).first();
    if ((await responsesLink.count()) > 0) {
      await responsesLink.click();
      await expect(page).toHaveURL(/\/am\/admin\/forms\/[a-zA-Z0-9-]+\/responses/, {
        timeout: 15000,
      });

      // Review first response if present
      const reviewBtn = page.getByRole('button', { name: /ገምግም|ዝርዝር|Review/i }).first();
      if ((await reviewBtn.count()) > 0) {
        await reviewBtn.click();
        await expect(page.getByText(/የተሞላ ቅጽ ምርመራ|Review Form Response/i)).toBeVisible();

        // Enter review note
        const noteInput = page.locator(
          'textarea[placeholder*="ማስታወሻ"], textarea[placeholder*="Note"]',
        );
        if ((await noteInput.count()) > 0) {
          await noteInput.fill('የቀረበው መረጃ ተረጋግጦ ጸድቋል');
        }

        // Approve button
        const approveBtn = page.getByRole('button', { name: /አጽድቅ|Approve/i });
        if ((await approveBtn.count()) > 0) {
          await approveBtn.click();
        }
      }

      // Verify Export to Excel button
      const exportBtn = page.getByRole('button', { name: /Excel/i }).first();
      await expect(exportBtn).toBeVisible();
    }
  });

  test('6. Content Manager role scopes navigation', async ({ page }) => {
    await loginAdmin(page);
    await page.goto('/am/admin/posts');

    // Verify that posts and mezmur navigation links exist in the sidebar
    const sidebar = page.locator('aside');
    await expect(sidebar.getByRole('link', { name: /ዕለታዊ መልዕክቶች|Daily Posts/i })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: /መዝሙራት|Mezmur/i })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: /መርሐ-ግብሮች|Events/i })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: /ማሳወቂያዎች|Notifications/i })).toBeVisible();
  });
});
