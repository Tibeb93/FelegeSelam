import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 50 },
    { duration: '20s', target: 200 }, // 200 concurrent users
    { duration: '30s', target: 200 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'], // <1% errors
  },
};

const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:3000/api/v1';

export default function () {
  const endpoints = [
    `${BASE_URL}/posts/today`,
    `${BASE_URL}/mezmurs/public?limit=10`,
    `${BASE_URL}/settings/public`,
    `${BASE_URL}/courses/public`,
    `${BASE_URL}/settings/calendar`,
  ];

  const target = endpoints[Math.floor(Math.random() * endpoints.length)];
  const res = http.get(target);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(0.1);
}
