import { test, expect } from '@playwright/test';

test.describe('Task R8: Church Name and Location Everywhere', () => {
  test('1. Public Header shows school name with church name under it and location in micro-bar', async ({ page }) => {
    await page.goto('/am');

    // Header brand shows School name and Church name
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // Church name in brand
    await expect(header.getByText('ፈለገ ሰላም ቅዱስ ጊዮርጊስ ካቴድራል').first()).toBeVisible();

    // School name in brand
    await expect(header.getByText('አዕማደ ሰላም ሰንበት ትምህርት ቤት').first()).toBeVisible();

    // Top micro-bar contains church name or combined location
    await expect(header.getByText(/ፍኖተ ሰላም|ምዕራብ ጎጃም/).first()).toBeVisible();
  });

  test('2. Public Home Hero displays canonical welcome message and church badge', async ({ page }) => {
    await page.goto('/am');

    // Hero church badge
    const churchBadge = page.locator('[data-testid="hero-church-name"]');
    await expect(churchBadge).toBeVisible();
    await expect(churchBadge).toHaveText('ፈለገ ሰላም ቅዱስ ጊዮርጊስ ካቴድራል');

    // Hero title contains canonical welcome
    const heroTitle = page.locator('[data-testid="hero-title"]');
    await expect(heroTitle).toBeVisible();
    await expect(heroTitle).toContainText('ፈለገ ሰላም ቅዱስ ጊዮርጊስ ካቴድራል');

    // English version check
    await page.goto('/en');
    const heroTitleEn = page.locator('[data-testid="hero-title"]');
    await expect(heroTitleEn).toContainText('Felegeselam Kidus Giyorgis Cathedral');
  });

  test('3. Public Footer displays school, church, and full location line', async ({ page }) => {
    await page.goto('/am');

    const footer = page.locator('footer');
    await expect(footer).toBeVisible();

    // School name and Church name
    await expect(footer.getByText('አዕማደ ሰላም ሰንበት ትምህርት ቤት').first()).toBeVisible();
    await expect(footer.getByText('ፈለገ ሰላም ቅዱስ ጊዮርጊስ ካቴድራል').first()).toBeVisible();

    // Location line contains Finote Selam & West Gojjam
    await expect(footer.getByText(/ፍኖተ ሰላም/).first()).toBeVisible();
    await expect(footer.getByText(/ምዕራብ ጎጃም/).first()).toBeVisible();
  });

  test('4. About page opens with church and town and honors Saint George patron saint', async ({ page }) => {
    await page.goto('/am/about');

    const main = page.locator('main#main-content');
    await expect(main).toBeVisible();

    // Opens with church name and town
    await expect(main.getByText(/ፈለገ ሰላም ቅዱስ ጊዮርጊስ ካቴድራል/).first()).toBeVisible();
    await expect(main.getByText(/ፍኖተ ሰላም/).first()).toBeVisible();

    // Patron Saint is St. George
    await expect(main.getByText(/ቅዱስ ጊዮርጊስ/).first()).toBeVisible();
  });

  test('5. Contact page displays canonical address block and church name', async ({ page }) => {
    await page.goto('/am/contact');

    const main = page.locator('main#main-content');
    await expect(main).toBeVisible();

    // Church name in contact details card
    await expect(main.getByText('ፈለገ ሰላም ቅዱስ ጊዮርጊስ ካቴድራል').first()).toBeVisible();

    // Address block has Finote Selam, West Gojjam, Amhara
    await expect(main.getByText(/ፍኖተ ሰላም/).first()).toBeVisible();
    await expect(main.getByText(/ምዕራብ ጎጃም/).first()).toBeVisible();
    await expect(main.getByText(/አማራ ክልል/).first()).toBeVisible();
  });

  test('6. Member and Admin Login pages show church name below logo', async ({ page }) => {
    // Member Login
    await page.goto('/am/login');
    const memberLoginChurch = page.getByText('ፈለገ ሰላም ቅዱስ ጊዮርጊስ ካቴድራል');
    await expect(memberLoginChurch.first()).toBeVisible();

    // Admin Login
    await page.goto('/am/admin/login');
    const adminLoginChurch = page.getByText('ፈለገ ሰላም ቅዱስ ጊዮርጊስ ካቴድራል');
    await expect(adminLoginChurch.first()).toBeVisible();
    await expect(page.getByText(/ፍኖተ ሰላም|ምዕራብ ጎጃም/).first()).toBeVisible();
  });

  test('7. SEO, Metadata and PlaceOfWorship JSON-LD coordinates', async ({ page }) => {
    await page.goto('/am');

    // Page title contains church name
    await expect(page).toHaveTitle(/Felegeselam Kidus Giyorgis Cathedral|ፈለገ ሰላም/);

    // JSON-LD schema
    const jsonLdScript = page.locator('script[type="application/ld+json"]').first();
    await expect(jsonLdScript).toBeAttached();
    const jsonText = await jsonLdScript.textContent();
    expect(jsonText).toContain('PlaceOfWorship');
    expect(jsonText).toContain('Felegeselam Kidus Giyorgis Cathedral');
    expect(jsonText).toContain('Finote Selam');
    expect(jsonText).toContain('Amhara');
    expect(jsonText).toContain('ET');
  });

  test('8. Registration form defaults parish to Felegeselam Kidus Giyorgis Cathedral', async ({ page }) => {
    await page.goto('/am/register');

    const parishInput = page.locator('input[name="parish"]');
    await expect(parishInput).toBeVisible();
    const parishValue = await parishInput.inputValue();
    expect(parishValue).toContain('ፈለገ ሰላም ቅዱስ ጊዮርጊስ ካቴድራል');
  });
});
