# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: foundation.spec.ts >> Phase 8: Web Foundation & Admin Suite >> 2. Language switch sets NEXT_LOCALE cookie and updates interface
- Location: tests\foundation.spec.ts:10:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('link', { name: 'EN' })
    - locator resolved to <a href="/en" aria-label="Switch to English" class="flex min-h-[38px] items-center justify-center rounded-full px-3 text-xs md:text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary text-foreground hover:bg-primary/10">EN</a>

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - banner [ref=e3]:
      - generic [ref=e4]:
        - generic [ref=e11]:
          - paragraph [ref=e12]: የኢትዮጵያ ኦርቶዶክስ ተዋሕዶ ቤተ ክርስቲያን
          - heading "አዕማደ ሰላም ሰንበት ትምህርት ቤት" [level=1] [ref=e13]
        - generic [ref=e14]:
          - generic [ref=e15]:
            - generic [ref=e18]: ጥቅምት 3 ቀን 2019 ዓ.ም
            - generic [ref=e19]: •
            - generic [ref=e20]: ማክሰ፣ ኦክቶ 13 2026 G.C.
          - generic [ref=e21]:
            - link "ቀይር ወደ አማርኛ" [ref=e25] [cursor=pointer]:
              - /url: /am
              - text: አማርኛ
            - link "Switch to English" [ref=e26] [cursor=pointer]:
              - /url: /en
              - text: EN
          - link "ግባ" [ref=e27] [cursor=pointer]:
            - /url: /am/login
    - main [ref=e28]:
      - generic [ref=e31]:
        - generic [ref=e32]: የኢትዮጵያ ኦርቶዶክስ ተዋሕዶ ቤተ ክርስቲያን
        - heading "መንፈሳዊ ዕውቀትና የቅድስት ቤተ ክርስቲያን ትውፊት" [level=2] [ref=e37]
        - paragraph [ref=e38]: «የእግዚአብሔር ቃል በሙላት ይኑርባችሁ» - ቆላስይስ ፫:፲፮። የእግዚአብሔርን ቃል የምንማርበት፣ በሃይማኖትና በምግባር የምንታነጽበት የተቀደሰ ማዕከል
        - generic [ref=e39]:
          - link "የአባላት መግቢያ" [ref=e40] [cursor=pointer]:
            - /url: /am/portal
          - link "ስለ ሰንበት ትምህርት ቤቱ" [ref=e43] [cursor=pointer]:
            - /url: /am/about
      - generic [ref=e46]:
        - generic [ref=e47]:
          - generic [ref=e48]: 1,200+
          - generic [ref=e49]: ተማሪዎችና አባላት
        - generic [ref=e50]:
          - generic [ref=e51]: "14"
          - generic [ref=e52]: የክፍል ደረጃዎች
        - generic [ref=e53]:
          - generic [ref=e54]: 35+
          - generic [ref=e55]: መምህራንና አገልጋዮች
        - generic [ref=e56]:
          - generic [ref=e57]: 1992 ዓ.ም
          - generic [ref=e58]: የተመሰረተበት ዓመት
      - generic [ref=e60]:
        - generic [ref=e61]:
          - heading "ዋና ዋና አገልግሎቶች" [level=3] [ref=e62]
          - paragraph [ref=e63]: ለህፃናት፣ ወጣቶችና ጎልማሶች የተዘጋጁ መንፈሳዊ ክፍሎች
        - generic [ref=e64]:
          - generic [ref=e65]:
            - heading "መንፈሳዊ ትምህርት" [level=3] [ref=e71]
            - paragraph [ref=e73]: የመጽሐፍ ቅዱስ ጥናት፣ ሥርዓተ ቤተ ክርስቲያን፣ ዜማና ቋንቋ ጥናት በደረጃ የተከፋፈለ ሥርዓተ ትምህርት
          - generic [ref=e74]:
            - heading "የተማሪዎች ክትትል" [level=3] [ref=e80]
            - paragraph [ref=e82]: ዲጂታል የተማሪዎች ምዝገባ፣ የክፍል መገኘት እና የውጤት አያያዝ ሥርዓት
          - generic [ref=e83]:
            - heading "መንፈሳዊ ክፍላት" [level=3] [ref=e91]
            - paragraph [ref=e93]: የመዝሙር፣ የስነ-ጽሑፍ፣ የልማት እና የወንጌል አገልግሎት ክፍላት ንቁ ተሳትፎ
      - generic [ref=e96]:
        - blockquote [ref=e100]: «በሃይማኖትና በምግባር የጸና ትውልድ እናፈራለን»
        - paragraph [ref=e101]: አዕማደ ሰላም ሰንበት ትምህርት ቤት
    - contentinfo [ref=e102]:
      - generic [ref=e103]:
        - generic [ref=e110]:
          - paragraph [ref=e111]: አዕማደ ሰላም ሰንበት ትምህርት ቤት
          - paragraph [ref=e112]: የኢትዮጵያ ኦርቶዶክስ ተዋሕዶ ቤተ ክርስቲያን
        - paragraph [ref=e113]: © 2026 መብቱ በህግ የተጠበቀ ነው። አዕማደ ሰላም ሰንበት ትምህርት ቤት።
  - alert [ref=e114]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Phase 8: Web Foundation & Admin Suite', () => {
  4   |   test('1. Unauthenticated access to /admin redirects to login', async ({ page }) => {
  5   |     await page.goto('/am/admin');
  6   |     await expect(page).toHaveURL(/\/am\/login/);
  7   |     await expect(page.locator('h2')).toContainText('ወደ ሥርዓቱ ይግቡ');
  8   |   });
  9   | 
  10  |   test('2. Language switch sets NEXT_LOCALE cookie and updates interface', async ({ page }) => {
  11  |     await page.goto('/am');
> 12  |     await page.getByRole('link', { name: 'EN' }).click();
      |                                                  ^ Error: locator.click: Test timeout of 30000ms exceeded.
  13  |     await expect(page).toHaveURL(/\/en/);
  14  | 
  15  |     const cookies = await page.context().cookies();
  16  |     const localeCookie = cookies.find((c) => c.name === 'NEXT_LOCALE');
  17  |     expect(localeCookie?.value).toBe('en');
  18  | 
  19  |     // Refresh and ensure language remains English
  20  |     await page.reload();
  21  |     await expect(page).toHaveURL(/\/en/);
  22  |   });
  23  | 
  24  |   test('3. Theme switch toggles dark class and persists in cookie', async ({ page }) => {
  25  |     await page.goto('/am/login');
  26  | 
  27  |     // Click theme toggle button
  28  |     const themeBtn = page.getByRole('button', { name: /Toggle theme/i });
  29  |     await themeBtn.click();
  30  | 
  31  |     // Verify dark class added to html
  32  |     const isDark = await page.evaluate(() =>
  33  |       document.documentElement.classList.contains('dark'),
  34  |     );
  35  |     expect(isDark).toBe(true);
  36  | 
  37  |     const cookies = await page.context().cookies();
  38  |     const themeCookie = cookies.find((c) => c.name === 'fs_theme');
  39  |     expect(themeCookie?.value).toBe('dark');
  40  | 
  41  |     // Refresh and ensure dark mode persists
  42  |     await page.reload();
  43  |     const isStillDark = await page.evaluate(() =>
  44  |       document.documentElement.classList.contains('dark'),
  45  |     );
  46  |     expect(isStillDark).toBe(true);
  47  |   });
  48  | 
  49  |   test('4. End-to-end Login with demo credentials and redirect to /admin', async ({ page }) => {
  50  |     await page.goto('/am/login');
  51  | 
  52  |     // Enter superadmin credentials
  53  |     await page.locator('input[name="identifier"]').fill('superadmin@felegeselam.org');
  54  |     await page.locator('input[name="password"]').fill('SuperAdminPassword123!');
  55  |     await page.getByRole('button', { name: 'ግባ' }).click();
  56  | 
  57  |     // Wait for redirect to admin dashboard
  58  |     await expect(page).toHaveURL(/\/am\/admin/, { timeout: 15000 });
  59  |     await expect(page.locator('h1')).toContainText('እንኳን ደህና መጡ');
  60  | 
  61  |     // Verify role-based sidebar items
  62  |     await expect(page.getByRole('link', { name: 'ዳሽቦርድ' })).toBeVisible();
  63  |     await expect(page.getByRole('link', { name: 'አባላት' })).toBeVisible();
  64  |     await expect(page.getByRole('link', { name: 'ትምህርቶች' })).toBeVisible();
  65  |     await expect(page.getByRole('link', { name: 'የክትትል መዝገብ' })).toBeVisible();
  66  |   });
  67  | 
  68  |   test('5. Demo Members Table loads real data with search, sorting, and pagination', async ({
  69  |     page,
  70  |   }) => {
  71  |     // Login first
  72  |     await page.goto('/am/login');
  73  |     await page.locator('input[name="identifier"]').fill('admin@felegeselam.org');
  74  |     await page.locator('input[name="password"]').fill('AdminPassword123!');
  75  |     await page.getByRole('button', { name: 'ግባ' }).click();
  76  |     await expect(page).toHaveURL(/\/am\/admin/, { timeout: 15000 });
  77  | 
  78  |     // Navigate to members table
  79  |     await page.goto('/am/admin/members');
  80  |     await expect(page.locator('h1')).toContainText('የሰንበት ትምህርት ቤት አባላት');
  81  | 
  82  |     // Verify table loads data rows
  83  |     const table = page.locator('table');
  84  |     await expect(table).toBeVisible();
  85  | 
  86  |     // Verify member rows are displayed
  87  |     const rows = table.locator('tbody tr');
  88  |     await expect(rows.first()).toBeVisible({ timeout: 10000 });
  89  |     const count = await rows.count();
  90  |     expect(count).toBeGreaterThan(0);
  91  | 
  92  |     // Verify search input filter
  93  |     const searchInput = page.getByPlaceholder(/በስም፣ በአባል ቁጥር/);
  94  |     await searchInput.fill('ዮሐንስ');
  95  |     await page.waitForTimeout(600); // Debounce wait
  96  | 
  97  |     // Verify export button slot exists
  98  |     await expect(page.getByRole('button', { name: 'አባላትን ላክ' })).toBeVisible();
  99  | 
  100 |     // Verify column toggle button
  101 |     const columnsBtn = page.getByRole('button', { name: 'ዓምዶች' });
  102 |     await expect(columnsBtn).toBeVisible();
  103 |   });
  104 | });
  105 | 
```