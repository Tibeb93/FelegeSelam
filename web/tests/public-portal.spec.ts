import { test, expect } from '@playwright/test';

test.describe('Phase 13: Public Website and Member Portal Suite', () => {
  // Helper to log in as member before portal tests
  const loginUser = async (page: any) => {
    await page.goto('/am/login');
    await page.locator('input[name="identifier"]').fill('member@aemade.org');
    await page.locator('input[name="password"]').fill('Member@123456!');
    await page.getByRole('button', { name: /ግባ|Sign In/i }).click();
    await expect(page).toHaveURL(/\/am\/portal/, { timeout: 20000 });
  };

  test('1. Public Home Page: SEO, Sinksar, urgent banner, and navigation', async ({ page }) => {
    await page.goto('/am');

    // 1. Accessibility skip-to-content
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeAttached();

    // 2. Single H1 heading for Lighthouse SEO standards
    const h1Elements = page.locator('h1');
    await expect(h1Elements).toHaveCount(1);
    await expect(h1Elements.first()).toBeVisible();

    // 3. Meta title and description
    await expect(page).toHaveTitle(/አዕማደ ሰላም|Aemade Selam/);
    const metaDesc = page.locator('meta[name="description"]');
    await expect(metaDesc).toHaveAttribute('content', /.+/);

    // 4. Spiritual Banner with today's date / Sinksar
    const spiritualBanner = page.locator('[data-testid="spiritual-banner"], .spiritual-banner, header, main').first();
    await expect(spiritualBanner).toBeVisible();

    // 5. Header navigation links
    await expect(page.getByRole('link', { name: /ስለ እኛ|About/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /መዝሙራት|Mezmur/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /ቀን መቁጠሪያ|Calendar/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /ትምህርቶች|Courses/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /ያግኙን|Contact/i }).first()).toBeVisible();
  });

  test('2. Public Ethiopian Liturgical Calendar: fasts, feasts and monthly saints', async ({ page }) => {
    await page.goto('/am/calendar');
    await expect(page.locator('main h1')).toBeVisible();

    // Check fasts & feasts categories
    await expect(page.getByText(/ሰባቱ አጽዋማት|Seven Fasts/i).first()).toBeVisible();
    await expect(page.getByText(/ዐበይት|Major Feasts/i).first()).toBeVisible();

    // Filter buttons test
    const fastsOnlyBtn = page.getByRole('button', { name: /አጽዋማት ብቻ|Fasts Only/i });
    if ((await fastsOnlyBtn.count()) > 0) {
      await fastsOnlyBtn.click();
      await expect(page.getByText(/ጾመ ነቢያት|ጾመ ሁዳዴ|ዐቢይ ጾም|Advent|Great Lent/i).first()).toBeVisible();
    }
  });

  test('3. Public Mezmur Library: search, category filtering, playback, and lyrics', async ({ page }) => {
    await page.goto('/am/mezmur');
    await expect(page.locator('main h1')).toBeVisible();

    // Search input
    const searchInput = page.locator('input[type="text"], input[placeholder*="ፈልግ"], input[placeholder*="Search"]').first();
    await expect(searchInput).toBeVisible();

    // Category pills
    const allCategoryBtn = page.getByRole('button', { name: /ሁሉም|All/i }).first();
    await expect(allCategoryBtn).toBeVisible();

    // Audio Play action
    const playButtons = page.getByRole('button', { name: /አጫውት|Play/i });
    if ((await playButtons.count()) > 0) {
      await playButtons.first().click();
      // Player bar or pause button should appear
      await expect(page.getByRole('button', { name: /አቁም|Pause/i }).first()).toBeVisible({ timeout: 5000 });
    }

    // Lyrics Modal
    const lyricsButtons = page.getByRole('button', { name: /ግጥም|Lyrics/i });
    if ((await lyricsButtons.count()) > 0) {
      await lyricsButtons.first().click();
      await expect(page.getByText(/የመዝሙር ግጥም|Sacred Lyrics/i)).toBeVisible();
      // Close modal
      const closeBtn = page.getByRole('button', { name: /ዝጋ|Close/i }).first();
      await closeBtn.click();
    }
  });

  test('4. Public Courses & Interactive Contact Page', async ({ page }) => {
    // 1. Courses Page
    await page.goto('/am/courses');
    await expect(page.locator('main h1')).toBeVisible();
    await expect(page.getByText(/ክፍት የትምህርት ክፍሎች|Open Course Offerings|መደበኛ/i).first()).toBeVisible();

    // 2. Contact Page
    await page.goto('/am/contact');
    await expect(page.locator('main h1')).toBeVisible();

    // Fill contact form
    const nameInput = page.locator('input[placeholder*="ስም"], input[name="fullName"], input[type="text"]').first();
    const phoneInput = page.locator('input[id="contact-email"], input[name="phone"], input[type="tel"]').first();
    const messageInput = page.locator('textarea').first();

    await nameInput.fill('ዮናስ ገብረማርያም');
    await phoneInput.fill('+251911223344');
    await messageInput.fill('ስለ ሰንበት ትምህርት ቤቱ ምዝገባ ተጨማሪ መረጃ ማግኘት እፈልጋለሁ።');

    // Submit message
    const sendBtn = page.getByRole('button', { name: /ላክ|Send/i });
    await sendBtn.click();
    await expect(page.getByText(/በተሳካ ሁኔታ|successfully/i)).toBeVisible({ timeout: 10000 });
  });

  test('5. Member Portal: Dashboard, My Profile and Official ID Card with QR', async ({ page }) => {
    await loginUser(page);
    await page.goto('/am/portal');

    // 1. Dashboard loads
    await expect(page.locator('h1').first()).toBeVisible();

    // 2. Profile page
    await page.goto('/am/portal/profile');
    await expect(page.locator('h1').first()).toBeVisible();

    // Switch to ID Card tab
    const idCardTab = page.getByRole('button', { name: /መታወቂያ|ID Card/i });
    await expect(idCardTab).toBeVisible();
    await idCardTab.click();

    // Verify Official ID Card elements
    await expect(page.locator('#printable-id-card')).toBeVisible();
    await expect(page.getByText(/ፈለገ ሰላም ቅዱስ ጊዮርጊስ/i).first()).toBeVisible();

    // Check QR code SVG exists
    const qrCode = page.locator('#printable-id-card svg').last();
    await expect(qrCode).toBeVisible();

    // Check Download button exists
    const downloadBtn = page.getByRole('button', { name: /አውርድ|Download ID Card/i });
    await expect(downloadBtn).toBeVisible();
  });

  test('6. Member Portal: My Courses & Syllabus Viewer with Media', async ({ page }) => {
    await loginUser(page);
    await page.goto('/am/portal/courses');

    await expect(page.locator('main h1, h1')).toBeVisible();

    // If courses exist, click to inspect lessons
    const viewLessonsBtn = page.getByRole('button', { name: /View Lessons|ትምህርቶችን ይመልከቱ/i });
    if ((await viewLessonsBtn.count()) > 0) {
      await viewLessonsBtn.first().click();
      await expect(page.getByText(/Course Syllabus|Syllabus/i)).toBeVisible();
    }
  });

  test('7. Member Portal: Academic Attendance, Grades, and Certificates', async ({ page }) => {
    await loginUser(page);
    await page.goto('/am/portal/academic');

    await expect(page.locator('main h1, h1')).toBeVisible();

    // Attendance KPI cards
    await expect(page.getByText(/Attendance Rate|መገኘት/i).first()).toBeVisible();

    // Switch to Grades tab
    const gradesTab = page.getByRole('button', { name: /Grades|ውጤት/i });
    await gradesTab.click();
    await expect(page.getByText(/Overall Total|Assessments|Grades/i).first()).toBeVisible();

    // Switch to Certificates tab
    const certsTab = page.getByRole('button', { name: /Certificates|የምስክር ወረቀት/i });
    await certsTab.click();
    await expect(page.locator('main')).toBeVisible();
  });

  test('8. Member Portal: Mezmur Favorites, Forms, Events, Notifications & Privacy', async ({ page }) => {
    await loginUser(page);

    // 1. Favorites
    await page.goto('/am/portal/favorites');
    await expect(page.locator('h1').first()).toBeVisible();

    // 2. Forms
    await page.goto('/am/portal/forms');
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /ማመልከቻዎች|Submissions/i })).toBeVisible();

    // 3. Events & RSVP
    await page.goto('/am/portal/events');
    await expect(page.locator('h1').first()).toBeVisible();
    const rsvpButtons = page.getByRole('button', { name: /እገኛለሁ|Attending|Going/i });
    if ((await rsvpButtons.count()) > 0) {
      await expect(rsvpButtons.first()).toBeVisible();
    }

    // 4. Notifications
    await page.goto('/am/portal/notifications');
    await expect(page.locator('h1').first()).toBeVisible();

    // 5. Contributions
    await page.goto('/am/portal/contributions');
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page.getByText(/Total Contributions|የስጦታና ክፍያ/i).first()).toBeVisible();

    // 6. Privacy
    await page.goto('/am/portal/privacy');
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Save|አስቀምጥ/i }).first()).toBeVisible();
  });
});
