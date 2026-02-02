# Ghana Rental System - Test Scenarios

Comprehensive API test suite organized by user role.

## Structure

```
test-scenarios/
├── config.js              # Shared configuration
├── utils.js               # Test utilities (TestRunner, ApiClient, assertions)
├── run-all.js             # Main test runner
├── README.md              # This file
│
├── shared/                # Tests for all users
│   ├── auth.test.js       # Authentication & authorization
│   ├── market.test.js     # Market data & property search
│   └── notifications.test.js # Notification system
│
├── landlord/              # Landlord-specific tests
│   ├── properties.test.js # Property CRUD operations
│   ├── contracts.test.js  # Contract management
│   └── tax.test.js        # Tax certificates & records
│
├── tenant/                # Tenant-specific tests
│   ├── contracts.test.js  # Contract viewing & confirmation
│   └── payments.test.js   # Rent payments
│
├── gra-officer/           # GRA Officer tests
│   └── dashboard.test.js  # Tax administration & oversight
│
├── inspector/             # Inspector tests
│   └── cases.test.js      # Case management & inspections
│
└── admin/                 # System admin tests
    └── users.test.js      # User management & system config
```

## Usage

### Prerequisites

1. Backend server running (local or remote)
2. Database seeded with demo data

### Run All Tests

```bash
cd backend/test-scenarios
node run-all.js
```

### Run Tests by Role

```bash
# Shared tests only
node run-all.js --role=shared

# Landlord tests (includes shared)
node run-all.js --role=landlord

# Tenant tests (includes shared)
node run-all.js --role=tenant

# GRA Officer tests (includes shared)
node run-all.js --role=gra

# Inspector tests (includes shared)
node run-all.js --role=inspector

# Admin tests (includes shared)
node run-all.js --role=admin
```

### Run Individual Test File

```bash
node shared/auth.test.js
node landlord/properties.test.js
node tenant/payments.test.js
```

### Configuration

Set environment variables or modify `config.js`:

```bash
# Test against local server
TEST_API_URL=http://localhost:3000/api node run-all.js

# Test against production
TEST_API_URL=https://ghana-rental-api.onrender.com/api node run-all.js
```

## Test Categories

### Shared Tests
- **Authentication**: Registration, login, OTP, token validation
- **Market Data**: Rent statistics, property search, regions
- **Notifications**: WhatsApp, n8n, notification status

### Landlord Tests
- **Properties**: Create, update, delete, list, search
- **Contracts**: Create contracts, manage tenants
- **Tax**: View certificates, tax history, TIN management

### Tenant Tests
- **Contracts**: View contracts, confirm/object
- **Payments**: Make payments, view history, receipts

### GRA Officer Tests
- **Dashboard**: Tax statistics, collection reports
- **Oversight**: View all contracts, payments, properties

### Inspector Tests
- **Cases**: View assigned cases, submit reports
- **Inspections**: Schedule, reschedule, document

### Admin Tests
- **Users**: Create, suspend, verify users
- **System**: Configuration, audit logs, statistics

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Landlord | landlord@demo.com | demo123 |
| Landlord 2 | landlord2@demo.com | demo123 |
| Tenant | tenant@demo.com | demo123 |
| Tenant 2 | tenant2@demo.com | demo123 |
| GRA Officer | gra@demo.com | demo123 |
| Inspector | inspector@demo.com | demo123 |
| Supervisor | supervisor@demo.com | demo123 |
| Admin | admin@demo.com | admin123 |

## Output

Tests display colored output:
- ✓ Green = Passed
- ✗ Red = Failed
- ○ Yellow = Skipped

Exit code 0 = all tests passed, 1 = failures occurred.

## Adding New Tests

1. Create test file in appropriate role folder
2. Follow existing pattern using `TestRunner` and `ApiClient`
3. Export the test function
4. Add to `run-all.js` imports and testSuites

Example:
```javascript
const { TestRunner, ApiClient, assert, config } = require('../utils');

async function runMyTests() {
  const runner = new TestRunner('My Test Suite');
  const api = new ApiClient();

  runner.start();

  await runner.test('Test name', async () => {
    const response = await api.get('/endpoint');
    assert.isSuccess(response);
  });

  return runner.summary();
}

module.exports = { runMyTests };
```
