# Ghana Rental System - Backend API

Node.js/Express.js REST API for the Ghana Rental Market Taxation System.

## Overview

This backend provides:
- RESTful API endpoints for all system operations
- JWT-based authentication
- PostgreSQL database with migrations
- Security middleware (rate limiting, CORS, helmet)
- Tax calculation and withholding logic
- Integration simulations (NIA, GRA, Mobile Money)

## Tech Stack

- **Runtime**: Node.js >= 18.0.0
- **Framework**: Express.js 4.18
- **Database**: PostgreSQL 8.11 (pg driver)
- **Authentication**: JWT (jsonwebtoken) + bcrypt
- **Validation**: express-validator
- **Security**: helmet, cors, rate-limiter
- **Testing**: Jest 29.7
- **File Handling**: multer, sharp
- **PDF Generation**: pdfkit
- **QR Codes**: qrcode

## Project Structure

```
backend/
├── src/
│   ├── app.js              # Express app entry point
│   ├── controllers/        # Request handlers
│   │   ├── auth.js         # Authentication
│   │   ├── properties.js   # Property management
│   │   ├── contracts.js    # Contract management
│   │   ├── payments.js     # Payment processing
│   │   ├── reports.js      # Analytics and reports
│   │   └── ussd.js         # USSD simulator
│   ├── middleware/
│   │   ├── auth.js         # JWT verification
│   │   ├── errorHandler.js # Error handling
│   │   ├── security.js     # Rate limiting, sanitization
│   │   └── validation.js   # Request validation rules
│   ├── routes/
│   │   └── index.js        # API route definitions
│   ├── services/           # Business logic
│   │   ├── taxService.js   # Tax calculations
│   │   └── simulators/     # External service mocks
│   └── utils/
│       ├── constants.js    # System constants
│       └── database.js     # Database connection
├── database/
│   ├── migrations/         # Schema migrations
│   │   ├── migrate-postgres.js
│   │   └── add-indexes.js
│   └── seeds/              # Demo data
│       ├── seed-postgres.js
│       └── seed-more-data.js
├── tests/                  # Jest unit tests
│   └── unit/
│       ├── auth.test.js
│       ├── properties.test.js
│       ├── contracts.test.js
│       └── payments.test.js
├── uploads/                # File uploads directory
├── package.json
└── .env.example
```

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- PostgreSQL 14+ (or use SQLite for development)

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Configure environment variables (see below)
```

### Environment Variables

Create a `.env` file:

```env
# Server
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/ghana_rental

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Features
SIMULATION_MODE=true
DEMO_MODE=true

# AWS S3 (optional, for file uploads)
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=eu-west-1
AWS_S3_BUCKET=ghana-rental-uploads
```

### Database Setup

```bash
# Run migrations (creates all tables)
npm run migrate

# Seed demo data (8 users, 5 properties, 3 contracts)
npm run seed

# Seed more data (adds 200 users, 100 properties, 128 contracts)
npm run seed:more

# Reset database (migrate + seed)
npm run db:reset

# Add performance indexes
npm run db:indexes
```

### Running the Server

```bash
# Development (with hot reload)
npm run dev

# Production
npm start
```

Server will start at `http://localhost:3000`

## API Reference

### Base URL
- Development: `http://localhost:3000/api`
- Production: `https://ghana-rental-api.onrender.com/api`

### Authentication

All protected routes require `Authorization: Bearer <token>` header.

#### POST /api/auth/login
Login and receive JWT token.

```json
{
  "email": "landlord@demo.com",
  "password": "demo123"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "email": "landlord@demo.com",
      "role": "LANDLORD_INDIVIDUAL",
      "firstName": "Kwame",
      "lastName": "Asante"
    }
  }
}
```

#### POST /api/auth/register
Register new user.

```json
{
  "email": "user@example.com",
  "password": "password123",
  "role": "TENANT_INDIVIDUAL",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+233241234567",
  "ghanaCardNumber": "GHA-123456789-0",
  "region": "Greater Accra",
  "district": "Accra Metropolitan"
}
```

#### GET /api/auth/me
Get current authenticated user.

### Properties

#### GET /api/properties
List properties (filtered by user role).

Query params:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `region`: Filter by region
- `status`: Filter by status (VERIFIED, PENDING_VERIFICATION)

#### POST /api/properties
Create new property (landlords only).

```json
{
  "digitalAddress": "GA-123-4567",
  "region": "Greater Accra",
  "district": "Accra Metropolitan",
  "city": "Accra",
  "neighborhood": "East Legon",
  "propertyType": "R-3B",
  "propertyCategory": "RESIDENTIAL",
  "bedrooms": 3,
  "bathrooms": 2,
  "floorAreaSqm": 120,
  "yearBuilt": 2020,
  "isFurnished": true,
  "hasParking": true,
  "monthlyRent": 3500
}
```

#### GET /api/properties/:id
Get property details.

#### PUT /api/properties/:id
Update property.

### Contracts

#### GET /api/contracts
List contracts (filtered by user role).

#### POST /api/contracts
Create new contract (landlords only).

```json
{
  "propertyId": "uuid",
  "tenantEmail": "tenant@example.com",
  "contractType": "RESIDENTIAL",
  "startDate": "2024-01-01",
  "endDate": "2025-12-31",
  "monthlyRent": 3500,
  "securityDeposit": 7000,
  "serviceCharge": 200,
  "advanceMonths": 2,
  "paymentFrequency": "MONTHLY"
}
```

#### PUT /api/contracts/:id/confirm
Tenant confirms contract with code.

```json
{
  "confirmationCode": "123456"
}
```

### Payments

#### GET /api/payments
List payments with tax details.

#### POST /api/payments
Record rent payment.

```json
{
  "contractId": "uuid",
  "grossAmount": 3500,
  "paymentMethod": "MOBILE_MONEY",
  "paymentProvider": "MTN"
}
```

#### GET /api/payments/summary
Get payment summary with total tax collected.

### Reports

#### GET /api/reports/tax-summary
Tax collection summary (GRA officers only).

Query params:
- `startDate`: Start of period
- `endDate`: End of period
- `region`: Filter by region

#### GET /api/reports/market-data
Market rent analytics.

Query params:
- `region`: Region to analyze
- `propertyType`: Property type code

### Health Check

#### GET /api/health
API health status.

Response:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "database": "connected",
    "version": "1.0.0"
  }
}
```

## Security

### Rate Limiting
- General routes: 100 requests per 15 minutes per IP
- Auth routes: 5 requests per 15 minutes per IP

### CORS Whitelist
Allowed origins:
- `http://localhost:3000`
- `http://localhost:5173`
- `http://localhost:5174`
- `http://localhost:8081`
- `*.render.com`

### Helmet Security Headers
Standard security headers are applied via helmet.js.

### Input Sanitization
All inputs are sanitized to prevent XSS and SQL injection.

## Testing

```bash
# Run all tests
npm test

# Run with coverage report
npm run test:coverage

# Run specific test file
npm test -- tests/unit/auth.test.js
```

Current status: **53 tests passing**

## Business Logic

### Tax Calculation

```javascript
// Registered landlord
taxAmount = grossRent * 0.08  // 8% withholding

// Unregistered landlord
taxAmount = grossRent * 0.15  // 15% withholding

// Platform fee
platformFee = Math.min(grossRent * 0.01, 50)  // 1%, max GHS 50

// Net to landlord
netAmount = grossRent - taxAmount - platformFee
```

### User Roles

| Role | Code | Permissions |
|------|------|-------------|
| Individual Landlord | LANDLORD_INDIVIDUAL | Own properties, contracts |
| Corporate Landlord | LANDLORD_CORPORATE | Own properties, contracts |
| Individual Tenant | TENANT_INDIVIDUAL | Own contracts as tenant |
| Corporate Tenant | TENANT_CORPORATE | Own contracts as tenant |
| GRA Officer | GRA_OFFICER | View all, reports |
| GRA Supervisor | GRA_SUPERVISOR | Approve, manage officers |
| Inspector | INSPECTOR | Property inspections |
| System Admin | SYSTEM_ADMIN | Full access |

### Property Types

| Code | Description |
|------|-------------|
| R-SR | Single Room |
| R-SC | Self-Contained |
| R-1B | 1 Bedroom |
| R-2B | 2 Bedroom |
| R-3B | 3 Bedroom |
| R-4B+ | 4+ Bedroom |
| R-VL | Villa |
| C-SH | Shop |
| C-OFF | Office |
| C-WH | Warehouse |

## Troubleshooting

### Database Connection Issues
```bash
# Test connection
node -e "require('pg').Pool({connectionString: process.env.DATABASE_URL}).query('SELECT 1')"
```

### Migration Fails
```bash
# Check PostgreSQL version (requires 14+)
psql --version

# Run migrations with verbose output
DEBUG=* npm run migrate
```

### JWT Errors
- Ensure JWT_SECRET is set and consistent across restarts
- Check token expiration (default: 7 days)

## Deployment

See [DEPLOYMENT_GUIDE.md](../DEPLOYMENT_GUIDE.md) for full deployment instructions.

### Quick Deploy to Render

1. Push to GitHub
2. Connect repo to Render
3. Render auto-detects `render.yaml`
4. Set environment variables
5. Deploy

### Environment for Production

```env
NODE_ENV=production
DATABASE_URL=<render-postgres-internal-url>
JWT_SECRET=<strong-random-secret>
SIMULATION_MODE=true
```

## License

Proprietary - Ghana Revenue Authority
