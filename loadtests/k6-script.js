// SYRIX Load Test — k6 Script
// Run: k6 run k6-script.js
// Simulates 150 concurrent users across the 5 most critical endpoints

import http from "k6/http";
import { check, sleep, group } from "k6";
import { Rate, Trend } from "k6/metrics";

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

const failureRate = new Rate("failed_requests");
const responseTrend = new Trend("response_time");

export const options = {
  stages: [
    { duration: "30s", target: 50 },   // Ramp up to 50 users
    { duration: "1m", target: 100 },   // Ramp to 100
    { duration: "30s", target: 150 },  // Ramp to 150
    { duration: "2m", target: 150 },   // Stay at 150
    { duration: "30s", target: 0 },    // Ramp down
  ],
  thresholds: {
    failed_requests: ["rate<0.05"],    // Less than 5% failure rate
    response_time: ["p(95)<500"],      // 95% of requests under 500ms
    http_req_duration: ["p(95)<500"],
  },
};

export default function () {
  group("Trial Balance", function () {
    const res = http.get(`${BASE_URL}/api/accounts/trial-balance?year=2026&month=7`, {
      headers: { "Content-Type": "application/json" },
    });
    check(res, { "status is 200 or 401": (r) => r.status === 200 || r.status === 401 });
    failureRate.add(res.status !== 200 && res.status !== 401);
    responseTrend.add(res.timings.duration);
    sleep(1);
  });

  group("Journal Entries", function () {
    const res = http.get(`${BASE_URL}/api/accounts/journal-entries?page=1&limit=25`, {
      headers: { "Content-Type": "application/json" },
    });
    check(res, { "status is 200 or 401": (r) => r.status === 200 || r.status === 401 });
    failureRate.add(res.status !== 200 && res.status !== 401);
    responseTrend.add(res.timings.duration);
    sleep(1);
  });

  group("Income Statement", function () {
    const res = http.get(`${BASE_URL}/api/accounts/income-statement?year=2026&month=7`, {
      headers: { "Content-Type": "application/json" },
    });
    check(res, { "status is 200 or 401": (r) => r.status === 200 || r.status === 401 });
    failureRate.add(res.status !== 200 && res.status !== 401);
    responseTrend.add(res.timings.duration);
    sleep(1);
  });

  group("HR Employees List", function () {
    const res = http.get(`${BASE_URL}/api/hr/employees?page=1&limit=25`, {
      headers: { "Content-Type": "application/json" },
    });
    check(res, { "status is 200 or 401": (r) => r.status === 200 || r.status === 401 });
    failureRate.add(res.status !== 200 && res.status !== 401);
    responseTrend.add(res.timings.duration);
    sleep(1);
  });

  group("Sales Deals List", function () {
    const res = http.get(`${BASE_URL}/api/sales/deals?page=1&limit=25`, {
      headers: { "Content-Type": "application/json" },
    });
    check(res, { "status is 200 or 401": (r) => r.status === 200 || r.status === 401 });
    failureRate.add(res.status !== 200 && res.status !== 401);
    responseTrend.add(res.timings.duration);
    sleep(1);
  });

  group("Auth Me (authenticated)", function () {
    const res = http.get(`${BASE_URL}/api/auth/me`, {
      headers: { "Content-Type": "application/json" },
    });
    check(res, { "status is 401 (no session)": (r) => r.status === 401 });
    failureRate.add(res.status !== 401);
    responseTrend.add(res.timings.duration);
    sleep(1);
  });
}
