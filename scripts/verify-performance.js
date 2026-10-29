const { chromium } = require('../web/node_modules/@playwright/test');
const http = require('http');

async function testBootstrapEtag() {
  return new Promise((resolve) => {
    http.get('http://localhost:3000/api/v1/bootstrap', (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const etag = res.headers['etag'];
        const statusCode = res.statusCode;

        if (!etag) {
          resolve({ success: false, error: 'No ETag returned', statusCode });
          return;
        }

        // Second request with If-None-Match
        const req2 = http.get(
          'http://localhost:3000/api/v1/bootstrap',
          { headers: { 'if-none-match': etag } },
          (res2) => {
            resolve({
              success: res2.statusCode === 304,
              firstStatus: statusCode,
              secondStatus: res2.statusCode,
              etag,
            });
          }
        );
        req2.on('error', (err) => resolve({ success: false, error: err.message }));
      });
    }).on('error', (err) => resolve({ success: false, error: err.message }));
  });
}

async function runVerification() {
  console.log('===============================================================');
  console.log('🚀 TASK R10: PERFORMANCE & VERIFICATION SUITE');
  console.log('===============================================================');

  // 1. Test Bootstrap ETag
  console.log('\n[1/4] Testing GET /api/v1/bootstrap & ETag 304 Caching...');
  const etagResult = await testBootstrapEtag();
  console.log('Bootstrap ETag Result:', etagResult);

  // 2. Launch Browser for Navigation & Core Web Vitals
  console.log('\n[2/4] Launching Playwright browser (Edge) for Web Vitals & Nav Tests...');
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();

  // Track all requests on first load to detect duplicate URLs
  const requestCounts = new Map();
  const documentNavigations = [];

  page.on('request', (req) => {
    const url = req.url();
    // Ignore data URIs or analytics
    if (url.startsWith('data:')) return;
    requestCounts.set(url, (requestCounts.get(url) || 0) + 1);

    if (req.isNavigationRequest() && req.resourceType() === 'document') {
      documentNavigations.push({
        url: req.url(),
        time: Date.now(),
      });
    }
  });

  console.log('\n[3/4] Measuring cold load on http://localhost:3001/am...');
  const startTime = Date.now();
  await page.goto('http://localhost:3001/am', { waitUntil: 'networkidle' });
  const loadDuration = Date.now() - startTime;

  // Extract Web Vitals from browser Performance API
  const metrics = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    const paint = performance.getEntriesByType('paint');
    const fcpEntry = paint.find((p) => p.name === 'first-contentful-paint');

    return {
      ttfb: nav ? Math.round(nav.responseStart - nav.requestStart) : null,
      domContentLoaded: nav ? Math.round(nav.domContentLoadedEventEnd - nav.startTime) : null,
      loadEvent: nav ? Math.round(nav.loadEventEnd - nav.startTime) : null,
      fcp: fcpEntry ? Math.round(fcpEntry.startTime) : null,
    };
  });

  console.log('First Load Metrics:', { ...metrics, totalTimeMs: loadDuration });

  // Check duplicate URLs
  const duplicates = [];
  for (const [url, count] of requestCounts.entries()) {
    if (count > 1) {
      duplicates.push({ url, count });
    }
  }

  console.log(`Duplicate Request Count on First Load: ${duplicates.length}`);
  if (duplicates.length > 0) {
    console.log('Duplicate URLs:', duplicates);
  }

  // 3. Test Navigation without Full Document Reloads
  console.log('\n[4/4] Testing Menu Clicks & Section Jumps (Zero Document Reloads)...');
  const initialNavCount = documentNavigations.length;

  // Click About in header
  console.log('- Clicking About ("ስለ እኛ")...');
  const aboutLink = page.locator('nav a:has-text("ስለ እኛ"), nav a:has-text("About")').first();
  await aboutLink.click();
  await page.waitForTimeout(500);

  const hashAfterAbout = await page.evaluate(() => window.location.hash);
  const scrollYAfterAbout = await page.evaluate(() => window.scrollY);
  console.log(`  Hash: "${hashAfterAbout}", ScrollY: ${scrollYAfterAbout}px`);

  // Click Courses in header
  console.log('- Clicking Courses ("ትምህርቶች")...');
  const coursesLink = page.locator('nav a:has-text("ትምህርቶች"), nav a:has-text("Courses")').first();
  await coursesLink.click();
  await page.waitForTimeout(1000);

  const urlAfterCourses = page.url();
  console.log(`  URL after Courses: ${urlAfterCourses}`);

  // Click Mezmur in header
  console.log('- Clicking Mezmur ("መዝሙራት")...');
  const mezmurLink = page.locator('nav a:has-text("መዝሙራት"), nav a:has-text("Mezmur")').first();
  await mezmurLink.click();
  await page.waitForTimeout(1000);

  const urlAfterMezmur = page.url();
  console.log(`  URL after Mezmur: ${urlAfterMezmur}`);

  // Click Logo to return to home
  console.log('- Clicking Logo to return Home...');
  const logoLink = page.locator('header a[href*="/am"]').first();
  await logoLink.click();
  await page.waitForTimeout(1000);

  const finalDocNavCount = documentNavigations.length;
  const newDocumentNavigations = finalDocNavCount - initialNavCount;
  console.log('Document Navigations Captured:', documentNavigations.slice(initialNavCount));

  console.log('\n===============================================================');
  console.log('📊 VERIFICATION SUMMARY:');
  console.log(`- Full Document Navigations during menu clicks: ${newDocumentNavigations} (Target: 0)`);
  console.log(`- Section Jump (#about): ${hashAfterAbout === '#about' && scrollYAfterAbout > 0 ? 'PASSED' : 'CHECK'}`);
  console.log(`- Duplicate URLs on first load: ${duplicates.length} (Target: 0)`);
  console.log(`- Bootstrap ETag 304 Caching: ${etagResult.success ? 'PASSED' : 'CHECK'}`);
  console.log(`- TTFB: ${metrics.ttfb} ms`);
  console.log(`- FCP: ${metrics.fcp} ms`);
  console.log('===============================================================');

  await browser.close();
  return {
    metrics,
    duplicates,
    newDocumentNavigations,
    sectionJumpPassed: hashAfterAbout === '#about' && scrollYAfterAbout > 0,
    etagResult,
  };
}

runVerification()
  .then((res) => {
    const fs = require('fs');
    fs.writeFileSync('scripts/perf-after-raw.json', JSON.stringify(res, null, 2));
    process.exit(0);
  })
  .catch((err) => {
    console.error('Verification failed:', err);
    process.exit(1);
  });
