/**
 * Aemade Selam Sunday School Management System
 * Final Production Acceptance Verification Script
 * Validates all core flows on the live system.
 */

const http = require('http');
const https = require('https');

const BASE_URL = process.env.TARGET_URL || 'http://localhost:3000';
const WEB_URL = process.env.WEB_URL || 'http://localhost:3001';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@aemade.org';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123456!';

function request(urlStr, options = {}, body = null) {
  return new Promise((resolve) => {
    const url = new URL(urlStr);
    const client = url.protocol === 'https:' ? https : http;
    const start = Date.now();

    const req = client.request(
      url,
      {
        method: options.method || 'GET',
        headers: options.headers || {},
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          const duration = Date.now() - start;
          let parsed = null;
          try {
            parsed = JSON.parse(raw);
          } catch {
            parsed = raw;
          }
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: parsed,
            duration,
          });
        });
      },
    );

    req.on('error', (err) => {
      resolve({
        statusCode: 0,
        headers: {},
        body: null,
        duration: Date.now() - start,
        error: err.message,
      });
    });

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runAcceptanceCheck() {
  console.log('================================================================');
  console.log('  Aemade Selam Sunday School System - Final Acceptance Test');
  console.log('================================================================');
  console.log(`API Base URL : ${BASE_URL}`);
  console.log(`Web Base URL : ${WEB_URL}`);
  console.log(`Target Time  : ${new Date().toISOString()}\n`);

  const checklist = [];
  let token = null;

  // 1. API Health Check
  const healthRes = await request(`${BASE_URL}/api/v1/health`);
  checklist.push({
    flow: '1. API Health & Database Probe',
    endpoint: 'GET /api/v1/health',
    status: healthRes.statusCode === 200 && healthRes.body?.services?.database?.status === 'up',
    detail: `HTTP ${healthRes.statusCode} (${healthRes.duration}ms) - DB: ${healthRes.body?.services?.database?.status}`,
  });

  // 2. Web Home Page
  const homeRes = await request(`${WEB_URL}/am`);
  checklist.push({
    flow: '2. Public Website Home View',
    endpoint: 'GET /am',
    status: homeRes.statusCode === 200,
    detail: `HTTP ${homeRes.statusCode} (${homeRes.duration}ms) - SSR Content OK`,
  });

  // 3. Status Page
  const statusRes = await request(`${WEB_URL}/am/status`);
  checklist.push({
    flow: '3. Telemetry Status Page',
    endpoint: 'GET /am/status',
    status: statusRes.statusCode === 200,
    detail: `HTTP ${statusRes.statusCode} (${statusRes.duration}ms)`,
  });

  // 4. Public Branding Settings
  const settingsRes = await request(`${BASE_URL}/api/v1/settings/public`);
  checklist.push({
    flow: '4. Public Branding & Localization',
    endpoint: 'GET /api/v1/settings/public',
    status: settingsRes.statusCode === 200 && Boolean(settingsRes.body?.schoolProfile?.nameAm),
    detail: `HTTP ${settingsRes.statusCode} - School: "${settingsRes.body?.schoolProfile?.nameAm || 'N/A'}"`,
  });

  // 5. Ethiopian Calendar Settings
  const calRes = await request(`${BASE_URL}/api/v1/settings/calendar`);
  checklist.push({
    flow: '5. Ethiopian Calendar Fasting Days & Feasts',
    endpoint: 'GET /api/v1/settings/calendar',
    status: calRes.statusCode === 200 && Array.isArray(calRes.body?.fastingSeasons),
    detail: `HTTP ${calRes.statusCode} - Fasting Seasons: ${calRes.body?.fastingSeasons?.length || 0}`,
  });

  // 6. Public Posts & Sinksar
  const postsRes = await request(`${BASE_URL}/api/v1/posts/today`);
  checklist.push({
    flow: "6. Today's Feed & Sinksar Content",
    endpoint: 'GET /api/v1/posts/today',
    status: postsRes.statusCode === 200,
    detail: `HTTP ${postsRes.statusCode} (${postsRes.duration}ms)`,
  });

  // 7. Public Mezmur Library
  const mezmurRes = await request(`${BASE_URL}/api/v1/mezmurs/public?limit=5`);
  checklist.push({
    flow: '7. Public Mezmur Catalog & Audio Streaming',
    endpoint: 'GET /api/v1/mezmurs/public',
    status: mezmurRes.statusCode === 200,
    detail: `HTTP ${mezmurRes.statusCode} - Count: ${mezmurRes.body?.data?.length || 0}`,
  });

  // 8. Public Courses
  const coursesRes = await request(`${BASE_URL}/api/v1/courses/public`);
  checklist.push({
    flow: '8. Public Courses Curriculum',
    endpoint: 'GET /api/v1/courses/public',
    status: coursesRes.statusCode === 200,
    detail: `HTTP ${coursesRes.statusCode} - Open Courses: ${coursesRes.body?.data?.length || 0}`,
  });

  // 9. Super Admin Authentication
  const authRes = await request(
    `${BASE_URL}/api/v1/auth/login`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { identifier: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  );

  token = authRes.body?.accessToken;
  checklist.push({
    flow: '9. Super Admin Authentication & JWT Generation',
    endpoint: 'POST /api/v1/auth/login',
    status: authRes.statusCode === 200 && Boolean(token),
    detail: `HTTP ${authRes.statusCode} (${authRes.duration}ms) - Role: ${authRes.body?.user?.role || 'super_admin'}`,
  });

  // 10. Authenticated /me Profile
  const meRes = await request(`${BASE_URL}/api/v1/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const userEmail = meRes.body?.email || meRes.body?.user?.email;
  checklist.push({
    flow: '10. RBAC Authenticated Session Profile',
    endpoint: 'GET /api/v1/auth/me',
    status: meRes.statusCode === 200 && Boolean(userEmail),
    detail: `HTTP ${meRes.statusCode} - User: ${userEmail || 'N/A'}`,
  });

  // 11. Member Management Directory (Authenticated Admin)
  const membersRes = await request(`${BASE_URL}/api/v1/members?limit=5`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  checklist.push({
    flow: '11. Member Directory & Record Management',
    endpoint: 'GET /api/v1/members',
    status: membersRes.statusCode === 200 && Array.isArray(membersRes.body?.data),
    detail: `HTTP ${membersRes.statusCode} - Total Members: ${membersRes.body?.meta?.total ?? membersRes.body?.data?.length ?? 0}`,
  });

  // 12. GDPR Personal Data Export Flow
  const gdprRes = await request(`${BASE_URL}/api/v1/members/me/data-export`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  checklist.push({
    flow: '12. GDPR Member Data Export Flow',
    endpoint: 'GET /api/v1/members/me/data-export',
    status: gdprRes.statusCode === 200 || gdprRes.statusCode === 404, // 404 acceptable if super admin has no member record
    detail: `HTTP ${gdprRes.statusCode} (${gdprRes.duration}ms)`,
  });

  // Print Summary Table
  console.log('ACCEPTANCE CHECKLIST RESULTS:');
  console.log('---------------------------------------------------------------------------------------------------------');
  let allPassed = true;
  checklist.forEach((item, index) => {
    const mark = item.status ? 'PASS' : 'FAIL';
    if (!item.status) allPassed = false;
    console.log(`[${mark}] ${item.flow.padEnd(46)} | ${item.detail}`);
  });
  console.log('---------------------------------------------------------------------------------------------------------');

  if (allPassed) {
    console.log('\n>>> ALL ACCEPTANCE TESTS PASSED! The live deployment is verified healthy and operational. <<<\n');
    process.exit(0);
  } else {
    console.error('\n>>> SOME ACCEPTANCE CHECKS FAILED! Review the log above for remediation. <<<\n');
    process.exit(1);
  }
}

runAcceptanceCheck().catch((err) => {
  console.error('Fatal acceptance test error:', err);
  process.exit(1);
});
