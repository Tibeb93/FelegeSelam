import { test, expect } from '@playwright/test';

test.describe('Aemade Selam Home Page', () => {
  test('should display Amharic version by default with brand titles and calendar', async ({
    page,
  }) => {
    await page.goto('/am');

    // Title and church heading
    await expect(page).toHaveTitle(/አዕማደ ሰላም/);
    await expect(page.locator('h1')).toContainText('አዕማደ ሰላም ሰንበት ትምህርት ቤት');

    // Language switcher presence
    const amharicBtn = page.getByRole('link', { name: 'አማርኛ' });
    const englishBtn = page.getByRole('link', { name: 'EN' });
    await expect(amharicBtn).toBeVisible();
    await expect(englishBtn).toBeVisible();

    // Verify touch target size of primary buttons >= 48px
    const portalBtn = page.getByRole('link', { name: 'የአባላት መግቢያ' });
    const box = await portalBtn.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.height).toBeGreaterThanOrEqual(48);
    }
  });

  test('should switch language to English when clicking EN', async ({ page }) => {
    await page.goto('/am');
    await page.getByRole('link', { name: 'EN' }).click();

    await expect(page).toHaveURL(/\/en/);
    await expect(page.locator('h1')).toContainText('Aemade Selam Sunday School');
    await expect(page.getByRole('link', { name: 'Member Portal' })).toBeVisible();
  });
});
