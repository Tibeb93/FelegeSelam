/**
 * 200 Concurrent Users Load Test Runner
 * Measures API performance, p95, p99 latencies, throughput, and error rate.
 */
const http = require('http');

const API_BASE = 'http://localhost:3000/api/v1';
const ENDPOINTS = [
  '/posts/today',
  '/mezmurs/public?limit=10',
  '/settings/public',
  '/courses/public',
  '/settings/calendar',
  '/health',
];

const CONCURRENT_USERS = 200;
const DURATION_SECONDS = 15;

async function requestEndpoint(path) {
  const start = Date.now();
  return new Promise((resolve) => {
    http.get(`${API_BASE}${path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const duration = Date.now() - start;
        resolve({
          statusCode: res.statusCode,
          duration,
          bytes: Buffer.byteLength(data),
          success: res.statusCode >= 200 && res.statusCode < 400,
        });
      });
    }).on('error', (err) => {
      resolve({
        statusCode: 0,
        duration: Date.now() - start,
        bytes: 0,
        success: false,
        error: err.message,
      });
    });
  });
}

async function runWorker(workerId, stopTime, results) {
  while (Date.now() < stopTime) {
    const endpoint = ENDPOINTS[Math.floor(Math.random() * ENDPOINTS.length)];
    const result = await requestEndpoint(endpoint);
    results.push(result);
  }
}

async function main() {
  console.log(`Starting load test with ${CONCURRENT_USERS} concurrent users for ${DURATION_SECONDS}s...`);
  const stopTime = Date.now() + DURATION_SECONDS * 1000;
  const results = [];
  const workers = [];

  const startTime = Date.now();
  for (let i = 0; i < CONCURRENT_USERS; i++) {
    workers.push(runWorker(i, stopTime, results));
  }

  await Promise.all(workers);
  const totalDurationSec = (Date.now() - startTime) / 1000;

  const totalRequests = results.length;
  const successful = results.filter((r) => r.success).length;
  const failed = totalRequests - successful;
  const errorRate = (failed / totalRequests) * 100;
  const reqPerSec = (totalRequests / totalDurationSec).toFixed(2);

  const durations = results.map((r) => r.duration).sort((a, b) => a - b);
  const min = durations[0];
  const max = durations[durations.length - 1];
  const avg = (durations.reduce((acc, d) => acc + d, 0) / totalRequests).toFixed(2);
  const p50 = durations[Math.floor(totalRequests * 0.5)];
  const p90 = durations[Math.floor(totalRequests * 0.9)];
  const p95 = durations[Math.floor(totalRequests * 0.95)];
  const p99 = durations[Math.floor(totalRequests * 0.99)];

  const totalBytes = results.reduce((acc, r) => acc + r.bytes, 0);
  const mbytesPerSec = (totalBytes / (1024 * 1024 * totalDurationSec)).toFixed(2);

  const summary = {
    concurrentUsers: CONCURRENT_USERS,
    durationSec: totalDurationSec.toFixed(1),
    totalRequests,
    successful,
    failed,
    errorRate: `${errorRate.toFixed(2)}%`,
    reqPerSec,
    throughputMBs: mbytesPerSec,
    latencies: {
      min: `${min} ms`,
      avg: `${avg} ms`,
      p50: `${p50} ms`,
      p90: `${p90} ms`,
      p95: `${p95} ms`,
      p99: `${p99} ms`,
      max: `${max} ms`,
    },
  };

  console.log('\n--- LOAD TEST RESULTS ---');
  console.log(JSON.stringify(summary, null, 2));
}

main().catch(console.error);
