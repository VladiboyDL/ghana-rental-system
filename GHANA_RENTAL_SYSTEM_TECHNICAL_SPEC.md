# Ghana Rental Market Taxation System - Technical Specification

## Document Information
- **Version:** 2.0
- **Date:** January 2025
- **Last Updated:** January 29, 2025
- **Purpose:** Technical specification for the Ghana Rental Market Taxation System
- **Status:** Implementation Complete

---

# Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Overview](#2-system-overview)
3. [Implementation Status](#3-implementation-status)
4. [User Roles & Access](#4-user-roles--access)
5. [Technology Stack](#5-technology-stack)
6. [Data Models](#6-data-models)
7. [Mobile App](#7-mobile-app)
8. [Web Portal](#8-web-portal)
9. [API Specifications](#9-api-specifications)
10. [Deployment](#10-deployment)
11. [Demo Accounts](#11-demo-accounts)

---

# 1. Executive Summary

## 1.1 Problem Statement
In Ghana, 90% of the population lives in rental premises. Landlords commonly require tenants to prepay rent for up to two years in advance, creating financial stress. The rental market remains largely unregulated, leading to tax evasion and unfair practices.

## 1.2 Solution
A centralized digital system for registering all rental contracts with:
- Mandatory digital contract registration (unregistered contracts are invalid)
- Automatic 8% tax withholding on rent payments
- Real-time monitoring and enforcement
- Market transparency through rent data
- Mobile app for landlords and tenants
- Web portal for GRA officers, inspectors, and administrators

## 1.3 Key Features Implemented
- ✅ User registration with Ghana Card verification
- ✅ Property management with digital addressing
- ✅ Digital contract creation with ID scanning (OCR)
- ✅ Digital signature capture
- ✅ Mobile money payment integration (MTN, Vodafone, AirtelTigo)
- ✅ Automatic 8% withholding tax calculation
- ✅ Role-based access control
- ✅ Compliance monitoring dashboards
- ✅ Inspector case management

---

# 2. System Overview

## 2.1 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND LAYER                           │
├─────────────────────────────────┬───────────────────────────────┤
│        Web Portal (React)       │    Mobile App (React Native)  │
│   GRA/Inspector/Admin Only      │    Landlord/Tenant Only       │
└────────────────┬────────────────┴───────────────┬───────────────┘
                 │                                │
                 └────────────────┬───────────────┘
                                  │
┌─────────────────────────────────┴───────────────────────────────┐
│                     API LAYER (REST)                            │
│                     Node.js / Express                           │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
┌─────────────────────────────────┴───────────────────────────────┐
│                   BUSINESS LOGIC LAYER                          │
├─────────────┬─────────────┬─────────────┬─────────────┬─────────┤
│ User Mgmt   │ Property    │ Contract    │ Payment     │ Enforce │
│ Module      │ Module      │ Module      │ Module      │ Module  │
└─────────────┴─────────────┴─────────────┴─────────────┴─────────┘
                                  │
┌─────────────────────────────────┴───────────────────────────────┐
│                      DATA LAYER                                 │
│                    PostgreSQL (Render)                          │
└─────────────────────────────────────────────────────────────────┘
```

## 2.2 Platform Access Matrix

| Role | Web Portal | Mobile App |
|------|------------|------------|
| Landlord | ❌ Not Allowed | ✅ Full Access |
| Tenant | ❌ Not Allowed | ✅ Full Access |
| GRA Officer | ✅ Full Access | ❌ Not Available |
| GRA Supervisor | ✅ Full Access | ❌ Not Available |
| Inspector | ✅ Full Access | ❌ Not Available |
| Admin | ✅ Full Access | ❌ Not Available |
| System Admin | ✅ Full Access | ❌ Not Available |

---

# 3. Implementation Status

## 3.1 Completed Components

### Backend (Node.js/Express)
- ✅ RESTful API with JWT authentication
- ✅ PostgreSQL database with Sequelize ORM
- ✅ User management with role-based access
- ✅ Property registration and management
- ✅ Contract creation and management
- ✅ Payment processing with tax calculation
- ✅ Document scanning and OCR integration
- ✅ Simulated external service integrations

### Web Frontend (React)
- ✅ Role-restricted access (GRA/Inspector/Admin only)
- ✅ Dashboard with analytics
- ✅ Property management views
- ✅ Contract monitoring
- ✅ Payment tracking
- ✅ Compliance reports
- ✅ Inspector case management
- ✅ Mobile app redirect notice for landlords/tenants

### Mobile App (React Native/Expo)
- ✅ Landlord and Tenant authentication flows
- ✅ OTP verification
- ✅ Property registration (Landlord)
- ✅ Contract creation with ID scanning (Landlord)
- ✅ Ghana Card OCR data extraction
- ✅ Digital signature capture
- ✅ Contract confirmation (Tenant)
- ✅ Mobile money payment integration
- ✅ Payment history and receipts
- ✅ Profile management
- ✅ Push notifications support

---

# 4. User Roles & Access

## 4.1 Mobile App Roles

### Landlord
```json
{
  "role": "LANDLORD",
  "platform": "MOBILE",
  "permissions": [
    "register_property",
    "create_contract",
    "scan_tenant_id",
    "sign_contract",
    "view_own_contracts",
    "view_own_payments",
    "download_tax_certificate",
    "update_profile"
  ]
}
```

### Tenant
```json
{
  "role": "TENANT",
  "platform": "MOBILE",
  "permissions": [
    "confirm_contract",
    "scan_own_id",
    "sign_contract",
    "make_payment",
    "view_own_contracts",
    "view_own_payments",
    "update_profile"
  ]
}
```

## 4.2 Web Portal Roles

### GRA Officer
```json
{
  "role": "GRA_OFFICER",
  "platform": "WEB",
  "permissions": [
    "view_all_contracts",
    "view_all_payments",
    "view_tax_reports",
    "view_compliance_data",
    "export_reports",
    "search_landlords",
    "search_tenants"
  ]
}
```

### GRA Supervisor
```json
{
  "role": "GRA_SUPERVISOR",
  "platform": "WEB",
  "permissions": [
    "view_all_contracts",
    "view_all_payments",
    "view_tax_reports",
    "view_compliance_data",
    "issue_penalty",
    "manage_audits",
    "export_reports",
    "manage_officers"
  ]
}
```

### Inspector
```json
{
  "role": "INSPECTOR",
  "platform": "WEB",
  "permissions": [
    "view_assigned_cases",
    "update_case_status",
    "upload_evidence",
    "submit_inspection_report",
    "view_property_details",
    "view_contract_details"
  ]
}
```

### Admin / System Admin
```json
{
  "role": "ADMIN",
  "platform": "WEB",
  "permissions": ["*"]
}
```

---

# 5. Technology Stack

## 5.1 Backend

| Component | Technology | Version |
|-----------|------------|---------|
| Runtime | Node.js | 18+ |
| Framework | Express.js | 4.x |
| Database | PostgreSQL | 15+ |
| ORM | Sequelize | 6.x |
| Authentication | JWT + bcrypt | - |
| Validation | express-validator | 7.x |
| File Upload | Multer | 1.x |
| PDF Generation | PDFKit | 0.13.x |

## 5.2 Web Frontend

| Component | Technology | Version |
|-----------|------------|---------|
| Framework | React | 18.x |
| Build Tool | Vite | 5.x |
| Styling | TailwindCSS | 3.x |
| State Management | Zustand | 4.x |
| Routing | React Router | 6.x |
| HTTP Client | Axios | 1.x |
| Charts | Recharts | 2.x |

## 5.3 Mobile App

| Component | Technology | Version |
|-----------|------------|---------|
| Framework | React Native | 0.73.x |
| Platform | Expo | 50.x |
| Navigation | React Navigation | 6.x |
| State Management | Zustand | 4.x |
| HTTP Client | Axios | 1.x |
| Camera | expo-camera | 14.x |
| Secure Storage | expo-secure-store | 12.x |
| Signatures | react-native-signature-canvas | 4.x |
| Icons | @expo/vector-icons | 14.x |
| UI Components | react-native-paper | 5.x |

## 5.4 Deployment

| Component | Platform |
|-----------|----------|
| Backend API | Render (Web Service) |
| Database | Render (PostgreSQL) |
| Web Frontend | Render (Static Site) |
| Mobile App | Expo (EAS Build) |

---

# 6. Data Models

## 6.1 User Model

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, -- LANDLORD, TENANT, GRA_OFFICER, GRA_SUPERVISOR, INSPECTOR, ADMIN, SYSTEM_ADMIN

    -- Personal Info
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    other_names VARCHAR(100),
    date_of_birth DATE,
    gender VARCHAR(10),

    -- Identity
    ghana_card_number VARCHAR(20) UNIQUE,
    tin_number VARCHAR(20),

    -- Address
    digital_address VARCHAR(20),
    region VARCHAR(50),
    district VARCHAR(50),
    city VARCHAR(100),
    street_address TEXT,

    -- Status
    status VARCHAR(20) DEFAULT 'PENDING_VERIFICATION',
    verification_status VARCHAR(20) DEFAULT 'UNVERIFIED',

    -- Push Notifications
    push_token TEXT,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP
);
```

## 6.2 Property Model

```sql
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    landlord_id UUID NOT NULL REFERENCES users(id),
    property_code VARCHAR(30) UNIQUE NOT NULL,
    digital_address VARCHAR(20) NOT NULL,

    -- Location
    region VARCHAR(50) NOT NULL,
    district VARCHAR(50) NOT NULL,
    city VARCHAR(100),
    neighborhood VARCHAR(100),
    street_address TEXT,

    -- Property Details
    property_type VARCHAR(30) NOT NULL,
    property_category VARCHAR(20) NOT NULL, -- RESIDENTIAL, COMMERCIAL
    bedrooms INTEGER,
    bathrooms INTEGER,
    floor_area_sqm DECIMAL(10, 2),
    year_built INTEGER,

    -- Features
    is_furnished BOOLEAN DEFAULT FALSE,
    has_parking BOOLEAN DEFAULT FALSE,
    has_security BOOLEAN DEFAULT FALSE,
    has_generator BOOLEAN DEFAULT FALSE,
    amenities JSONB DEFAULT '[]',

    -- Ownership
    ownership_type VARCHAR(30) NOT NULL,
    ownership_verified BOOLEAN DEFAULT FALSE,

    -- Media
    photos JSONB DEFAULT '[]',

    -- Status
    status VARCHAR(20) DEFAULT 'PENDING_VERIFICATION',
    is_available BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 6.3 Contract Model

```sql
CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_number VARCHAR(30) UNIQUE NOT NULL,

    -- Parties
    property_id UUID NOT NULL REFERENCES properties(id),
    landlord_id UUID NOT NULL REFERENCES users(id),
    tenant_id UUID NOT NULL REFERENCES users(id),

    -- Contract Terms
    contract_type VARCHAR(30) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

    -- Financial Terms
    monthly_rent DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'GHS',
    security_deposit DECIMAL(12, 2) DEFAULT 0,
    service_charge DECIMAL(12, 2) DEFAULT 0,
    advance_months INTEGER NOT NULL,
    payment_frequency VARCHAR(20) DEFAULT 'MONTHLY',

    -- Tax
    tax_rate DECIMAL(5, 4) DEFAULT 0.08,
    total_tax_withheld DECIMAL(12, 2) DEFAULT 0,

    -- ID Scans and Signatures
    landlord_id_scan_url TEXT,
    tenant_id_scan_url TEXT,
    landlord_extracted_data JSONB,
    tenant_extracted_data JSONB,
    landlord_signature_url TEXT,
    tenant_signature_url TEXT,

    -- Status
    status VARCHAR(30) DEFAULT 'DRAFT',
    landlord_signed BOOLEAN DEFAULT FALSE,
    landlord_signed_at TIMESTAMP,
    tenant_confirmed BOOLEAN DEFAULT FALSE,
    tenant_confirmed_at TIMESTAMP,

    -- Confirmation
    confirmation_code VARCHAR(10),
    confirmation_expires_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Status: DRAFT, PENDING_TENANT_CONFIRMATION, ACTIVE, EXPIRED, TERMINATED, DISPUTED
```

## 6.4 Payment Model

```sql
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_reference VARCHAR(30) UNIQUE NOT NULL,

    -- Links
    contract_id UUID NOT NULL REFERENCES contracts(id),
    tenant_id UUID NOT NULL REFERENCES users(id),
    landlord_id UUID NOT NULL REFERENCES users(id),

    -- Amount Details
    gross_amount DECIMAL(12, 2) NOT NULL,
    tax_amount DECIMAL(12, 2) NOT NULL,  -- 8% withholding
    net_amount DECIMAL(12, 2) NOT NULL,  -- gross - tax
    platform_fee DECIMAL(12, 2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'GHS',

    -- Period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,

    -- Payment Method
    payment_method VARCHAR(30) NOT NULL, -- MOBILE_MONEY, BANK_TRANSFER, CARD
    payment_provider VARCHAR(30),        -- MTN, VODAFONE, AIRTELTIGO
    provider_reference VARCHAR(100),

    -- Status
    status VARCHAR(30) DEFAULT 'PENDING',

    -- Timestamps
    initiated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    failed_at TIMESTAMP,
    failure_reason TEXT
);

-- Status: PENDING, PROCESSING, COMPLETED, FAILED, REFUNDED
```

## 6.5 Scanned Document Model

```sql
CREATE TABLE scanned_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    document_type VARCHAR(30) NOT NULL, -- GHANA_CARD, PASSPORT, DRIVERS_LICENSE
    document_url TEXT NOT NULL,

    -- OCR Extracted Data
    extracted_data JSONB,
    extraction_confidence DECIMAL(5, 2),

    -- Status
    status VARCHAR(20) DEFAULT 'PENDING',
    verified BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

# 7. Mobile App

## 7.1 Project Structure

```
mobile/
├── App.tsx                    # Entry point
├── app.json                   # Expo configuration
├── package.json               # Dependencies
├── tsconfig.json              # TypeScript config
├── assets/                    # App icons and splash
└── src/
    ├── navigation/
    │   └── AppNavigator.tsx   # Navigation configuration
    ├── screens/
    │   ├── auth/
    │   │   ├── WelcomeScreen.tsx
    │   │   ├── LoginScreen.tsx
    │   │   ├── RegisterScreen.tsx
    │   │   └── VerifyOTPScreen.tsx
    │   ├── landlord/
    │   │   ├── DashboardScreen.tsx
    │   │   ├── PropertiesScreen.tsx
    │   │   ├── PropertyDetailsScreen.tsx
    │   │   ├── AddPropertyScreen.tsx
    │   │   └── CreateContractScreen.tsx
    │   ├── tenant/
    │   │   ├── DashboardScreen.tsx
    │   │   └── ConfirmContractScreen.tsx
    │   └── shared/
    │       ├── ContractsScreen.tsx
    │       ├── ContractDetailsScreen.tsx
    │       ├── PaymentsScreen.tsx
    │       ├── PaymentDetailsScreen.tsx
    │       ├── MakePaymentScreen.tsx
    │       ├── ScanDocumentScreen.tsx
    │       ├── SignContractScreen.tsx
    │       ├── ProfileScreen.tsx
    │       └── NotificationsScreen.tsx
    ├── services/
    │   ├── api.ts             # API client
    │   └── ocr.ts             # OCR extraction
    ├── store/
    │   └── authStore.ts       # Zustand auth state
    ├── types/
    │   └── index.ts           # TypeScript types
    └── utils/
        └── theme.ts           # Colors, spacing, typography
```

## 7.2 Key Features

### Document Scanning (ScanDocumentScreen)
- Camera-based document capture
- Gallery import option
- OCR text extraction
- Ghana Card data parsing
- Confidence scoring
- Manual correction support

### Digital Signatures (SignContractScreen)
- Full-screen signature pad
- Clear and redo options
- Base64 signature capture
- Server upload integration

### Mobile Money Payments (MakePaymentScreen)
- MTN Mobile Money
- Vodafone Cash
- AirtelTigo Money
- Phone number verification
- Payment status tracking
- Automatic tax calculation display

## 7.3 Running the Mobile App

```bash
# Navigate to mobile directory
cd mobile

# Install dependencies
npm install

# Start Expo development server
npx expo start

# Run on iOS simulator
npx expo start --ios

# Run on Android emulator
npx expo start --android
```

## 7.4 Building for Production

```bash
# Configure EAS Build
npx eas build:configure

# Build for iOS
npx eas build --platform ios

# Build for Android
npx eas build --platform android

# Submit to App Store
npx eas submit --platform ios

# Submit to Play Store
npx eas submit --platform android
```

---

# 8. Web Portal

## 8.1 Project Structure

```
frontend/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── index.css
    ├── components/
    │   ├── Layout.jsx
    │   ├── Sidebar.jsx
    │   ├── Header.jsx
    │   └── ...
    ├── pages/
    │   ├── Login.jsx
    │   ├── Dashboard.jsx
    │   ├── Properties.jsx
    │   ├── Contracts.jsx
    │   ├── Payments.jsx
    │   ├── Inspections.jsx
    │   └── ...
    └── store/
        └── authStore.js
```

## 8.2 Access Restrictions

The web portal enforces role-based access:
- **Allowed Roles:** GRA_OFFICER, GRA_SUPERVISOR, INSPECTOR, ADMIN, SYSTEM_ADMIN
- **Blocked Roles:** LANDLORD, TENANT

When landlords or tenants attempt to log in via the web portal, they receive a message directing them to download the mobile app.

## 8.3 Running the Web Portal

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

---

# 9. API Specifications

## 9.1 Base URL

- **Development:** `http://localhost:5000/api`
- **Production:** `https://ghana-rental-api.onrender.com/api`

## 9.2 Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login user |
| POST | `/auth/verify-otp` | Verify OTP code |
| POST | `/auth/resend-otp` | Resend OTP |
| POST | `/auth/logout` | Logout user |

## 9.3 Property Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/properties` | List properties |
| GET | `/properties/:id` | Get property details |
| POST | `/properties` | Create property |
| PUT | `/properties/:id` | Update property |
| POST | `/properties/:id/photos` | Upload photos |

## 9.4 Contract Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/contracts` | List contracts |
| GET | `/contracts/:id` | Get contract details |
| POST | `/contracts` | Create contract |
| POST | `/contracts/:id/confirm` | Tenant confirms contract |
| POST | `/contracts/:id/sign` | Sign contract |

## 9.5 Payment Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/payments` | List payments |
| GET | `/payments/:id` | Get payment details |
| POST | `/payments/:id/initiate` | Initiate payment |
| GET | `/payments/summary` | Payment summary |

## 9.6 Document Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/documents/scan` | Upload and scan document |
| GET | `/documents` | List scanned documents |

---

# 10. Deployment

## 10.1 Render Configuration

### render.yaml (Blueprint)

```yaml
databases:
  - name: ghana-rental-db
    plan: free
    databaseName: ghana_rental
    user: ghana_rental_user

services:
  - type: web
    name: ghana-rental-api
    runtime: node
    plan: free
    buildCommand: cd backend && npm install
    startCommand: cd backend && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: ghana-rental-db
          property: connectionString
      - key: JWT_SECRET
        generateValue: true

  - type: web
    name: ghana-rental-web
    runtime: static
    buildCommand: cd frontend && npm install && npm run build
    staticPublishPath: frontend/dist
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
```

### Deployment Steps

```bash
# Deploy to Render using Blueprint
render blueprint apply

# Or deploy manually:
# 1. Create PostgreSQL database on Render
# 2. Create Web Service for backend
# 3. Create Static Site for frontend
# 4. Configure environment variables
```

## 10.2 Environment Variables

### Backend (.env)

```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
```

---

# 11. Demo Accounts

## 11.1 Mobile App (Landlord/Tenant)

| Email | Password | Role | Name |
|-------|----------|------|------|
| landlord@demo.com | demo123 | LANDLORD | Kwame Asante |
| tenant@demo.com | demo123 | TENANT | Ama Mensah |

## 11.2 Web Portal (GRA/Inspector/Admin)

| Email | Password | Role | Name |
|-------|----------|------|------|
| gra@demo.com | demo123 | GRA_OFFICER | John Tetteh |
| inspector@demo.com | demo123 | INSPECTOR | Samuel Adjei |
| admin@demo.com | admin123 | ADMIN | System Admin |

## 11.3 OTP Verification

For demo purposes, use OTP code: **123456**

---

# Appendix A: Ghana Card OCR Extraction

The mobile app extracts the following data from Ghana Card scans:

```typescript
interface ExtractedIdData {
  ghanaCardNumber?: string;  // GHA-XXXXXXXXX-X format
  fullName?: string;
  firstName?: string;
  lastName?: string;
  otherNames?: string;
  dateOfBirth?: string;      // YYYY-MM-DD format
  gender?: string;           // M or F
  nationality?: string;
  placeOfIssuance?: string;
  dateOfIssuance?: string;
  expiryDate?: string;
  confidence: number;        // 0-100 score
  rawText?: string;
}
```

---

# Appendix B: Tax Calculation

All rent payments are subject to 8% withholding tax:

```
Gross Amount: GHS 1,000.00
Tax (8%):     GHS    80.00
Net to Landlord: GHS  920.00
```

The tax is automatically calculated and displayed during payment. Tax certificates can be downloaded by landlords for their records.

---

# Appendix C: Mobile App Color Theme

Based on Ghana flag colors:

```typescript
const colors = {
  primary: '#006B3F',      // Ghana Green
  secondary: '#FCD116',    // Ghana Yellow/Gold
  accent: '#CE1126',       // Ghana Red
  background: '#F5F5F5',
  surface: '#FFFFFF',
  text: '#1A1A1A',
  textLight: '#999999',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
};
```
