const path = require('path');
const { chromium } = require(path.join(__dirname, '../web/node_modules/@playwright/test'));
const fs = require('fs');

async function measurePage(browser, url, pageName) {
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 }, // Mobile viewport (iPhone SE)
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
  });

  const page = await context.newPage();
  const requests = [];
  let totalBytes = 0;

  page.on('request', (req) => {
    requests.push({
      url: req.url(),
      method: req.method(),
      resourceType: req.resourceType(),
    });
  });

  page.on('response', async (res) => {
    try {
      const headers = res.headers();
      const length = headers['content-length'] ? parseInt(headers['content-length'], 10) : 0;
      totalBytes += length;
    } catch (e) {}
  });

  const startTime = Date.now();
  await page.goto(url, { waitUntil: 'load', timeout: 60000 });
  const loadTime = Date.now() - startTime;

  // Wait a moment for any client-side effects / re-renders
  await page.waitForTimeout(2000);

  // Extract Web Vitals & Performance metrics
  const performanceMetrics = await page.evaluate(() => {
    const timing = performance.timing;
    const navEntries = performance.getEntriesByType('navigation');
    const nav = navEntries.length > 0 ? navEntries[0] : null;

    const ttfb = nav ? nav.responseStart - nav.requestStart : timing.responseStart - timing.requestStart;
    const domLoad = nav ? nav.domContentLoadedEventEnd - nav.startTime : timing.domContentLoadedEventEnd - timing.navigationStart;

    // Estimate LCP from performance entries if available
    let lcp = 0;
    const paintEntries = performance.getEntriesByType('paint');
    const fcp = paintEntries.find(p => p.name === 'first-contentful-paint')?.startTime || 0;

    return {
      ttfb: Math.max(0, Math.round(ttfb)),
      domContentLoaded: Math.max(0, Math.round(domLoad)),
      fcp: Math.max(0, Math.round(fcp)),
    };
  });

  // Calculate duplicate URL requests
  const urlCounts = {};
  for (const r of requests) {
    urlCounts[r.url] = (urlCounts[r.url] || 0) + 1;
  }
  const duplicates = Object.entries(urlCounts)
    .filter(([_, count]) => count > 1)
    .map(([url, count]) => ({ url, count }));

  await context.close();

  return {
    pageName,
    url,
    loadTimeMs: loadTime,
    metrics: performanceMetrics,
    requestCount: requests.length,
    totalKbTransferred: Math.round(totalBytes / 1024),
    duplicates,
    requests,
  };
}

async function measureMenuNavigation(browser) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  let documentNavigations = 0;
  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame()) {
      documentNavigations++;
    }
  });

  await page.goto('http://localhost:3001/am', { waitUntil: 'load' });
  await page.waitForTimeout(2000);
  const initialNavs = documentNavigations;

  // Let's inspect menu items and clicking
  const menuClicks = [];
  const links = ['/am/about', '/am/news', '/am/mezmur', '/am/courses'];

  for (const target of links) {
    const beforeNavs = documentNavigations;
    const linkEl = await page.$(`nav a[href="${target}"]`);
    if (linkEl) {
      await linkEl.click();
      await page.waitForTimeout(2000);
      menuClicks.push({
        target,
        causedFullDocumentNav: documentNavigations > beforeNavs,
      });
    }
  }

  await context.close();
  return {
    initialNavs,
    menuClicks,
    totalDocumentNavs: documentNavigations,
  };
}

async function run() {
  console.log('Starting Performance Diagnostics...');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });

  const pagesToMeasure = [
    { name: 'Home (/)', url: 'http://localhost:3001/am' },
    { name: 'About (/about)', url: 'http://localhost:3001/am/about' },
    { name: 'Mezmur (/mezmur)', url: 'http://localhost:3001/am/mezmur' },
    { name: 'Admin Dashboard (/admin)', url: 'http://localhost:3001/am/admin' },
  ];

  const results = [];
  for (const p of pagesToMeasure) {
    console.log(`Measuring ${p.name}...`);
    try {
      const res = await measurePage(browser, p.url, p.name);
      results.push(res);
    } catch (err) {
      console.error(`Error measuring ${p.name}:`, err.message);
      results.push({ pageName: p.name, url: p.url, error: err.message });
    }
  }

  console.log('Measuring menu navigation...');
  let navResults = null;
  try {
    navResults = await measureMenuNavigation(browser);
  } catch (err) {
    console.error('Error measuring menu nav:', err.message);
  }

  await browser.close();

  const report = {
    timestamp: new Date().toISOString(),
    pages: results,
    navigation: navResults,
  };

  fs.writeFileSync(path.join(__dirname, 'perf-baseline-raw.json'), JSON.stringify(report, null, 2));
  console.log('Raw baseline report saved to scripts/perf-baseline-raw.json');
}

run().catch(console.error);
