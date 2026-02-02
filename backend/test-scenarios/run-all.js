#!/usr/bin/env node

/**
 * Ghana Rental System - Full Test Suite Runner
 *
 * Runs all test scenarios across all user roles
 *
 * Usage:
 *   node run-all.js              # Run all tests
 *   node run-all.js --role=landlord   # Run only landlord tests
 *   node run-all.js --role=tenant     # Run only tenant tests
 *   node run-all.js --role=gra        # Run only GRA tests
 *   node run-all.js --role=inspector  # Run only inspector tests
 *   node run-all.js --role=admin      # Run only admin tests
 *   node run-all.js --role=shared     # Run only shared tests
 */

const config = require('./config');

// Test imports - Shared
const { runAuthTests } = require('./shared/auth.test');
const { runMarketTests } = require('./shared/market.test');
const { runNotificationTests } = require('./shared/notifications.test');

// Test imports - Landlord
const { runLandlordPropertyTests } = require('./landlord/properties.test');
const { runLandlordContractTests } = require('./landlord/contracts.test');
const { runLandlordTaxTests } = require('./landlord/tax.test');

// Test imports - Tenant
const { runTenantContractTests } = require('./tenant/contracts.test');
const { runTenantPaymentTests } = require('./tenant/payments.test');

// Test imports - GRA/Inspector/Admin
const { runGRADashboardTests } = require('./gra-officer/dashboard.test');
const { runInspectorCaseTests } = require('./inspector/cases.test');
const { runAdminUserTests } = require('./admin/users.test');

// Parse command line arguments
const args = process.argv.slice(2);
const roleArg = args.find(arg => arg.startsWith('--role='));
const selectedRole = roleArg ? roleArg.split('=')[1].toLowerCase() : 'all';

// Test suites by role
const testSuites = {
  shared: [
    { name: 'Authentication', fn: runAuthTests },
    { name: 'Market Data', fn: runMarketTests },
    { name: 'Notifications', fn: runNotificationTests }
  ],
  landlord: [
    { name: 'Landlord Properties', fn: runLandlordPropertyTests },
    { name: 'Landlord Contracts', fn: runLandlordContractTests },
    { name: 'Landlord Tax', fn: runLandlordTaxTests }
  ],
  tenant: [
    { name: 'Tenant Contracts', fn: runTenantContractTests },
    { name: 'Tenant Payments', fn: runTenantPaymentTests }
  ],
  gra: [
    { name: 'GRA Dashboard', fn: runGRADashboardTests }
  ],
  inspector: [
    { name: 'Inspector Cases', fn: runInspectorCaseTests }
  ],
  admin: [
    { name: 'Admin Users', fn: runAdminUserTests }
  ]
};

async function runTests() {
  console.log(`
${config.colors.magenta}╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║      GHANA RENTAL SYSTEM - TEST SUITE                        ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝${config.colors.reset}
`);

  console.log(`API URL: ${config.apiBaseUrl}`);
  console.log(`Selected Role: ${selectedRole}`);
  console.log(`Start Time: ${new Date().toISOString()}\n`);

  const results = {
    totalPassed: 0,
    totalFailed: 0,
    totalSkipped: 0,
    suites: []
  };

  // Determine which suites to run
  let suitesToRun = [];
  if (selectedRole === 'all') {
    suitesToRun = [
      ...testSuites.shared,
      ...testSuites.landlord,
      ...testSuites.tenant,
      ...testSuites.gra,
      ...testSuites.inspector,
      ...testSuites.admin
    ];
  } else if (testSuites[selectedRole]) {
    // Always include shared tests
    suitesToRun = [...testSuites.shared, ...testSuites[selectedRole]];
  } else {
    console.error(`Unknown role: ${selectedRole}`);
    console.log('Available roles: shared, landlord, tenant, gra, inspector, admin, all');
    process.exit(1);
  }

  // Run each suite
  for (const suite of suitesToRun) {
    try {
      const suiteResult = await suite.fn();
      results.totalPassed += suiteResult.passed;
      results.totalFailed += suiteResult.failed;
      results.totalSkipped += suiteResult.skipped;
      results.suites.push({
        name: suite.name,
        ...suiteResult
      });
    } catch (error) {
      console.error(`\n${config.colors.red}Suite "${suite.name}" crashed: ${error.message}${config.colors.reset}\n`);
      results.suites.push({
        name: suite.name,
        passed: 0,
        failed: 1,
        skipped: 0,
        error: error.message
      });
      results.totalFailed++;
    }
  }

  // Print final summary
  console.log(`
${config.colors.magenta}╔══════════════════════════════════════════════════════════════╗
║                    FINAL SUMMARY                             ║
╚══════════════════════════════════════════════════════════════╝${config.colors.reset}
`);

  for (const suite of results.suites) {
    const status = suite.failed === 0
      ? `${config.colors.green}✓ PASSED${config.colors.reset}`
      : `${config.colors.red}✗ FAILED${config.colors.reset}`;
    console.log(`  ${suite.name}: ${status} (${suite.passed}/${suite.passed + suite.failed})`);
  }

  const total = results.totalPassed + results.totalFailed + results.totalSkipped;
  console.log(`
${config.colors.cyan}────────────────────────────────────────────────────────────────${config.colors.reset}
  ${config.colors.green}Passed:${config.colors.reset}  ${results.totalPassed}
  ${config.colors.red}Failed:${config.colors.reset}  ${results.totalFailed}
  ${config.colors.yellow}Skipped:${config.colors.reset} ${results.totalSkipped}
  ${config.colors.blue}Total:${config.colors.reset}   ${total}
${config.colors.cyan}────────────────────────────────────────────────────────────────${config.colors.reset}

  End Time: ${new Date().toISOString()}
`);

  // Exit with appropriate code
  process.exit(results.totalFailed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('Test runner failed:', error);
  process.exit(1);
});
