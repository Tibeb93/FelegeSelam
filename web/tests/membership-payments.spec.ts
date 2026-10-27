import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

test.describe('TASK R7: Annual Membership Payment Flow', () => {
  // Test reference number generated per test run to prevent collisions
  const testRefNo = `TXN-PLAYWRIGHT-${Date.now().toString().slice(-6)}`;

  // Reset member payments before test run to ensure clean starting state
  test.beforeAll(async () => {
    try {
      const { PrismaClient } = require(path.join(process.cwd(), '../api/node_modules/@prisma/client'));
      const prisma = new PrismaClient();
      await prisma.membershipPayment.deleteMany({
        where: {
          OR: [
            { referenceNo: { startsWith: 'TXN-PLAYWRIGHT' } },
            { member: { email: 'member@aemade.org' } },
          ],
        },
      });
      await prisma.$disconnect();
    } catch (e) {
      console.warn('beforeAll cleanup error (ignored):', e);
    }
  });

  // Helpers to login
  const loginMember = async (page: any) => {
    await page.context().clearCookies();
    await page.goto('/am/login');
    await page.locator('input[name="identifier"]').fill('member@aemade.org');
    await page.locator('input[name="password"]').fill('Member@123456!');
    await page.getByRole('button', { name: /ግባ|Sign In/i }).click();
    await expect(page).toHaveURL(/\/am\/portal/, { timeout: 15000 });
  };

  const loginAdmin = async (page: any) => {
    await page.context().clearCookies();
    await page.goto('/am/admin/login');
    await page.locator('input[name="identifier"]').fill('admin@aemade.org');
    await page.locator('input[name="password"]').fill('Admin@123456!');
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/\/am\/admin(?:\?.*)?$/, { timeout: 15000 });
  };

  test('1. Member portal displays membership year, fee amount, accounts and submission form', async ({
    page,
  }) => {
    await loginMember(page);
    await page.goto('/am/portal/membership');

    // Page title
    await expect(page.locator('main h1')).toContainText(/ዓመታዊ የአባልነት ክፍያ|Annual Membership/i);

    // Status banner & Fee details
    await expect(page.getByText(/የክፍያ ዓመተ ምሕረት|Membership Year/i)).toBeVisible();
    await expect(page.getByText(/የዓመቱ ክፍያ መጠን|Required Fee/i)).toBeVisible();
    await expect(page.getByText(/600 ETB/i).first()).toBeVisible();

    // Accounts section
    await expect(page.getByText(/የክፍያ መመሪያና የሂሳብ ቁጥሮች|Payment Accounts/i)).toBeVisible();
    await expect(page.getByText(/CBE|የኢትዮጵያ ንግድ ባንክ/i).first()).toBeVisible();
    await expect(page.getByText(/Telebirr|ቴሌብር/i).first()).toBeVisible();

    // Copy button
    const copyBtn = page.getByRole('button', { name: /ቁጥሩን ቅዳ|Copy Number/i }).first();
    await expect(copyBtn).toBeVisible();
  });

  test('2. Member submits bank/Telebirr payment proof and status becomes Pending', async ({
    page,
  }) => {
    await loginMember(page);
    await page.goto('/am/portal/membership');

    // Fill form
    const refInput = page.locator('input[name="referenceNo"]');
    await expect(refInput).toBeVisible({ timeout: 15000 });
    await refInput.fill(testRefNo);

    // Create a dummy image proof file for upload
    const dummyFilePath = path.join(process.cwd(), 'test-payment-proof.png');
    if (!fs.existsSync(dummyFilePath)) {
      // Minimal 1x1 transparent PNG
      const pngBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64',
      );
      fs.writeFileSync(dummyFilePath, pngBuffer);
    }

    const fileInput = page.locator('#file-drop-input');
    await fileInput.setInputFiles(dummyFilePath);

    // Submit
    const submitBtn = page.getByRole('button', { name: /ክፍያውን አረጋግጥና ላክ|Submit Payment/i });
    await submitBtn.click();

    // Expect success toast and pending status
    await expect(page.getByText(/የክፍያ ማረጋገጫዎ በተሳካ ሁኔታ ገብቷል|submitted successfully/i).first()).toBeVisible({
      timeout: 10000,
    });

    // Status banner should now reflect Pending Review
    await expect(page.getByText(/በመገምገም ላይ|Pending Review/i).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(testRefNo).first()).toBeVisible();
  });

  test('3. Duplicate transaction reference is rejected with conflict error', async ({ page }) => {
    await loginMember(page);
    await page.goto('/am/portal/membership');

    const refInput = page.locator('input[name="referenceNo"]');
    await expect(refInput).toBeVisible({ timeout: 15000 });

    // Enter the duplicate reference number submitted in test 2
    await refInput.fill(testRefNo);

    const dummyFilePath = path.join(process.cwd(), 'test-payment-proof.png');
    const fileInput = page.locator('#file-drop-input');
    await fileInput.setInputFiles(dummyFilePath);

    const submitBtn = page.getByRole('button', { name: /ክፍያውን አረጋግጥና ላክ|Submit Payment/i });
    await submitBtn.click();

    // Expect conflict error message
    await expect(
      page.getByText(/ቀደም ሲል ጥቅም ላይ ውሏል|already been registered/i).first(),
    ).toBeVisible({ timeout: 10000 });

    // Input value is preserved
    await expect(refInput).toHaveValue(testRefNo);
  });

  test('4. Admin reviews payment queue, inspects proof, and approves it', async ({ page }) => {
    await loginAdmin(page);
    await page.goto('/am/admin/payments');

    // Title and KPI metrics
    await expect(page.locator('main h1')).toContainText(/ዓመታዊ የአባልነት ክፍያዎች|Annual Membership Payments/i);
    await expect(page.getByText(/የተሰበሰበ ጠቅላላ ገቢ|Total Collected/i)).toBeVisible();
    await expect(page.getByText(/በመጠባበቅ ላይ|Pending Review/i).first()).toBeVisible();

    // Check Review Queue for the member's submitted payment
    await expect(page.locator(`text=${testRefNo}`).first()).toBeVisible({ timeout: 10000 });

    // Click View Proof
    const proofBtn = page.getByRole('button', { name: /ማረጋገጫ እይ|View Proof/i }).first();
    await proofBtn.click();

    // Proof preview modal should open
    await expect(page.locator('img[alt="Proof"]')).toBeVisible({ timeout: 5000 });
    // Close modal
    await page.getByRole('button', { name: /ዝጋ|Close/i }).click();

    // Click Approve
    const approveBtn = page.getByRole('button', { name: /አጽድቅ|Approve/i }).first();
    await approveBtn.click();

    // Expect success toast
    await expect(page.getByText(/ክፍያው በተሳካ ሁኔታ ፀድቋል|Payment approved/i).first()).toBeVisible({
      timeout: 10000,
    });

    // Switch to All Payments tab
    await page.getByRole('button', { name: /ሁሉም ክፍያዎች|All Payments/i }).click();
    await expect(page.getByRole('table')).toBeVisible();

    // Filter or verify approved status badge
    await expect(page.getByText(/የፀደቀ|Approved/i).first()).toBeVisible();
  });

  test('5. Approved member receives receipt and Paid status reflects on portal and profile', async ({
    page,
  }) => {
    await loginMember(page);
    await page.goto('/am/portal/membership');

    // Status is now Paid
    await expect(page.getByText(/የፀደቀ ክፍያ|Paid/i).first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/ደረሰኝ አውርድ|Download Receipt/i).first()).toBeVisible({ timeout: 10000 });

    // Navigate to Member Profile
    await page.goto('/am/portal/profile');
    await expect(page.locator('main h1')).toContainText(/የግል መረጃዬ|የግል መገለጫ|My Profile/i);

    // Membership Fee Paid badge is displayed on profile
    await expect(page.getByText(/ዓመታዊ ክፍያ፡ የተከፈለ|Membership Fee Paid/i).first()).toBeVisible({
      timeout: 10000,
    });
  });
});
