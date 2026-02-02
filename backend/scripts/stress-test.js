/**
 * Ghana Rental Market - Simple Stress Test Script
 *
 * Tests API endpoints with concurrent requests and measures:
 * - Response times (min, max, avg, p95, p99)
 * - Requests per second
 * - Error rates
 * - Success rates
 *
 * Run with: node scripts/stress-test.js
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = process.env.API_URL || 'https://ghana-rental-api.onrender.com/api';
const SIMULATION_KEY = 'ghana-rental-sim-2024';

// Test configuration
const CONFIG = {
  // Concurrent requests per test
  concurrency: {
    low: 5,
    medium: 10,
    high: 25,
    stress: 50
  },
  // Number of iterations per concurrency level
  iterations: 3,
  // Timeout per request (ms)
  timeout: 30000,
  // Delay between test phases (ms)
  phaseDelay: 2000
};

// Test accounts
const TEST_ACCOUNTS = {
  landlord: { email: 'landlord@demo.com', password: 'demo123' },
  tenant: { email: 'tenant@demo.com', password: 'demo123' },
  gra: { email: 'gra@demo.com', password: 'demo123' }
};

// Results storage
const results = {
  tests: [],
  summary: {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    totalTime: 0
  }
};

// Utility functions
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function calculatePercentile(arr, percentile) {
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

function formatMs(ms) {
  return `${ms.toFixed(0)}ms`;
}

function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    warning: '\x1b[33m',
    header: '\x1b[35m',
    reset: '\x1b[0m'
  };
  console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
}

// API call with timing
async function timedRequest(method, endpoint, data = null, token = null) {
  const start = Date.now();
  const config = {
    method,
    url: `${API_BASE_URL}${endpoint}`,
    headers: { 'Content-Type': 'application/json' },
    timeout: CONFIG.timeout
  };

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (data) {
    config.data = data;
  }

  try {
    const response = await axios(config);
    const duration = Date.now() - start;
    return {
      success: true,
      duration,
      status: response.status,
      data: response.data
    };
  } catch (error) {
    const duration = Date.now() - start;
    return {
      success: false,
      duration,
      status: error.response?.status || 0,
      error: error.response?.data?.error?.message || error.message
    };
  }
}

// Run concurrent requests
async function runConcurrent(name, requestFn, concurrency, iterations = 1) {
  const allResponses = [];

  for (let iter = 0; iter < iterations; iter++) {
    const promises = [];
    for (let i = 0; i < concurrency; i++) {
      promises.push(requestFn(i));
    }

    const responses = await Promise.all(promises);
    allResponses.push(...responses);
  }

  // Calculate statistics
  const successful = allResponses.filter(r => r.success);
  const failed = allResponses.filter(r => !r.success);
  const durations = allResponses.map(r => r.duration);

  const stats = {
    name,
    concurrency,
    iterations,
    totalRequests: allResponses.length,
    successful: successful.length,
    failed: failed.length,
    successRate: ((successful.length / allResponses.length) * 100).toFixed(1),
    timing: {
      min: Math.min(...durations),
      max: Math.max(...durations),
      avg: durations.reduce((a, b) => a + b, 0) / durations.length,
      p50: calculatePercentile(durations, 50),
      p95: calculatePercentile(durations, 95),
      p99: calculatePercentile(durations, 99)
    },
    errors: failed.map(r => r.error).filter((v, i, a) => a.indexOf(v) === i)
  };

  results.tests.push(stats);
  results.summary.totalRequests += stats.totalRequests;
  results.summary.successfulRequests += stats.successful;
  results.summary.failedRequests += stats.failed;

  return stats;
}

// Print test results
function printResults(stats) {
  console.log(`
  ${stats.name}
  ${'─'.repeat(50)}
  Concurrency:    ${stats.concurrency} concurrent requests x ${stats.iterations} iterations
  Total Requests: ${stats.totalRequests}
  Successful:     ${stats.successful} (${stats.successRate}%)
  Failed:         ${stats.failed}

  Response Times:
    Min:  ${formatMs(stats.timing.min)}
    Max:  ${formatMs(stats.timing.max)}
    Avg:  ${formatMs(stats.timing.avg)}
    p50:  ${formatMs(stats.timing.p50)}
    p95:  ${formatMs(stats.timing.p95)}
    p99:  ${formatMs(stats.timing.p99)}
  ${stats.errors.length > 0 ? `\n  Errors: ${stats.errors.join(', ')}` : ''}
  `);
}

// Test definitions
async function testHealthEndpoint(concurrency) {
  log(`Testing /health endpoint with ${concurrency} concurrent requests...`, 'info');

  const stats = await runConcurrent(
    'Health Check Endpoint',
    async () => timedRequest('get', '/health'),
    concurrency,
    CONFIG.iterations
  );

  printResults(stats);
  return stats;
}

async function testLoginEndpoint(concurrency) {
  log(`Testing /auth/login endpoint with ${concurrency} concurrent requests...`, 'info');

  const stats = await runConcurrent(
    'Login Endpoint',
    async () => timedRequest('post', '/auth/login', {
      email: TEST_ACCOUNTS.landlord.email,
      password: TEST_ACCOUNTS.landlord.password
    }),
    concurrency,
    CONFIG.iterations
  );

  printResults(stats);
  return stats;
}

async function testPropertiesEndpoint(concurrency, token) {
  log(`Testing /properties endpoint with ${concurrency} concurrent requests...`, 'info');

  const stats = await runConcurrent(
    'Properties List Endpoint',
    async () => timedRequest('get', '/properties', null, token),
    concurrency,
    CONFIG.iterations
  );

  printResults(stats);
  return stats;
}

async function testContractsEndpoint(concurrency, token) {
  log(`Testing /contracts endpoint with ${concurrency} concurrent requests...`, 'info');

  const stats = await runConcurrent(
    'Contracts List Endpoint',
    async () => timedRequest('get', '/contracts', null, token),
    concurrency,
    CONFIG.iterations
  );

  printResults(stats);
  return stats;
}

async function testDashboardEndpoint(concurrency, token) {
  log(`Testing /admin/dashboard endpoint with ${concurrency} concurrent requests...`, 'info');

  const stats = await runConcurrent(
    'Admin Dashboard Endpoint',
    async () => timedRequest('get', '/admin/dashboard', null, token),
    concurrency,
    CONFIG.iterations
  );

  printResults(stats);
  return stats;
}

async function testMarketDataEndpoint(concurrency) {
  log(`Testing /market/trends endpoint with ${concurrency} concurrent requests...`, 'info');

  const stats = await runConcurrent(
    'Market Data Endpoint',
    async () => timedRequest('get', '/market/trends'),
    concurrency,
    CONFIG.iterations
  );

  printResults(stats);
  return stats;
}

async function testRegistrationEndpoint(concurrency) {
  log(`Testing /auth/register endpoint with ${concurrency} concurrent requests...`, 'info');

  let counter = Date.now();

  const stats = await runConcurrent(
    'Registration Endpoint (unique users)',
    async (i) => {
      counter++;
      return timedRequest('post', '/auth/register', {
        email: `stresstest${counter}${i}@test.com`,
        phone: `02${String(counter).slice(-8)}`,
        password: 'Test@123',
        role: 'TENANT_INDIVIDUAL',
        firstName: 'Stress',
        lastName: `Test${i}`,
        ghanaCardNumber: `GHA-${String(counter).slice(-9)}-0`,
        digitalAddress: 'GA-123-4567'
      });
    },
    concurrency,
    1 // Only 1 iteration for registration to avoid too many test accounts
  );

  printResults(stats);
  return stats;
}

// Mixed load test (realistic scenario)
async function testMixedLoad(concurrency) {
  log(`Running mixed load test with ${concurrency} concurrent requests...`, 'info');

  // Get tokens first
  const loginResult = await timedRequest('post', '/auth/login', {
    email: TEST_ACCOUNTS.landlord.email,
    password: TEST_ACCOUNTS.landlord.password
  });
  const landlordToken = loginResult.data?.data?.token;

  const graLoginResult = await timedRequest('post', '/auth/login', {
    email: TEST_ACCOUNTS.gra.email,
    password: TEST_ACCOUNTS.gra.password
  });
  const graToken = graLoginResult.data?.data?.token;

  if (!landlordToken || !graToken) {
    log('Failed to get auth tokens for mixed load test', 'error');
    return null;
  }

  // Mix of different requests (weighted by typical usage)
  const requestTypes = [
    { weight: 30, name: 'health', fn: () => timedRequest('get', '/health') },
    { weight: 20, name: 'properties', fn: () => timedRequest('get', '/properties', null, landlordToken) },
    { weight: 15, name: 'contracts', fn: () => timedRequest('get', '/contracts', null, landlordToken) },
    { weight: 10, name: 'dashboard', fn: () => timedRequest('get', '/admin/dashboard', null, graToken) },
    { weight: 15, name: 'login', fn: () => timedRequest('post', '/auth/login', TEST_ACCOUNTS.tenant) },
    { weight: 10, name: 'market', fn: () => timedRequest('get', '/market/trends') }
  ];

  const totalWeight = requestTypes.reduce((sum, r) => sum + r.weight, 0);

  const stats = await runConcurrent(
    'Mixed Load Test (realistic traffic pattern)',
    async () => {
      // Select random request type based on weight
      let random = Math.random() * totalWeight;
      for (const req of requestTypes) {
        random -= req.weight;
        if (random <= 0) {
          return req.fn();
        }
      }
      return requestTypes[0].fn();
    },
    concurrency,
    CONFIG.iterations
  );

  printResults(stats);
  return stats;
}

// Sustained load test
async function testSustainedLoad(rps, durationSeconds) {
  log(`Running sustained load test: ${rps} RPS for ${durationSeconds} seconds...`, 'info');

  const loginResult = await timedRequest('post', '/auth/login', TEST_ACCOUNTS.landlord);
  const token = loginResult.data?.data?.token;

  if (!token) {
    log('Failed to get auth token for sustained load test', 'error');
    return null;
  }

  const startTime = Date.now();
  const endTime = startTime + (durationSeconds * 1000);
  const interval = 1000 / rps;
  const allResponses = [];

  while (Date.now() < endTime) {
    const batchStart = Date.now();

    // Fire requests for this second
    const promises = [];
    for (let i = 0; i < rps; i++) {
      promises.push(timedRequest('get', '/properties', null, token));
    }

    const responses = await Promise.all(promises);
    allResponses.push(...responses);

    // Wait for remainder of the second
    const elapsed = Date.now() - batchStart;
    if (elapsed < 1000) {
      await sleep(1000 - elapsed);
    }

    // Progress update
    const secondsRemaining = Math.ceil((endTime - Date.now()) / 1000);
    process.stdout.write(`\r  Remaining: ${secondsRemaining}s | Requests: ${allResponses.length}`);
  }

  console.log(''); // New line after progress

  // Calculate statistics
  const successful = allResponses.filter(r => r.success);
  const failed = allResponses.filter(r => !r.success);
  const durations = allResponses.map(r => r.duration);

  const stats = {
    name: `Sustained Load Test (${rps} RPS x ${durationSeconds}s)`,
    concurrency: rps,
    iterations: durationSeconds,
    totalRequests: allResponses.length,
    successful: successful.length,
    failed: failed.length,
    successRate: ((successful.length / allResponses.length) * 100).toFixed(1),
    actualRPS: (allResponses.length / durationSeconds).toFixed(1),
    timing: {
      min: Math.min(...durations),
      max: Math.max(...durations),
      avg: durations.reduce((a, b) => a + b, 0) / durations.length,
      p50: calculatePercentile(durations, 50),
      p95: calculatePercentile(durations, 95),
      p99: calculatePercentile(durations, 99)
    },
    errors: failed.map(r => r.error).filter((v, i, a) => a.indexOf(v) === i)
  };

  results.tests.push(stats);
  results.summary.totalRequests += stats.totalRequests;
  results.summary.successfulRequests += stats.successful;
  results.summary.failedRequests += stats.failed;

  printResults(stats);
  return stats;
}

// Main test runner
async function runStressTests() {
  const startTime = Date.now();

  console.log('\n' + '='.repeat(70));
  console.log('  GHANA RENTAL MARKET - API STRESS TEST');
  console.log('  Testing API performance under load');
  console.log('='.repeat(70) + '\n');

  log(`API: ${API_BASE_URL}`, 'info');

  // Warm up - check API is available
  log('Warming up API...', 'info');
  const warmup = await timedRequest('get', '/health');
  if (!warmup.success) {
    log(`API not available: ${warmup.error}`, 'error');
    return;
  }
  log(`API ready (warmup: ${warmup.duration}ms)`, 'success');

  // Get auth tokens for authenticated tests
  log('\nAuthenticating test accounts...', 'info');
  const landlordLogin = await timedRequest('post', '/auth/login', TEST_ACCOUNTS.landlord);
  const graLogin = await timedRequest('post', '/auth/login', TEST_ACCOUNTS.gra);

  const landlordToken = landlordLogin.data?.data?.token;
  const graToken = graLogin.data?.data?.token;

  if (!landlordToken || !graToken) {
    log('Failed to authenticate test accounts', 'error');
    return;
  }
  log('Authentication successful', 'success');

  // ===================== TEST PHASES =====================

  // Phase 1: Low concurrency tests
  console.log('\n' + '─'.repeat(70));
  log('PHASE 1: LOW CONCURRENCY TESTS (5 concurrent)', 'header');
  console.log('─'.repeat(70));

  await testHealthEndpoint(CONFIG.concurrency.low);
  await sleep(CONFIG.phaseDelay);

  await testLoginEndpoint(CONFIG.concurrency.low);
  await sleep(CONFIG.phaseDelay);

  await testPropertiesEndpoint(CONFIG.concurrency.low, landlordToken);
  await sleep(CONFIG.phaseDelay);

  // Phase 2: Medium concurrency tests
  console.log('\n' + '─'.repeat(70));
  log('PHASE 2: MEDIUM CONCURRENCY TESTS (10 concurrent)', 'header');
  console.log('─'.repeat(70));

  await testHealthEndpoint(CONFIG.concurrency.medium);
  await sleep(CONFIG.phaseDelay);

  await testPropertiesEndpoint(CONFIG.concurrency.medium, landlordToken);
  await sleep(CONFIG.phaseDelay);

  await testContractsEndpoint(CONFIG.concurrency.medium, landlordToken);
  await sleep(CONFIG.phaseDelay);

  // Phase 3: High concurrency tests
  console.log('\n' + '─'.repeat(70));
  log('PHASE 3: HIGH CONCURRENCY TESTS (25 concurrent)', 'header');
  console.log('─'.repeat(70));

  await testHealthEndpoint(CONFIG.concurrency.high);
  await sleep(CONFIG.phaseDelay);

  await testMixedLoad(CONFIG.concurrency.high);
  await sleep(CONFIG.phaseDelay);

  // Phase 4: Stress tests
  console.log('\n' + '─'.repeat(70));
  log('PHASE 4: STRESS TESTS (50 concurrent)', 'header');
  console.log('─'.repeat(70));

  await testHealthEndpoint(CONFIG.concurrency.stress);
  await sleep(CONFIG.phaseDelay);

  await testPropertiesEndpoint(CONFIG.concurrency.stress, landlordToken);
  await sleep(CONFIG.phaseDelay);

  // Phase 5: Sustained load test
  console.log('\n' + '─'.repeat(70));
  log('PHASE 5: SUSTAINED LOAD TEST', 'header');
  console.log('─'.repeat(70));

  await testSustainedLoad(5, 10); // 5 RPS for 10 seconds

  // ===================== FINAL SUMMARY =====================
  const totalTime = Date.now() - startTime;
  results.summary.totalTime = totalTime;

  console.log('\n' + '='.repeat(70));
  console.log('  STRESS TEST COMPLETE - FINAL SUMMARY');
  console.log('='.repeat(70));
  console.log(`
  OVERALL STATISTICS:
    Total Test Duration:  ${(totalTime / 1000).toFixed(1)} seconds
    Total Requests:       ${results.summary.totalRequests}
    Successful:           ${results.summary.successfulRequests}
    Failed:               ${results.summary.failedRequests}
    Overall Success Rate: ${((results.summary.successfulRequests / results.summary.totalRequests) * 100).toFixed(1)}%
    Avg RPS:              ${(results.summary.totalRequests / (totalTime / 1000)).toFixed(1)}

  ENDPOINT PERFORMANCE RANKING (by avg response time):
  `);

  // Sort tests by average response time
  const sortedTests = results.tests
    .filter(t => t.timing)
    .sort((a, b) => a.timing.avg - b.timing.avg);

  sortedTests.forEach((test, i) => {
    const status = test.successRate >= 99 ? '✓' : test.successRate >= 95 ? '⚠' : '✗';
    console.log(`    ${i + 1}. ${status} ${test.name}`);
    console.log(`       Avg: ${formatMs(test.timing.avg)} | p95: ${formatMs(test.timing.p95)} | Success: ${test.successRate}%`);
  });

  console.log('\n' + '='.repeat(70));

  // Performance recommendations
  console.log('\n  RECOMMENDATIONS:');

  const slowEndpoints = sortedTests.filter(t => t.timing.avg > 1000);
  if (slowEndpoints.length > 0) {
    console.log('    - Consider optimizing these slow endpoints:');
    slowEndpoints.forEach(t => console.log(`      * ${t.name} (avg: ${formatMs(t.timing.avg)})`));
  }

  const unreliableEndpoints = results.tests.filter(t => parseFloat(t.successRate) < 99);
  if (unreliableEndpoints.length > 0) {
    console.log('    - These endpoints had failures under load:');
    unreliableEndpoints.forEach(t => console.log(`      * ${t.name} (${t.successRate}% success)`));
  }

  if (slowEndpoints.length === 0 && unreliableEndpoints.length === 0) {
    console.log('    ✓ All endpoints performed well under load!');
  }

  console.log('\n' + '='.repeat(70) + '\n');
}

// Run the stress tests
runStressTests().catch(error => {
  console.error('Stress test failed:', error);
  process.exit(1);
});
