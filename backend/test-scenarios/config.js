/**
 * Test Configuration
 *
 * Shared configuration for all test scenarios
 */

require('dotenv').config();

const config = {
  // API Configuration
  apiBaseUrl: process.env.TEST_API_URL || 'http://localhost:3000/api',

  // Timeouts
  requestTimeout: 30000,

  // Simulation key for bypassing OTP
  simulationKey: 'ghana-rental-sim-2024',

  // Demo accounts (pre-seeded in database)
  demoAccounts: {
    landlord: { email: 'landlord@demo.com', password: 'demo123' },
    landlord2: { email: 'landlord2@demo.com', password: 'demo123' },
    tenant: { email: 'tenant@demo.com', password: 'demo123' },
    tenant2: { email: 'tenant2@demo.com', password: 'demo123' },
    graOfficer: { email: 'gra@demo.com', password: 'demo123' },
    inspector: { email: 'inspector@demo.com', password: 'demo123' },
    supervisor: { email: 'supervisor@demo.com', password: 'demo123' },
    admin: { email: 'admin@demo.com', password: 'admin123' }
  },

  // Test data generators
  generatePhone: () => `+23324${Math.floor(1000000 + Math.random() * 9000000)}`,
  generateEmail: (prefix) => `${prefix}_${Date.now()}@test.com`,
  generateGhanaCard: () => `GHA-${Math.floor(100000000 + Math.random() * 900000000)}-${Math.floor(Math.random() * 10)}`,
  generateTIN: () => `P00${Math.floor(10000000 + Math.random() * 90000000)}`,
  generateDigitalAddress: (region = 'GA') => `${region}-${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}`,

  // Colors for console output
  colors: {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m'
  }
};

module.exports = config;
