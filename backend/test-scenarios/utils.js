/**
 * Test Utilities
 *
 * Shared helper functions for all test scenarios
 */

const axios = require('axios');
const config = require('./config');

class TestRunner {
  constructor(suiteName) {
    this.suiteName = suiteName;
    this.passed = 0;
    this.failed = 0;
    this.skipped = 0;
    this.results = [];
    this.startTime = null;
  }

  // Start test suite
  start() {
    this.startTime = Date.now();
    console.log(`\n${config.colors.cyan}${'='.repeat(60)}${config.colors.reset}`);
    console.log(`${config.colors.cyan}  TEST SUITE: ${this.suiteName}${config.colors.reset}`);
    console.log(`${config.colors.cyan}${'='.repeat(60)}${config.colors.reset}\n`);
  }

  // Run a single test
  async test(name, fn) {
    process.stdout.write(`  ${name}... `);
    try {
      await fn();
      this.passed++;
      this.results.push({ name, status: 'passed' });
      console.log(`${config.colors.green}✓ PASSED${config.colors.reset}`);
      return true;
    } catch (error) {
      this.failed++;
      this.results.push({ name, status: 'failed', error: error.message });
      console.log(`${config.colors.red}✗ FAILED${config.colors.reset}`);
      console.log(`    ${config.colors.red}Error: ${error.message}${config.colors.reset}`);
      return false;
    }
  }

  // Skip a test
  skip(name, reason = '') {
    this.skipped++;
    this.results.push({ name, status: 'skipped', reason });
    console.log(`  ${name}... ${config.colors.yellow}○ SKIPPED${reason ? ` (${reason})` : ''}${config.colors.reset}`);
  }

  // Print summary
  summary() {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);
    const total = this.passed + this.failed + this.skipped;

    console.log(`\n${config.colors.cyan}${'─'.repeat(60)}${config.colors.reset}`);
    console.log(`  Results: ${config.colors.green}${this.passed} passed${config.colors.reset}, ${config.colors.red}${this.failed} failed${config.colors.reset}, ${config.colors.yellow}${this.skipped} skipped${config.colors.reset}`);
    console.log(`  Total: ${total} tests in ${duration}s`);
    console.log(`${config.colors.cyan}${'─'.repeat(60)}${config.colors.reset}\n`);

    return { passed: this.passed, failed: this.failed, skipped: this.skipped, total, duration };
  }
}

// API client with authentication support
class ApiClient {
  constructor(baseUrl = config.apiBaseUrl) {
    this.baseUrl = baseUrl;
    this.token = null;
    this.user = null;
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
  }

  // Get headers
  getHeaders(extraHeaders = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...extraHeaders
    };
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    return headers;
  }

  // Make API request
  async request(method, endpoint, data = null, extraHeaders = {}) {
    const config = {
      method,
      url: `${this.baseUrl}${endpoint}`,
      headers: this.getHeaders(extraHeaders),
      timeout: 30000,
      validateStatus: () => true // Don't throw on non-2xx
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return {
      status: response.status,
      data: response.data,
      success: response.data?.success ?? (response.status >= 200 && response.status < 300)
    };
  }

  // Convenience methods
  async get(endpoint, extraHeaders = {}) {
    return this.request('GET', endpoint, null, extraHeaders);
  }

  async post(endpoint, data, extraHeaders = {}) {
    return this.request('POST', endpoint, data, extraHeaders);
  }

  async put(endpoint, data, extraHeaders = {}) {
    return this.request('PUT', endpoint, data, extraHeaders);
  }

  async patch(endpoint, data, extraHeaders = {}) {
    return this.request('PATCH', endpoint, data, extraHeaders);
  }

  async delete(endpoint, extraHeaders = {}) {
    return this.request('DELETE', endpoint, null, extraHeaders);
  }

  // Login helper
  async login(email, password) {
    const response = await this.post('/auth/login', { email, password });
    if (response.success && response.data?.data?.token) {
      this.token = response.data.data.token;
      this.user = response.data.data.user;
      return { success: true, user: this.user, token: this.token };
    }
    return { success: false, error: response.data?.error?.message || 'Login failed' };
  }

  // Register and activate helper (bypasses OTP)
  async registerAndActivate(userData) {
    // Register
    await this.post('/auth/register', userData);

    // Activate via simulation bypass
    const activateResponse = await this.post('/auth/simulation-activate',
      { email: userData.email },
      { 'X-Simulation-Key': config.simulationKey }
    );

    if (activateResponse.success && activateResponse.data?.data?.token) {
      this.token = activateResponse.data.data.token;
      this.user = activateResponse.data.data.user;
      return { success: true, user: this.user, token: this.token };
    }

    return { success: false, error: activateResponse.data?.error?.message || 'Activation failed' };
  }
}

// Assertion helpers
const assert = {
  equals: (actual, expected, message = '') => {
    if (actual !== expected) {
      throw new Error(`${message} Expected ${expected}, got ${actual}`);
    }
  },

  notEquals: (actual, expected, message = '') => {
    if (actual === expected) {
      throw new Error(`${message} Expected not ${expected}, but got it`);
    }
  },

  isTrue: (value, message = '') => {
    if (value !== true) {
      throw new Error(`${message} Expected true, got ${value}`);
    }
  },

  isFalse: (value, message = '') => {
    if (value !== false) {
      throw new Error(`${message} Expected false, got ${value}`);
    }
  },

  exists: (value, message = '') => {
    if (value === null || value === undefined) {
      throw new Error(`${message} Expected value to exist, got ${value}`);
    }
  },

  isArray: (value, message = '') => {
    if (!Array.isArray(value)) {
      throw new Error(`${message} Expected array, got ${typeof value}`);
    }
  },

  hasLength: (arr, length, message = '') => {
    if (!Array.isArray(arr) || arr.length !== length) {
      throw new Error(`${message} Expected array length ${length}, got ${arr?.length}`);
    }
  },

  hasMinLength: (arr, length, message = '') => {
    if (!Array.isArray(arr) || arr.length < length) {
      throw new Error(`${message} Expected array length >= ${length}, got ${arr?.length}`);
    }
  },

  hasProperty: (obj, prop, message = '') => {
    if (!obj || !(prop in obj)) {
      throw new Error(`${message} Expected property '${prop}' to exist`);
    }
  },

  statusCode: (response, expected, message = '') => {
    if (response.status !== expected) {
      throw new Error(`${message} Expected status ${expected}, got ${response.status}`);
    }
  },

  isSuccess: (response, message = '') => {
    if (!response.success) {
      throw new Error(`${message} Expected success, got error: ${response.data?.error?.message || 'Unknown error'}`);
    }
  },

  isError: (response, message = '') => {
    if (response.success) {
      throw new Error(`${message} Expected error, got success`);
    }
  },

  contains: (str, substring, message = '') => {
    if (typeof str !== 'string' || !str.includes(substring)) {
      throw new Error(`${message} Expected "${str}" to contain "${substring}"`);
    }
  },

  greaterThan: (actual, expected, message = '') => {
    if (actual <= expected) {
      throw new Error(`${message} Expected ${actual} > ${expected}`);
    }
  },

  greaterOrEqual: (actual, expected, message = '') => {
    if (actual < expected) {
      throw new Error(`${message} Expected ${actual} >= ${expected}`);
    }
  }
};

// Sleep utility
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

module.exports = {
  TestRunner,
  ApiClient,
  assert,
  sleep,
  config
};
