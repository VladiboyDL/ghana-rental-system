# Ghana Rental Market Taxation System - Technical Specification for Demo

## Document Information
- **Version:** 1.0
- **Date:** January 2025
- **Purpose:** Technical specification for coding AI to build a functional demo
- **Scope:** Self-contained demo with simulated external integrations

---

# Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Overview](#2-system-overview)
3. [User Roles & Permissions](#3-user-roles--permissions)
4. [Data Models](#4-data-models)
5. [Core Modules](#5-core-modules)
6. [User Interfaces](#6-user-interfaces)
7. [Business Rules](#7-business-rules)
8. [Simulated Integrations](#8-simulated-integrations)
9. [Demo Data](#9-demo-data)
10. [API Specifications](#10-api-specifications)
11. [Workflows](#11-workflows)
12. [Reports & Analytics](#12-reports--analytics)
13. [Technical Requirements](#13-technical-requirements)

---

# 1. Executive Summary

## 1.1 Problem Statement
In Ghana, 90% of the population lives in rental premises. Landlords commonly require tenants to prepay rent for up to two years in advance, creating financial stress. The rental market remains largely unregulated, leading to tax evasion and unfair practices.

## 1.2 Solution
A centralized digital system for registering all rental contracts with:
- Mandatory digital contract registration (unregistered contracts are invalid)
- Automatic tax withholding on rent payments
- Real-time monitoring and enforcement
- Market transparency through rent data

## 1.3 Demo Objectives
Build a functional demonstration that showcases:
- Complete user registration and property management workflows
- Contract creation with tenant confirmation
- Payment processing with tax withholding simulation
- Compliance monitoring dashboards
- Inspector case management
- USSD simulation interface

---

# 2. System Overview

## 2.1 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND LAYER                           │
├─────────────────┬─────────────────┬─────────────────────────────┤
│   Web Portal    │   Mobile App    │   USSD Simulator            │
│   (React)       │   (React Native │   (Web-based)               │
│                 │    or React)    │                             │
└────────┬────────┴────────┬────────┴──────────────┬──────────────┘
         │                 │                       │
         └─────────────────┼───────────────────────┘
                           │
┌──────────────────────────┴──────────────────────────────────────┐
│                        API LAYER (REST)                         │
│                        Node.js / Express                        │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────┴──────────────────────────────────────┐
│                      BUSINESS LOGIC LAYER                       │
├─────────────┬─────────────┬─────────────┬─────────────┬─────────┤
│ User Mgmt   │ Property    │ Contract    │ Payment     │ Enforce │
│ Module      │ Module      │ Module      │ Module      │ Module  │
└─────────────┴─────────────┴─────────────┴─────────────┴─────────┘
                           │
┌──────────────────────────┴──────────────────────────────────────┐
│                       DATA LAYER                                │
│                    PostgreSQL / SQLite                          │
└─────────────────────────────────────────────────────────────────┘
                           │
┌──────────────────────────┴──────────────────────────────────────┐
│                 SIMULATED EXTERNAL SERVICES                     │
├─────────────┬─────────────┬─────────────┬─────────────┬─────────┤
│ NIA (Ghana  │ GRA (Tax)   │ Lands       │ Mobile      │ SMS     │
│ Card)       │             │ Commission  │ Money       │ Gateway │
└─────────────┴─────────────┴─────────────┴─────────────┴─────────┘
```

## 2.2 Technology Stack (Recommended for Demo)

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Frontend | React + TailwindCSS | Rapid development, modern UI |
| Backend | Node.js + Express | JavaScript full-stack, quick prototyping |
| Database | SQLite (demo) / PostgreSQL (prod) | Simple setup, easy migration |
| Authentication | JWT + bcrypt | Standard, secure |
| File Storage | Local filesystem | Simple for demo |
| PDF Generation | PDFKit or Puppeteer | Tax certificates, reports |

---

# 3. User Roles & Permissions

## 3.1 Role Definitions

### 3.1.1 Landlord (Individual)
```json
{
  "role": "LANDLORD_INDIVIDUAL",
  "permissions": [
    "register_property",
    "create_contract",
    "view_own_contracts",
    "view_own_payments",
    "download_tax_certificate",
    "message_tenants",
    "update_profile"
  ]
}
```

### 3.1.2 Landlord (Corporate)
```json
{
  "role": "LANDLORD_CORPORATE",
  "permissions": [
    "register_property",
    "create_contract",
    "view_own_contracts",
    "view_own_payments",
    "download_tax_certificate",
    "message_tenants",
    "update_profile",
    "manage_sub_users",
    "bulk_operations",
    "api_access"
  ]
}
```

### 3.1.3 Tenant (Individual)
```json
{
  "role": "TENANT_INDIVIDUAL",
  "permissions": [
    "confirm_contract",
    "make_payment",
    "view_own_contracts",
    "view_own_payments",
    "report_issue",
    "file_dispute",
    "view_market_data",
    "message_landlord",
    "update_profile"
  ]
}
```

### 3.1.4 Tenant (Corporate)
```json
{
  "role": "TENANT_CORPORATE",
  "permissions": [
    "confirm_contract",
    "make_payment",
    "view_own_contracts",
    "view_own_payments",
    "report_issue",
    "file_dispute",
    "view_market_data",
    "message_landlord",
    "update_profile",
    "manage_sub_users"
  ]
}
```

### 3.1.5 GRA Officer
```json
{
  "role": "GRA_OFFICER",
  "permissions": [
    "view_all_contracts",
    "view_all_payments",
    "view_tax_reports",
    "view_compliance_data",
    "issue_penalty",
    "manage_audits",
    "export_reports",
    "search_landlords",
    "search_tenants"
  ]
}
```

### 3.1.6 District Officer
```json
{
  "role": "DISTRICT_OFFICER",
  "permissions": [
    "view_district_contracts",
    "view_district_properties",
    "view_district_compliance",
    "assign_inspectors",
    "review_inspections",
    "issue_local_penalty"
  ]
}
```

### 3.1.7 Inspector
```json
{
  "role": "INSPECTOR",
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

### 3.1.8 System Admin
```json
{
  "role": "SYSTEM_ADMIN",
  "permissions": ["*"]
}
```

## 3.2 Demo User Accounts

| Username | Password | Role | Name |
|----------|----------|------|------|
| landlord1 | demo123 | LANDLORD_INDIVIDUAL | Kwame Asante |
| landlord2 | demo123 | LANDLORD_CORPORATE | GoldKey Properties |
| tenant1 | demo123 | TENANT_INDIVIDUAL | Ama Mensah |
| tenant2 | demo123 | TENANT_CORPORATE | QuickMart Ltd |
| gra1 | demo123 | GRA_OFFICER | John Tetteh |
| district1 | demo123 | DISTRICT_OFFICER | Mary Owusu |
| inspector1 | demo123 | INSPECTOR | Samuel Adjei |
| admin | admin123 | SYSTEM_ADMIN | System Admin |

---

# 4. Data Models

## 4.1 User Model

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    
    -- Personal Info
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    other_names VARCHAR(100),
    date_of_birth DATE,
    gender VARCHAR(10),
    
    -- Identity
    ghana_card_number VARCHAR(20) UNIQUE,
    tin_number VARCHAR(20),
    passport_number VARCHAR(20),
    
    -- Address
    digital_address VARCHAR(20),
    region VARCHAR(50),
    district VARCHAR(50),
    city VARCHAR(100),
    street_address TEXT,
    
    -- Corporate (if applicable)
    is_corporate BOOLEAN DEFAULT FALSE,
    company_name VARCHAR(255),
    company_registration_number VARCHAR(50),
    
    -- Status
    status VARCHAR(20) DEFAULT 'PENDING_VERIFICATION',
    verification_status VARCHAR(20) DEFAULT 'UNVERIFIED',
    compliance_score INTEGER DEFAULT 100,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    
    -- Preferences
    preferred_language VARCHAR(10) DEFAULT 'en',
    notification_preferences JSONB DEFAULT '{"sms": true, "email": true, "push": true}'
);

-- Status: PENDING_VERIFICATION, ACTIVE, SUSPENDED, BLACKLISTED
-- Verification Status: UNVERIFIED, PENDING, VERIFIED, REJECTED
```

## 4.2 Property Model

```sql
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    landlord_id UUID NOT NULL REFERENCES users(id),
    
    -- Identification
    property_code VARCHAR(30) UNIQUE NOT NULL,
    digital_address VARCHAR(20) NOT NULL,
    
    -- Location
    region VARCHAR(50) NOT NULL,
    district VARCHAR(50) NOT NULL,
    city VARCHAR(100),
    neighborhood VARCHAR(100),
    street_address TEXT,
    gps_latitude DECIMAL(10, 8),
    gps_longitude DECIMAL(11, 8),
    
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
    ownership_document_url TEXT,
    ownership_verified BOOLEAN DEFAULT FALSE,
    
    -- Media
    photos JSONB DEFAULT '[]',
    
    -- Status
    status VARCHAR(20) DEFAULT 'PENDING_VERIFICATION',
    is_available BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Property Types: R-SR (Single Room), R-SC (Self-Contained), R-1B, R-2B, R-3B, R-4B+, R-HS (House), R-VL (Villa), R-CMP (Compound), C-SHP (Shop), C-OFF (Office), C-WHS (Warehouse), C-IND (Industrial), C-MXD (Mixed)
-- Ownership Types: FREEHOLD, LEASEHOLD, FAMILY, ESTATE, CORPORATE
```

## 4.3 Contract Model

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
    
    -- Document
    contract_document_url TEXT,
    template_used VARCHAR(30),
    custom_clauses JSONB DEFAULT '[]',
    
    -- Status
    status VARCHAR(30) DEFAULT 'DRAFT',
    landlord_signed BOOLEAN DEFAULT FALSE,
    landlord_signed_at TIMESTAMP,
    tenant_confirmed BOOLEAN DEFAULT FALSE,
    tenant_confirmed_at TIMESTAMP,
    
    -- Confirmation
    confirmation_code VARCHAR(10),
    confirmation_expires_at TIMESTAMP,
    
    -- Termination
    terminated_at TIMESTAMP,
    termination_reason TEXT,
    termination_initiated_by UUID REFERENCES users(id),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contract Types: STANDARD, SHORT_TERM, COMMERCIAL, RENT_TO_OWN
-- Status: DRAFT, PENDING_TENANT_CONFIRMATION, ACTIVE, EXPIRED, TERMINATED, DISPUTED
```

## 4.4 Payment Model

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
    tax_amount DECIMAL(12, 2) NOT NULL,
    net_amount DECIMAL(12, 2) NOT NULL,
    platform_fee DECIMAL(12, 2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'GHS',
    
    -- Period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Payment Method
    payment_method VARCHAR(30) NOT NULL,
    payment_provider VARCHAR(30),
    provider_reference VARCHAR(100),
    
    -- Status
    status VARCHAR(30) DEFAULT 'PENDING',
    
    -- Settlement
    settled_at TIMESTAMP,
    settlement_reference VARCHAR(100),
    
    -- Timestamps
    initiated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    failed_at TIMESTAMP,
    failure_reason TEXT
);

-- Payment Methods: MOBILE_MONEY_MTN, MOBILE_MONEY_VODAFONE, MOBILE_MONEY_AIRTELTIGO, BANK_TRANSFER, CARD
-- Status: PENDING, PROCESSING, COMPLETED, FAILED, REFUNDED
```

## 4.5 Tax Certificate Model

```sql
CREATE TABLE tax_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    certificate_number VARCHAR(30) UNIQUE NOT NULL,
    
    -- Links
    landlord_id UUID NOT NULL REFERENCES users(id),
    
    -- Period
    period_type VARCHAR(20) NOT NULL, -- MONTHLY, ANNUAL
    period_year INTEGER NOT NULL,
    period_month INTEGER, -- NULL for annual
    
    -- Amounts
    total_rent_received DECIMAL(12, 2) NOT NULL,
    total_tax_withheld DECIMAL(12, 2) NOT NULL,
    
    -- Verification
    verification_code VARCHAR(20) UNIQUE NOT NULL,
    qr_code_data TEXT,
    
    -- Document
    document_url TEXT,
    
    -- Timestamps
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    downloaded_at TIMESTAMP
);
```

## 4.6 Inspection Case Model

```sql
CREATE TABLE inspection_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_number VARCHAR(30) UNIQUE NOT NULL,
    
    -- Links
    property_id UUID NOT NULL REFERENCES properties(id),
    assigned_inspector_id UUID REFERENCES users(id),
    
    -- Case Details
    case_type VARCHAR(30) NOT NULL,
    priority VARCHAR(20) DEFAULT 'MEDIUM',
    risk_score INTEGER DEFAULT 0,
    
    -- Source
    source VARCHAR(30) NOT NULL,
    source_reference VARCHAR(100),
    reported_by UUID REFERENCES users(id),
    
    -- Description
    description TEXT,
    allegations JSONB DEFAULT '[]',
    
    -- Status
    status VARCHAR(30) DEFAULT 'OPEN',
    
    -- Inspection
    scheduled_date DATE,
    inspection_date DATE,
    inspection_notes TEXT,
    
    -- Evidence
    evidence JSONB DEFAULT '[]',
    
    -- Outcome
    outcome VARCHAR(30),
    outcome_notes TEXT,
    penalty_amount DECIMAL(12, 2),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_at TIMESTAMP,
    completed_at TIMESTAMP,
    closed_at TIMESTAMP
);

-- Case Types: UNREGISTERED_RENTAL, CASH_PAYMENT, TAX_EVASION, HABITABILITY, ILLEGAL_EVICTION, ANONYMOUS_TIP
-- Priority: LOW, MEDIUM, HIGH, CRITICAL
-- Status: OPEN, ASSIGNED, IN_PROGRESS, PENDING_REVIEW, CLOSED
-- Source: SYSTEM_DETECTION, ANONYMOUS_REPORT, TENANT_COMPLAINT, CROSS_REFERENCE, ROUTINE_AUDIT
-- Outcome: VIOLATION_CONFIRMED, NO_VIOLATION, INCONCLUSIVE, UNDER_APPEAL
```

## 4.7 Dispute Model

```sql
CREATE TABLE disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispute_number VARCHAR(30) UNIQUE NOT NULL,
    
    -- Links
    contract_id UUID NOT NULL REFERENCES contracts(id),
    filed_by UUID NOT NULL REFERENCES users(id),
    filed_against UUID NOT NULL REFERENCES users(id),
    
    -- Dispute Details
    dispute_type VARCHAR(30) NOT NULL,
    description TEXT NOT NULL,
    requested_resolution TEXT,
    
    -- Evidence
    evidence JSONB DEFAULT '[]',
    
    -- Status
    status VARCHAR(30) DEFAULT 'FILED',
    
    -- Resolution
    assigned_officer_id UUID REFERENCES users(id),
    resolution TEXT,
    resolution_date TIMESTAMP,
    
    -- Timestamps
    filed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dispute Types: CONTRACT_TERMS, PAYMENT, HABITABILITY, EVICTION, DEPOSIT_RETURN, RENT_INCREASE, OTHER
-- Status: FILED, UNDER_REVIEW, MEDIATION, RESOLVED, APPEALED, CLOSED
```

## 4.8 Notification Model

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Recipient
    user_id UUID NOT NULL REFERENCES users(id),
    
    -- Content
    notification_type VARCHAR(30) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    
    -- Delivery
    channels JSONB DEFAULT '["in_app"]',
    sms_sent BOOLEAN DEFAULT FALSE,
    email_sent BOOLEAN DEFAULT FALSE,
    push_sent BOOLEAN DEFAULT FALSE,
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Types: CONTRACT_CREATED, CONTRACT_CONFIRMATION_REQUIRED, PAYMENT_RECEIVED, PAYMENT_DUE, TAX_CERTIFICATE_READY, INSPECTION_SCHEDULED, DISPUTE_UPDATE, SYSTEM_ALERT
```

## 4.9 Audit Log Model

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Actor
    user_id UUID REFERENCES users(id),
    user_role VARCHAR(50),
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    -- Action
    action VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    
    -- Changes
    old_values JSONB,
    new_values JSONB,
    
    -- Result
    status VARCHAR(20) DEFAULT 'SUCCESS',
    error_message TEXT,
    
    -- Timestamp
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 4.10 Market Data Model (for Market Rent Checker)

```sql
CREATE TABLE market_rent_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Location
    region VARCHAR(50) NOT NULL,
    district VARCHAR(50) NOT NULL,
    neighborhood VARCHAR(100),
    
    -- Property Type
    property_type VARCHAR(30) NOT NULL,
    bedrooms INTEGER,
    
    -- Statistics (monthly aggregation)
    period_year INTEGER NOT NULL,
    period_month INTEGER NOT NULL,
    
    sample_size INTEGER NOT NULL,
    average_rent DECIMAL(12, 2) NOT NULL,
    median_rent DECIMAL(12, 2) NOT NULL,
    min_rent DECIMAL(12, 2) NOT NULL,
    max_rent DECIMAL(12, 2) NOT NULL,
    percentile_10 DECIMAL(12, 2),
    percentile_90 DECIMAL(12, 2),
    
    -- Timestamps
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_market_rent_location ON market_rent_data(region, district, neighborhood, property_type);
```

---

# 5. Core Modules

## 5.1 User Management Module

### 5.1.1 Registration Flow

```
START
  │
  ├─→ User enters basic info (name, email, phone, password)
  │
  ├─→ System sends OTP to phone
  │
  ├─→ User verifies OTP
  │
  ├─→ User selects role (Landlord/Tenant)
  │
  ├─→ User enters identity info (Ghana Card)
  │
  ├─→ [SIMULATED] System verifies Ghana Card with NIA
  │     └─→ Returns: name, photo, date of birth, address
  │
  ├─→ User completes profile
  │
  └─→ Account created with status PENDING_VERIFICATION
       │
       └─→ [For Landlord] Prompted to register property
           [For Tenant] Can browse/search properties
```

### 5.1.2 Authentication Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Register new user |
| `/api/auth/verify-otp` | POST | Verify phone OTP |
| `/api/auth/login` | POST | Login with email/phone + password |
| `/api/auth/logout` | POST | Logout (invalidate token) |
| `/api/auth/refresh` | POST | Refresh JWT token |
| `/api/auth/forgot-password` | POST | Request password reset |
| `/api/auth/reset-password` | POST | Reset password with token |

### 5.1.3 User Management Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/users/me` | GET | Get current user profile |
| `/api/users/me` | PUT | Update current user profile |
| `/api/users/:id` | GET | Get user by ID (admin) |
| `/api/users` | GET | List users with filters (admin) |
| `/api/users/:id/status` | PUT | Update user status (admin) |

## 5.2 Property Management Module

### 5.2.1 Property Registration Flow

```
START
  │
  ├─→ Landlord clicks "Register Property"
  │
  ├─→ Step 1: Enter Digital Address
  │     └─→ [SIMULATED] Validate with Ghana Post
  │
  ├─→ Step 2: Property Details
  │     ├─→ Property type (residential/commercial)
  │     ├─→ Category (1-bed, 2-bed, shop, etc.)
  │     ├─→ Features (furnished, parking, etc.)
  │     └─→ Size and amenities
  │
  ├─→ Step 3: Ownership Verification
  │     ├─→ Upload ownership document
  │     └─→ [SIMULATED] Cross-check with Lands Commission
  │
  ├─→ Step 4: Upload Photos
  │     ├─→ Minimum: 1 exterior, 1 per room
  │     └─→ GPS location captured
  │
  ├─→ Step 5: Review and Submit
  │
  └─→ Property registered with status PENDING_VERIFICATION
       │
       └─→ [SIMULATED] Auto-verify after 5 seconds
```

### 5.2.2 Property Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/properties` | POST | Register new property |
| `/api/properties` | GET | List properties (filtered) |
| `/api/properties/:id` | GET | Get property details |
| `/api/properties/:id` | PUT | Update property |
| `/api/properties/:id/photos` | POST | Upload photos |
| `/api/properties/:id/verify` | POST | Request verification |
| `/api/properties/search` | GET | Search available properties |

## 5.3 Contract Management Module

### 5.3.1 Contract Creation Flow

```
START
  │
  ├─→ Landlord selects property
  │
  ├─→ Step 1: Tenant Information
  │     ├─→ Enter tenant phone/email OR
  │     └─→ Select existing tenant from system
  │
  ├─→ Step 2: Contract Terms
  │     ├─→ Start date and duration
  │     ├─→ Monthly rent amount
  │     ├─→ Advance payment months (max 6 residential, 12 commercial)
  │     ├─→ Security deposit (max 3 months)
  │     └─→ Service charges (optional)
  │
  ├─→ Step 3: Document Upload
  │     └─→ Upload signed contract (PDF/image)
  │
  ├─→ Step 4: Review
  │     └─→ System validates compliance
  │
  ├─→ Contract created with status PENDING_TENANT_CONFIRMATION
  │
  ├─→ System generates confirmation code
  │
  ├─→ [SIMULATED SMS] Tenant receives notification
  │
  └─→ Tenant confirms (see 5.3.2)
```

### 5.3.2 Tenant Confirmation Flow

```
Tenant receives SMS/notification
  │
  ├─→ Tenant logs in (or creates account)
  │
  ├─→ Views contract details:
  │     ├─→ Property information
  │     ├─→ Rent amount and terms
  │     ├─→ Contract document
  │     └─→ Market rent comparison
  │
  ├─→ Tenant enters confirmation code (OTP)
  │
  ├─→ Decision:
  │     ├─→ CONFIRM: Contract becomes ACTIVE
  │     │     └─→ Tax certificate generated
  │     │
  │     └─→ OBJECT: Contract becomes DISPUTED
  │           └─→ Select reason, provide details
  │           └─→ Dispute case created
  │
  └─→ Both parties notified
```

### 5.3.3 Contract Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/contracts` | POST | Create new contract |
| `/api/contracts` | GET | List contracts (filtered by role) |
| `/api/contracts/:id` | GET | Get contract details |
| `/api/contracts/:id` | PUT | Update contract (draft only) |
| `/api/contracts/:id/confirm` | POST | Tenant confirms contract |
| `/api/contracts/:id/object` | POST | Tenant objects to contract |
| `/api/contracts/:id/terminate` | POST | Terminate contract |
| `/api/contracts/:id/renew` | POST | Renew contract |

## 5.4 Payment Processing Module

### 5.4.1 Payment Flow

```
START
  │
  ├─→ Tenant initiates payment
  │     ├─→ Select contract
  │     └─→ Enter amount (or select period)
  │
  ├─→ System calculates:
  │     ├─→ Gross amount: GHS X
  │     ├─→ Tax (8%): GHS Y
  │     ├─→ Platform fee (1%): GHS Z
  │     └─→ Net to landlord: GHS (X - Y - Z)
  │
  ├─→ Select payment method:
  │     ├─→ MTN Mobile Money
  │     ├─→ Vodafone Cash
  │     ├─→ AirtelTigo Money
  │     └─→ Bank Transfer
  │
  ├─→ [SIMULATED] Payment processing
  │     ├─→ Show "Processing..." (2-second delay)
  │     └─→ Return success (unless amount > 10,000 for demo failure)
  │
  ├─→ Payment recorded with status COMPLETED
  │
  ├─→ Tax amount recorded
  │
  ├─→ [SIMULATED] Landlord receives settlement
  │
  ├─→ Receipt generated
  │
  └─→ Both parties notified
```

### 5.4.2 Payment Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/payments` | POST | Initiate payment |
| `/api/payments` | GET | List payments (filtered) |
| `/api/payments/:id` | GET | Get payment details |
| `/api/payments/:id/receipt` | GET | Download receipt PDF |
| `/api/payments/calculate` | POST | Calculate payment breakdown |

## 5.5 Tax & Certificates Module

### 5.5.1 Tax Certificate Generation

```
Monthly process (or on-demand):
  │
  ├─→ Aggregate payments for period
  │
  ├─→ Calculate totals:
  │     ├─→ Total rent received
  │     └─→ Total tax withheld
  │
  ├─→ Generate certificate:
  │     ├─→ Unique certificate number
  │     ├─→ QR code for verification
  │     └─→ Digital signature
  │
  ├─→ Store PDF
  │
  └─→ Notify landlord
```

### 5.5.2 Tax Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/tax/certificates` | GET | List tax certificates |
| `/api/tax/certificates/:id` | GET | Get certificate details |
| `/api/tax/certificates/:id/download` | GET | Download certificate PDF |
| `/api/tax/certificates/generate` | POST | Generate certificate (admin) |
| `/api/tax/verify/:code` | GET | Verify certificate by code |
| `/api/tax/summary` | GET | Get tax summary for period |

## 5.6 Market Rent Checker Module

### 5.6.1 Market Data Query

```
User inputs:
  ├─→ Region (required)
  ├─→ District (required)
  ├─→ Neighborhood (optional)
  ├─→ Property type (required)
  └─→ Bedrooms (if residential)

System returns:
  ├─→ Average rent
  ├─→ Median rent
  ├─→ Range (10th - 90th percentile)
  ├─→ Sample size
  ├─→ Trend (last 12 months)
  └─→ "Fair price" indicator
```

### 5.6.2 Market Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/market/rent-check` | GET | Get market rent data |
| `/api/market/trends` | GET | Get rent trends |
| `/api/market/compare` | POST | Compare specific rent to market |

## 5.7 Enforcement Module

### 5.7.1 Case Creation (Automated)

```
Risk scoring triggers:
  │
  ├─→ Property registered, no contracts > 6 months
  │     └─→ Score: +25
  │
  ├─→ GSM data shows residence, no contract
  │     └─→ Score: +20
  │
  ├─→ Utility usage anomaly
  │     └─→ Score: +15
  │
  ├─→ Anonymous tip received
  │     └─→ Score: +15
  │
  └─→ If score > 60: Create inspection case
```

### 5.7.2 Inspector Workflow

```
Case assigned to inspector:
  │
  ├─→ Inspector receives notification
  │
  ├─→ Reviews case details:
  │     ├─→ Property information
  │     ├─→ Risk factors
  │     ├─→ Historical data
  │     └─→ Evidence (if any)
  │
  ├─→ Schedules inspection
  │
  ├─→ Conducts on-site inspection:
  │     ├─→ GPS check-in
  │     ├─→ Photos/video capture
  │     ├─→ Interview notes
  │     └─→ Evidence collection
  │
  ├─→ Submits inspection report:
  │     ├─→ Findings
  │     ├─→ Evidence
  │     └─→ Recommendation
  │
  └─→ Supervisor reviews and closes case
```

### 5.7.3 Enforcement Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/cases` | GET | List cases (filtered by role) |
| `/api/cases/:id` | GET | Get case details |
| `/api/cases` | POST | Create case (admin/system) |
| `/api/cases/:id/assign` | POST | Assign to inspector |
| `/api/cases/:id/schedule` | POST | Schedule inspection |
| `/api/cases/:id/evidence` | POST | Upload evidence |
| `/api/cases/:id/report` | POST | Submit inspection report |
| `/api/cases/:id/close` | POST | Close case with outcome |
| `/api/reports/anonymous` | POST | Submit anonymous tip |

## 5.8 Dispute Resolution Module

### 5.8.1 Dispute Flow

```
Dispute filed:
  │
  ├─→ User selects dispute type
  │
  ├─→ Provides description and evidence
  │
  ├─→ Dispute created with status FILED
  │
  ├─→ Other party notified
  │
  ├─→ 7 days for response
  │
  ├─→ If not resolved:
  │     └─→ Assigned to Rent Officer
  │
  ├─→ Mediation/Review
  │
  └─→ Resolution issued
```

### 5.8.2 Dispute Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/disputes` | POST | File dispute |
| `/api/disputes` | GET | List disputes |
| `/api/disputes/:id` | GET | Get dispute details |
| `/api/disputes/:id/respond` | POST | Respond to dispute |
| `/api/disputes/:id/evidence` | POST | Add evidence |
| `/api/disputes/:id/resolve` | POST | Resolve dispute (officer) |

---

# 6. User Interfaces

## 6.1 Web Portal Pages

### 6.1.1 Public Pages
- Landing page
- Login / Register
- Market Rent Checker (public access)
- Certificate Verification
- About / FAQ / Contact

### 6.1.2 Landlord Dashboard
- Overview (properties, contracts, income, compliance)
- My Properties (list, register, edit)
- My Contracts (list, create, manage)
- Payments (received, pending)
- Tax Certificates (list, download)
- Messages
- Profile / Settings

### 6.1.3 Tenant Dashboard
- Overview (current rental, payments due, history)
- My Contracts (active, pending confirmation, history)
- Make Payment
- Report Issue
- File Dispute
- Market Rent Checker
- Messages
- Profile / Settings

### 6.1.4 GRA Officer Dashboard
- Overview (collections, compliance rates, alerts)
- Contracts (search, view all)
- Landlords (search, view, compliance)
- Tax Reports (generate, export)
- Cases (pending, assigned)
- Analytics
- Settings

### 6.1.5 Inspector Dashboard
- My Cases (assigned, in progress, completed)
- Today's Schedule
- Case Details (with map, evidence upload)
- Submit Report
- My Performance
- Settings

### 6.1.6 Admin Dashboard
- System Overview
- User Management
- Property Management
- Contract Management
- Payment Reconciliation
- System Configuration
- Audit Logs
- Reports

## 6.2 USSD Simulator

### 6.2.1 Main Menu (*714#)
```
Welcome to Ghana Rental System

1. Make Payment
2. Check Balance
3. Register Contract
4. Report Issue
5. Market Rent
6. My Account
0. Help
```

### 6.2.2 Payment Flow (*714*1#)
```
Screen 1:
Select Contract:
1. Apt 201, Osu (GHS 1,500/mo)
2. Shop 5, Tema (GHS 2,000/mo)
0. Back

Screen 2:
Pay for: Apt 201, Osu
Amount Due: GHS 1,500
Pay with:
1. MTN MoMo
2. Vodafone Cash
3. AirtelTigo
0. Back

Screen 3:
Confirm Payment:
To: Kwame Asante
Amount: GHS 1,500
Tax: GHS 120
Total: GHS 1,620
1. Confirm
2. Cancel

Screen 4:
Processing...

Screen 5:
Payment Successful!
Ref: PAY-2025-00001
Receipt sent via SMS
0. Main Menu
```

## 6.3 UI Components

### 6.3.1 Common Components
- Header with navigation
- Sidebar menu
- Data tables with sorting, filtering, pagination
- Form inputs with validation
- File upload with preview
- Date pickers
- Currency input
- Phone input (Ghana format)
- Map component (for property location)
- Chart components (for analytics)
- Notification bell
- User avatar dropdown

### 6.3.2 Specific Components
- Property card (photo, details, status)
- Contract card (parties, terms, status)
- Payment card (amount, method, receipt)
- Case card (priority, status, actions)
- Compliance score badge
- QR code generator/scanner
- OTP input
- Timeline/activity log
- Market rent comparison chart

---

# 7. Business Rules

## 7.1 Contract Rules

### 7.1.1 Advance Payment Limits
```javascript
const ADVANCE_LIMITS = {
  'RESIDENTIAL': {
    'R-SR': 6,   // Single room: max 6 months
    'R-SC': 6,   // Self-contained: max 6 months
    'R-1B': 6,   // 1-bedroom: max 6 months
    'R-2B': 6,   // 2-bedroom: max 6 months
    'R-3B': 6,   // 3-bedroom: max 6 months
    'R-4B+': 6,  // 4+ bedroom: max 6 months
    'R-HS': 6,   // House: max 6 months
    'R-VL': 6,   // Villa: max 6 months
    'R-CMP': 6   // Compound: max 6 months
  },
  'COMMERCIAL': {
    'C-SHP': 12,  // Shop: max 12 months
    'C-OFF': 12,  // Office: max 12 months
    'C-WHS': 24,  // Warehouse: max 24 months
    'C-IND': 24,  // Industrial: max 24 months
    'C-MXD': 12   // Mixed use: max 12 months
  }
};
```

### 7.1.2 Security Deposit Limits
```javascript
const MAX_SECURITY_DEPOSIT_MONTHS = 3; // Max 3 months rent
```

### 7.1.3 Contract Validity
```javascript
function validateContract(contract) {
  const errors = [];
  
  // Check advance payment limit
  const limit = ADVANCE_LIMITS[contract.property.category][contract.property.type];
  if (contract.advanceMonths > limit) {
    errors.push(`Advance payment exceeds limit of ${limit} months`);
  }
  
  // Check security deposit
  if (contract.securityDeposit > contract.monthlyRent * MAX_SECURITY_DEPOSIT_MONTHS) {
    errors.push(`Security deposit exceeds ${MAX_SECURITY_DEPOSIT_MONTHS} months rent`);
  }
  
  // Check tenant confirmation expiry
  const CONFIRMATION_EXPIRY_DAYS = 7;
  
  // Check minimum contract duration
  const MIN_DURATION_MONTHS = 1;
  const MAX_DURATION_MONTHS = 60;
  
  return { valid: errors.length === 0, errors };
}
```

## 7.2 Tax Rules

### 7.2.1 Tax Rates
```javascript
const TAX_RATES = {
  'INDIVIDUAL_REGISTERED': 0.08,    // 8%
  'INDIVIDUAL_UNREGISTERED': 0.15,  // 15%
  'CORPORATE': 0.08,                 // 8%
  'RESIDENT_LANDLORD': 0.00,        // 0% (lives in same property)
  'SOCIAL_HOUSING': 0.02            // 2%
};

const TAX_EXEMPTION_THRESHOLD = 500; // GHS 500/month
```

### 7.2.2 Tax Calculation
```javascript
function calculateTax(payment) {
  const landlord = getLandlord(payment.landlordId);
  const contract = getContract(payment.contractId);
  
  // Check exemptions
  if (contract.monthlyRent < TAX_EXEMPTION_THRESHOLD) {
    return 0;
  }
  
  // Determine rate
  let rate = TAX_RATES['INDIVIDUAL_REGISTERED'];
  if (landlord.isCorporate) {
    rate = TAX_RATES['CORPORATE'];
  } else if (!landlord.tinNumber) {
    rate = TAX_RATES['INDIVIDUAL_UNREGISTERED'];
  }
  
  return payment.grossAmount * rate;
}
```

## 7.3 Payment Rules

### 7.3.1 Platform Fees
```javascript
const PLATFORM_FEE_RATE = 0.01;  // 1%
const PLATFORM_FEE_CAP = 50;     // Max GHS 50

function calculatePlatformFee(amount) {
  const fee = amount * PLATFORM_FEE_RATE;
  return Math.min(fee, PLATFORM_FEE_CAP);
}
```

### 7.3.2 Payment Breakdown
```javascript
function calculatePaymentBreakdown(grossAmount, contract) {
  const taxAmount = calculateTax({ grossAmount, contractId: contract.id });
  const platformFee = calculatePlatformFee(grossAmount);
  const netAmount = grossAmount - taxAmount - platformFee;
  
  return {
    grossAmount,
    taxAmount,
    platformFee,
    netAmount,
    taxRate: taxAmount / grossAmount
  };
}
```

## 7.4 Compliance Rules

### 7.4.1 Compliance Score Calculation
```javascript
function calculateComplianceScore(landlord) {
  let score = 100;
  
  // Contract registration (30%)
  const contracts = getContracts(landlord.id);
  const registeredRatio = contracts.registered / contracts.total;
  score -= (1 - registeredRatio) * 30;
  
  // Tax payment timeliness (25%)
  const payments = getPayments(landlord.id);
  const onTimeRatio = payments.onTime / payments.total;
  score -= (1 - onTimeRatio) * 25;
  
  // Tenant confirmations (15%)
  const confirmations = getConfirmations(landlord.id);
  const confirmedRatio = confirmations.confirmed / confirmations.total;
  score -= (1 - confirmedRatio) * 15;
  
  // Document completeness (10%)
  if (!landlord.ownership_verified) score -= 10;
  
  // Dispute history (10%)
  const disputes = getDisputes(landlord.id);
  score -= Math.min(disputes.lost * 5, 10);
  
  // Inspection results (10%)
  const violations = getViolations(landlord.id);
  score -= Math.min(violations.count * 5, 10);
  
  return Math.max(0, Math.round(score));
}
```

### 7.4.2 Risk Score Calculation
```javascript
function calculateRiskScore(property) {
  let score = 0;
  
  // Property registered but no contracts > 6 months
  if (property.hasNoContracts && property.ageMonths > 6) {
    score += 25;
  }
  
  // GSM data shows residence, no contract (simulated)
  if (property.hasGsmPresence && !property.hasActiveContract) {
    score += 20;
  }
  
  // Utility usage anomaly
  if (property.hasUtilityAnomaly) {
    score += 15;
  }
  
  // Anonymous tips
  score += property.anonymousTips * 15;
  
  // Landlord history
  score += Math.min(property.landlord.violations * 2, 10);
  
  // Contract irregularities
  if (property.hasContractIrregularities) {
    score += 10;
  }
  
  return Math.min(score, 100);
}
```

## 7.5 Penalty Rules

### 7.5.1 Penalty Amounts
```javascript
const PENALTIES = {
  'UNREGISTERED_CONTRACT': {
    first: (annualRent) => annualRent * 1.0,    // 100% of annual rent
    second: (annualRent) => annualRent * 2.0,   // 200%
    third: (annualRent) => annualRent * 3.0     // 300%
  },
  'EXCESS_ADVANCE': {
    first: (excess) => excess * 0.5,   // 50% of excess
    second: (excess) => excess * 1.0,  // 100%
    third: (excess) => excess * 2.0    // 200%
  },
  'FALSE_INFORMATION': {
    first: 10000,   // GHS 10,000
    second: 50000,  // GHS 50,000
    third: 'PROSECUTION'
  },
  'CASH_PAYMENT_EVASION': {
    first: (amount) => amount * 1.0,   // 100% (50% to tenant)
    second: (amount) => amount * 2.0,  // 200%
    third: 'LICENSE_REVOCATION'
  },
  'MISSING_QR_CODE': {
    first: 5000,    // GHS 5,000
    second: 20000,  // GHS 20,000
    third: 'BUSINESS_CLOSURE'
  }
};
```

---

# 8. Simulated Integrations

## 8.1 NIA (Ghana Card) Simulation

### 8.1.1 Mock Data
```javascript
const MOCK_GHANA_CARDS = {
  'GHA-000000001-1': {
    number: 'GHA-000000001-1',
    firstName: 'Kwame',
    lastName: 'Asante',
    otherNames: '',
    dateOfBirth: '1980-05-15',
    gender: 'M',
    photo: '/mock/photos/kwame.jpg',
    address: 'GA-123-4567',
    status: 'VALID'
  },
  'GHA-000000002-2': {
    number: 'GHA-000000002-2',
    firstName: 'Ama',
    lastName: 'Mensah',
    otherNames: 'Adjoa',
    dateOfBirth: '1992-08-22',
    gender: 'F',
    photo: '/mock/photos/ama.jpg',
    address: 'GA-456-7890',
    status: 'VALID'
  }
  // Add more mock cards...
};
```

### 8.1.2 Verification Endpoint
```javascript
// POST /api/simulate/nia/verify
function verifyGhanaCard(cardNumber) {
  // Simulate network delay
  await delay(1000);
  
  // Check mock data
  const card = MOCK_GHANA_CARDS[cardNumber];
  
  if (card) {
    return {
      success: true,
      data: card
    };
  }
  
  // For demo: Accept any valid format
  if (cardNumber.match(/^GHA-\d{9}-\d$/)) {
    return {
      success: true,
      data: generateMockCard(cardNumber)
    };
  }
  
  return {
    success: false,
    error: 'Invalid Ghana Card number'
  };
}
```

## 8.2 GRA (Tax) Simulation

### 8.2.1 TIN Verification
```javascript
// POST /api/simulate/gra/verify-tin
function verifyTIN(tinNumber) {
  await delay(500);
  
  // Accept format: Cxxxxxxxx or Pxxxxxxxx
  if (tinNumber.match(/^[CP]\d{8}$/)) {
    return {
      success: true,
      data: {
        tin: tinNumber,
        name: 'Registered Taxpayer',
        status: 'ACTIVE',
        taxCompliant: true
      }
    };
  }
  
  return {
    success: false,
    error: 'Invalid TIN'
  };
}
```

## 8.3 Lands Commission Simulation

### 8.3.1 Ownership Verification
```javascript
// POST /api/simulate/lands/verify
function verifyOwnership(propertyAddress, ownerGhanaCard) {
  await delay(1500);
  
  // For demo: 80% success rate
  if (Math.random() > 0.2) {
    return {
      success: true,
      data: {
        propertyAddress,
        ownerName: 'Verified Owner',
        ownerGhanaCard,
        titleType: 'FREEHOLD',
        registrationDate: '2020-01-15',
        verified: true
      }
    };
  }
  
  return {
    success: true,
    data: {
      propertyAddress,
      verified: false,
      message: 'Property not found in registry - manual verification required'
    }
  };
}
```

## 8.4 Mobile Money Simulation

### 8.4.1 Payment Processing
```javascript
// POST /api/simulate/payment/process
function processPayment(paymentRequest) {
  const { amount, provider, phoneNumber, reference } = paymentRequest;
  
  await delay(2000); // Simulate processing time
  
  // Demo failure: Amount > 10,000
  if (amount > 10000) {
    return {
      success: false,
      error: 'INSUFFICIENT_FUNDS',
      message: 'Payment failed - insufficient funds'
    };
  }
  
  // Generate provider reference
  const providerRef = `${provider}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    success: true,
    data: {
      reference,
      providerReference: providerRef,
      amount,
      provider,
      phoneNumber: phoneNumber.substr(0, 6) + '****',
      timestamp: new Date().toISOString(),
      status: 'COMPLETED'
    }
  };
}
```

## 8.5 SMS Gateway Simulation

### 8.5.1 Send SMS
```javascript
// POST /api/simulate/sms/send
function sendSMS(phoneNumber, message) {
  // Log to console
  console.log(`[SMS] To: ${phoneNumber}`);
  console.log(`[SMS] Message: ${message}`);
  
  // Store in notifications table for display in UI
  await createNotification({
    type: 'SMS',
    recipient: phoneNumber,
    content: message,
    status: 'DELIVERED'
  });
  
  return {
    success: true,
    messageId: `SMS-${Date.now()}`,
    status: 'DELIVERED'
  };
}
```

## 8.6 Utility Data Simulation

### 8.6.1 Get Utility Usage
```javascript
// GET /api/simulate/utility/:propertyId
function getUtilityUsage(propertyId) {
  // Generate mock usage data
  const months = [];
  const baseUsage = 100 + Math.random() * 200;
  
  for (let i = 0; i < 12; i++) {
    months.push({
      month: new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000).toISOString().substr(0, 7),
      electricityKwh: baseUsage + Math.random() * 50 - 25,
      waterLitres: (baseUsage * 10) + Math.random() * 500 - 250,
      hasAnomaly: Math.random() > 0.9
    });
  }
  
  return {
    propertyId,
    usage: months,
    hasActiveConnection: true
  };
}
```

## 8.7 GSM Location Simulation

### 8.7.1 Check Residence
```javascript
// GET /api/simulate/gsm/residence/:phoneNumber
function checkResidence(phoneNumber) {
  // For demo: Return random nearby location
  return {
    phoneNumber: phoneNumber.substr(0, 6) + '****',
    primaryLocation: {
      latitude: 5.5600 + (Math.random() - 0.5) * 0.01,
      longitude: -0.2050 + (Math.random() - 0.5) * 0.01,
      confidence: 0.85
    },
    nighttimePresence: true,
    daysPerMonth: 25 + Math.floor(Math.random() * 5)
  };
}
```

---

# 9. Demo Data

## 9.1 Demo Users

```javascript
const DEMO_USERS = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'kwame@demo.gh',
    phone: '0241000001',
    password: 'demo123', // hashed in DB
    role: 'LANDLORD_INDIVIDUAL',
    firstName: 'Kwame',
    lastName: 'Asante',
    ghanaCardNumber: 'GHA-000000001-1',
    tinNumber: 'C12345678',
    digitalAddress: 'GA-123-4567',
    region: 'Greater Accra',
    district: 'Accra Metropolitan',
    status: 'ACTIVE',
    complianceScore: 92
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'goldkey@demo.gh',
    phone: '0241000002',
    password: 'demo123',
    role: 'LANDLORD_CORPORATE',
    firstName: 'Property',
    lastName: 'Manager',
    companyName: 'GoldKey Properties Ltd',
    companyRegistrationNumber: 'CS123456',
    tinNumber: 'C87654321',
    status: 'ACTIVE',
    complianceScore: 88
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    email: 'ama@demo.gh',
    phone: '0241000003',
    password: 'demo123',
    role: 'TENANT_INDIVIDUAL',
    firstName: 'Ama',
    lastName: 'Mensah',
    ghanaCardNumber: 'GHA-000000002-2',
    digitalAddress: 'GA-456-7890',
    status: 'ACTIVE'
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    email: 'quickmart@demo.gh',
    phone: '0241000004',
    password: 'demo123',
    role: 'TENANT_CORPORATE',
    companyName: 'QuickMart Ltd',
    companyRegistrationNumber: 'CS654321',
    status: 'ACTIVE'
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    email: 'gra@demo.gh',
    phone: '0241000005',
    password: 'demo123',
    role: 'GRA_OFFICER',
    firstName: 'John',
    lastName: 'Tetteh',
    status: 'ACTIVE'
  },
  {
    id: '66666666-6666-6666-6666-666666666666',
    email: 'district@demo.gh',
    phone: '0241000006',
    password: 'demo123',
    role: 'DISTRICT_OFFICER',
    firstName: 'Mary',
    lastName: 'Owusu',
    district: 'Accra Metropolitan',
    status: 'ACTIVE'
  },
  {
    id: '77777777-7777-7777-7777-777777777777',
    email: 'inspector@demo.gh',
    phone: '0241000007',
    password: 'demo123',
    role: 'INSPECTOR',
    firstName: 'Samuel',
    lastName: 'Adjei',
    district: 'Accra Metropolitan',
    status: 'ACTIVE'
  },
  {
    id: '88888888-8888-8888-8888-888888888888',
    email: 'admin@demo.gh',
    phone: '0241000008',
    password: 'admin123',
    role: 'SYSTEM_ADMIN',
    firstName: 'System',
    lastName: 'Admin',
    status: 'ACTIVE'
  }
];
```

## 9.2 Demo Properties

```javascript
const DEMO_PROPERTIES = [
  {
    id: 'prop-001',
    landlordId: '11111111-1111-1111-1111-111111111111',
    propertyCode: 'GAR-AMA-GA-123-4567-01',
    digitalAddress: 'GA-123-4567',
    region: 'Greater Accra',
    district: 'Accra Metropolitan',
    neighborhood: 'Osu',
    propertyType: 'R-2B',
    propertyCategory: 'RESIDENTIAL',
    bedrooms: 2,
    bathrooms: 2,
    isFurnished: true,
    status: 'VERIFIED'
  },
  {
    id: 'prop-002',
    landlordId: '11111111-1111-1111-1111-111111111111',
    propertyCode: 'GAR-AMA-GA-123-4567-02',
    digitalAddress: 'GA-123-4568',
    region: 'Greater Accra',
    district: 'Accra Metropolitan',
    neighborhood: 'Osu',
    propertyType: 'R-1B',
    propertyCategory: 'RESIDENTIAL',
    bedrooms: 1,
    bathrooms: 1,
    isFurnished: false,
    status: 'VERIFIED'
  },
  {
    id: 'prop-003',
    landlordId: '22222222-2222-2222-2222-222222222222',
    propertyCode: 'GAR-TMA-GT-456-7890-01',
    digitalAddress: 'GT-456-7890',
    region: 'Greater Accra',
    district: 'Tema Metropolitan',
    neighborhood: 'Community 1',
    propertyType: 'C-SHP',
    propertyCategory: 'COMMERCIAL',
    status: 'VERIFIED'
  }
  // Add more properties...
];
```

## 9.3 Demo Contracts

```javascript
const DEMO_CONTRACTS = [
  {
    id: 'contract-001',
    contractNumber: 'CTR-2024-00001',
    propertyId: 'prop-001',
    landlordId: '11111111-1111-1111-1111-111111111111',
    tenantId: '33333333-3333-3333-3333-333333333333',
    contractType: 'STANDARD',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    monthlyRent: 1500,
    securityDeposit: 3000,
    advanceMonths: 6,
    status: 'ACTIVE',
    taxRate: 0.08,
    totalTaxWithheld: 720
  },
  {
    id: 'contract-002',
    contractNumber: 'CTR-2024-00002',
    propertyId: 'prop-003',
    landlordId: '22222222-2222-2222-2222-222222222222',
    tenantId: '44444444-4444-4444-4444-444444444444',
    contractType: 'COMMERCIAL',
    startDate: '2024-03-01',
    endDate: '2025-02-28',
    monthlyRent: 3000,
    securityDeposit: 6000,
    advanceMonths: 12,
    status: 'ACTIVE',
    taxRate: 0.08,
    totalTaxWithheld: 2880
  }
  // Add more contracts...
];
```

## 9.4 Demo Payments

```javascript
const DEMO_PAYMENTS = [
  {
    id: 'pay-001',
    paymentReference: 'PAY-2024-00001',
    contractId: 'contract-001',
    tenantId: '33333333-3333-3333-3333-333333333333',
    landlordId: '11111111-1111-1111-1111-111111111111',
    grossAmount: 9000, // 6 months advance
    taxAmount: 720,
    netAmount: 8190,
    platformFee: 90,
    periodStart: '2024-01-01',
    periodEnd: '2024-06-30',
    paymentMethod: 'MOBILE_MONEY_MTN',
    status: 'COMPLETED',
    initiatedAt: '2024-01-01T10:00:00Z',
    completedAt: '2024-01-01T10:01:30Z'
  }
  // Add more payments...
];
```

## 9.5 Demo Inspection Cases

```javascript
const DEMO_CASES = [
  {
    id: 'case-001',
    caseNumber: 'CASE-2024-00001',
    propertyId: 'prop-004', // Unregistered property
    caseType: 'UNREGISTERED_RENTAL',
    priority: 'HIGH',
    riskScore: 75,
    source: 'SYSTEM_DETECTION',
    status: 'ASSIGNED',
    assignedInspectorId: '77777777-7777-7777-7777-777777777777',
    description: 'Property shows utility usage but no registered contracts',
    scheduledDate: '2024-02-15'
  },
  {
    id: 'case-002',
    caseNumber: 'CASE-2024-00002',
    propertyId: 'prop-005',
    caseType: 'ANONYMOUS_TIP',
    priority: 'MEDIUM',
    riskScore: 45,
    source: 'ANONYMOUS_REPORT',
    status: 'OPEN',
    description: 'Report of cash payment demanded by landlord'
  }
];
```

## 9.6 Demo Market Data

```javascript
const DEMO_MARKET_DATA = [
  {
    region: 'Greater Accra',
    district: 'Accra Metropolitan',
    neighborhood: 'Osu',
    propertyType: 'R-2B',
    bedrooms: 2,
    periodYear: 2024,
    periodMonth: 1,
    sampleSize: 45,
    averageRent: 1800,
    medianRent: 1650,
    minRent: 1200,
    maxRent: 3500,
    percentile10: 1300,
    percentile90: 2500
  },
  {
    region: 'Greater Accra',
    district: 'Accra Metropolitan',
    neighborhood: 'East Legon',
    propertyType: 'R-3B',
    bedrooms: 3,
    periodYear: 2024,
    periodMonth: 1,
    sampleSize: 32,
    averageRent: 3500,
    medianRent: 3200,
    minRent: 2000,
    maxRent: 8000,
    percentile10: 2200,
    percentile90: 5500
  }
  // Add more market data for different areas...
];
```

---

# 10. API Specifications

## 10.1 API Standards

### 10.1.1 Base URL
```
Development: http://localhost:3000/api
Production: https://api.ghanarentals.gov.gh/api
```

### 10.1.2 Authentication
```
Header: Authorization: Bearer <JWT_TOKEN>
```

### 10.1.3 Response Format
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### 10.1.4 Error Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ]
  }
}
```

## 10.2 Complete API Endpoint List

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/register | Register new user |
| POST | /auth/verify-otp | Verify phone OTP |
| POST | /auth/login | User login |
| POST | /auth/logout | User logout |
| POST | /auth/refresh | Refresh token |
| POST | /auth/forgot-password | Request password reset |
| POST | /auth/reset-password | Reset password |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /users/me | Get current user |
| PUT | /users/me | Update current user |
| GET | /users/:id | Get user by ID |
| GET | /users | List users (admin) |
| PUT | /users/:id/status | Update user status |

### Properties
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /properties | Create property |
| GET | /properties | List properties |
| GET | /properties/:id | Get property |
| PUT | /properties/:id | Update property |
| DELETE | /properties/:id | Delete property |
| POST | /properties/:id/photos | Upload photos |
| POST | /properties/:id/verify | Request verification |
| GET | /properties/search | Search properties |

### Contracts
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /contracts | Create contract |
| GET | /contracts | List contracts |
| GET | /contracts/:id | Get contract |
| PUT | /contracts/:id | Update contract |
| POST | /contracts/:id/confirm | Confirm contract |
| POST | /contracts/:id/object | Object to contract |
| POST | /contracts/:id/terminate | Terminate contract |
| POST | /contracts/:id/renew | Renew contract |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /payments | Initiate payment |
| GET | /payments | List payments |
| GET | /payments/:id | Get payment |
| GET | /payments/:id/receipt | Download receipt |
| POST | /payments/calculate | Calculate breakdown |

### Tax
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /tax/certificates | List certificates |
| GET | /tax/certificates/:id | Get certificate |
| GET | /tax/certificates/:id/download | Download certificate |
| POST | /tax/certificates/generate | Generate certificate |
| GET | /tax/verify/:code | Verify certificate |
| GET | /tax/summary | Get tax summary |

### Market
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /market/rent-check | Get market rent data |
| GET | /market/trends | Get rent trends |
| POST | /market/compare | Compare to market |

### Enforcement
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /cases | List cases |
| GET | /cases/:id | Get case |
| POST | /cases | Create case |
| POST | /cases/:id/assign | Assign inspector |
| POST | /cases/:id/schedule | Schedule inspection |
| POST | /cases/:id/evidence | Upload evidence |
| POST | /cases/:id/report | Submit report |
| POST | /cases/:id/close | Close case |
| POST | /reports/anonymous | Submit tip |

### Disputes
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /disputes | File dispute |
| GET | /disputes | List disputes |
| GET | /disputes/:id | Get dispute |
| POST | /disputes/:id/respond | Respond |
| POST | /disputes/:id/evidence | Add evidence |
| POST | /disputes/:id/resolve | Resolve dispute |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /notifications | List notifications |
| PUT | /notifications/:id/read | Mark as read |
| PUT | /notifications/read-all | Mark all as read |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /admin/dashboard | Dashboard stats |
| GET | /admin/reports | Generate reports |
| GET | /admin/audit-logs | View audit logs |
| POST | /admin/system/config | Update config |

### USSD Simulation
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /ussd/session | Start USSD session |
| POST | /ussd/input | Process USSD input |
| GET | /ussd/menu/:code | Get menu for code |

---

# 11. Workflows

## 11.1 Complete User Registration Workflow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as API
    participant DB as Database
    participant S as SMS Simulator
    participant N as NIA Simulator

    U->>F: Enter email, phone, password
    F->>A: POST /auth/register
    A->>DB: Check if user exists
    DB-->>A: User not found
    A->>A: Generate OTP
    A->>S: Send OTP SMS
    S-->>A: SMS sent (logged)
    A->>DB: Store pending registration
    A-->>F: Return registration ID
    F->>U: Show OTP input

    U->>F: Enter OTP
    F->>A: POST /auth/verify-otp
    A->>DB: Verify OTP
    DB-->>A: OTP valid
    A->>DB: Update user status
    A-->>F: OTP verified
    F->>U: Show role selection

    U->>F: Select role (Landlord)
    U->>F: Enter Ghana Card number
    F->>A: POST /users/verify-identity
    A->>N: Verify Ghana Card
    N-->>A: Card details
    A->>DB: Update user with identity
    A-->>F: Identity verified
    F->>U: Show completion message
```

## 11.2 Complete Contract Registration Workflow

```mermaid
sequenceDiagram
    participant L as Landlord
    participant T as Tenant
    participant F as Frontend
    participant A as API
    participant DB as Database
    participant S as SMS Simulator

    L->>F: Select property
    L->>F: Enter tenant details
    L->>F: Set contract terms
    L->>F: Upload contract document
    F->>A: POST /contracts
    A->>A: Validate contract terms
    A->>A: Check advance payment limits
    A->>A: Generate confirmation code
    A->>DB: Create contract (PENDING)
    A->>S: Send SMS to tenant
    S-->>A: SMS sent
    A-->>F: Contract created
    F->>L: Show confirmation

    Note over T: Tenant receives SMS

    T->>F: Login to system
    T->>F: View pending contract
    F->>A: GET /contracts/:id
    A->>DB: Get contract details
    DB-->>A: Contract with property & landlord
    A-->>F: Contract details
    F->>T: Show contract for review

    T->>F: Enter confirmation code
    F->>A: POST /contracts/:id/confirm
    A->>DB: Verify code & update status
    A->>A: Calculate initial tax
    A->>DB: Contract now ACTIVE
    A->>S: Notify landlord
    A-->>F: Confirmation success
    F->>T: Show active contract
```

## 11.3 Complete Payment Workflow

```mermaid
sequenceDiagram
    participant T as Tenant
    participant F as Frontend
    participant A as API
    participant DB as Database
    participant P as Payment Simulator
    participant S as SMS Simulator

    T->>F: Select contract
    T->>F: Enter payment amount
    F->>A: POST /payments/calculate
    A->>A: Calculate tax, fees
    A-->>F: Payment breakdown
    F->>T: Show breakdown

    T->>F: Select payment method
    T->>F: Confirm payment
    F->>A: POST /payments
    A->>DB: Create payment (PENDING)
    A->>P: Process payment
    P-->>A: Payment successful
    A->>DB: Update payment (COMPLETED)
    A->>DB: Update contract tax totals
    A->>S: Send receipt SMS to tenant
    A->>S: Send notification to landlord
    A-->>F: Payment complete
    F->>T: Show receipt
```

## 11.4 Inspector Case Workflow

```mermaid
sequenceDiagram
    participant SYS as System
    participant I as Inspector
    participant F as Frontend
    participant A as API
    participant DB as Database

    SYS->>A: Risk detection triggered
    A->>A: Calculate risk score
    A->>DB: Create case (OPEN)
    A->>DB: Auto-assign to inspector
    A->>A: Send notification

    I->>F: View assigned cases
    F->>A: GET /cases?assigned=me
    A->>DB: Get inspector's cases
    A-->>F: Cases list
    F->>I: Show case list

    I->>F: Open case details
    F->>A: GET /cases/:id
    A-->>F: Case with property details
    F->>I: Show case details

    I->>F: Schedule inspection
    F->>A: POST /cases/:id/schedule
    A->>DB: Update scheduled date
    A-->>F: Scheduled
    F->>I: Confirmation

    I->>F: Check in at location
    I->>F: Upload evidence photos
    F->>A: POST /cases/:id/evidence
    A->>DB: Store evidence
    A-->>F: Evidence uploaded

    I->>F: Submit inspection report
    F->>A: POST /cases/:id/report
    A->>DB: Store report
    A->>DB: Update case status
    A-->>F: Report submitted
    F->>I: Confirmation
```

---

# 12. Reports & Analytics

## 12.1 Dashboard Metrics

### 12.1.1 GRA Dashboard
```javascript
const graDashboardMetrics = {
  // Today's collections
  todayCollections: {
    taxCollected: 'SUM(tax_amount) WHERE DATE(completed_at) = TODAY',
    transactionCount: 'COUNT(*) WHERE DATE(completed_at) = TODAY',
    comparedToYesterday: 'percentage change'
  },
  
  // Period collections
  periodCollections: {
    thisWeek: 'SUM last 7 days',
    thisMonth: 'SUM this month',
    thisYear: 'SUM this year',
    vsTarget: 'comparison to target'
  },
  
  // Compliance
  compliance: {
    registeredLandlords: 'COUNT users WHERE role = LANDLORD AND status = ACTIVE',
    registeredProperties: 'COUNT properties WHERE status = VERIFIED',
    activeContracts: 'COUNT contracts WHERE status = ACTIVE',
    complianceRate: 'registered / estimated total'
  },
  
  // Alerts
  alerts: {
    pendingCases: 'COUNT cases WHERE status IN (OPEN, ASSIGNED)',
    overdueInspections: 'COUNT cases WHERE scheduled_date < TODAY AND status != CLOSED',
    highRiskProperties: 'COUNT WHERE risk_score > 60'
  }
};
```

### 12.1.2 Landlord Dashboard
```javascript
const landlordDashboardMetrics = {
  portfolio: {
    totalProperties: 'COUNT',
    activeContracts: 'COUNT',
    vacantProperties: 'COUNT'
  },
  
  financials: {
    monthlyIncome: 'SUM monthly_rent',
    totalReceived: 'SUM net_amount this month',
    pending: 'SUM outstanding'
  },
  
  compliance: {
    score: 'compliance_score',
    pendingActions: 'contracts needing attention'
  },
  
  upcoming: {
    expiringContracts: 'contracts expiring in 60 days',
    pendingPayments: 'expected payments'
  }
};
```

## 12.2 Standard Reports

### 12.2.1 Tax Collection Report
```sql
SELECT
  DATE_TRUNC('month', p.completed_at) as period,
  r.region,
  d.district,
  COUNT(DISTINCT c.landlord_id) as landlord_count,
  COUNT(DISTINCT p.id) as transaction_count,
  SUM(p.gross_amount) as total_rent,
  SUM(p.tax_amount) as total_tax,
  SUM(p.platform_fee) as total_fees
FROM payments p
JOIN contracts c ON p.contract_id = c.id
JOIN properties pr ON c.property_id = pr.id
JOIN regions r ON pr.region = r.name
JOIN districts d ON pr.district = d.name
WHERE p.status = 'COMPLETED'
  AND p.completed_at BETWEEN :start_date AND :end_date
GROUP BY 1, 2, 3
ORDER BY 1 DESC, 4 DESC;
```

### 12.2.2 Compliance Report
```sql
SELECT
  d.district,
  COUNT(DISTINCT u.id) as registered_landlords,
  COUNT(DISTINCT p.id) as registered_properties,
  COUNT(DISTINCT c.id) as active_contracts,
  AVG(u.compliance_score) as avg_compliance_score,
  COUNT(CASE WHEN u.compliance_score >= 90 THEN 1 END) as gold_landlords,
  COUNT(CASE WHEN u.compliance_score >= 75 THEN 1 END) as silver_landlords,
  COUNT(CASE WHEN u.compliance_score < 60 THEN 1 END) as non_compliant
FROM users u
LEFT JOIN properties p ON u.id = p.landlord_id
LEFT JOIN contracts c ON p.id = c.property_id AND c.status = 'ACTIVE'
JOIN districts d ON u.district = d.name
WHERE u.role LIKE 'LANDLORD%'
  AND u.status = 'ACTIVE'
GROUP BY 1
ORDER BY 2 DESC;
```

## 12.3 Analytics Charts

### 12.3.1 Chart Data Endpoints
| Endpoint | Description | Data |
|----------|-------------|------|
| GET /analytics/tax-trend | Tax collection over time | Monthly totals, 12 months |
| GET /analytics/registrations | New registrations | Daily/weekly counts |
| GET /analytics/compliance-dist | Compliance distribution | Score buckets |
| GET /analytics/rent-trends | Rent price trends | By area, property type |
| GET /analytics/enforcement | Enforcement stats | Cases by type, outcome |

---

# 13. Technical Requirements

## 13.1 Development Setup

### 13.1.1 Prerequisites
```bash
# Required
- Node.js 18+
- npm or yarn
- SQLite (for demo) or PostgreSQL 14+

# Optional
- Docker
- Redis (for sessions/caching)
```

### 13.1.2 Project Structure
```
ghana-rental-system/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── store/
│   │   ├── utils/
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── utils/
│   │   ├── simulators/
│   │   └── app.js
│   ├── database/
│   │   ├── migrations/
│   │   └── seeds/
│   ├── package.json
│   └── .env.example
│
├── docs/
│   └── api/
│
├── docker-compose.yml
└── README.md
```

### 13.1.3 Environment Variables
```bash
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=sqlite:./database.sqlite
# Or for PostgreSQL:
# DATABASE_URL=postgresql://user:pass@localhost:5432/ghana_rental

# Authentication
JWT_SECRET=your-secret-key
JWT_EXPIRY=24h

# Simulation Mode
SIMULATION_MODE=true
SIMULATION_DELAY_MS=1000

# Demo Mode
DEMO_MODE=true
SEED_DEMO_DATA=true
```

## 13.2 Build & Run Commands

```bash
# Install dependencies
cd backend && npm install
cd frontend && npm install

# Run database migrations
cd backend && npm run migrate

# Seed demo data
cd backend && npm run seed

# Start development servers
cd backend && npm run dev    # Starts on :3000
cd frontend && npm run dev   # Starts on :5173

# Build for production
cd frontend && npm run build
cd backend && npm run build

# Run tests
npm run test
npm run test:e2e
```

## 13.3 Demo Features Checklist

### Must Have (MVP)
- [ ] User registration (landlord, tenant)
- [ ] User login/logout
- [ ] Property registration
- [ ] Contract creation
- [ ] Tenant contract confirmation
- [ ] Payment processing (simulated)
- [ ] Tax calculation and display
- [ ] Tax certificate generation
- [ ] Market rent checker
- [ ] Basic dashboards (landlord, tenant, GRA)
- [ ] USSD simulator (web-based)
- [ ] Demo data seeding

### Should Have
- [ ] Inspector case management
- [ ] Dispute filing
- [ ] Notifications (in-app)
- [ ] Basic reports
- [ ] Compliance scoring
- [ ] Property search

### Nice to Have
- [ ] QR code generation
- [ ] PDF receipt download
- [ ] Advanced analytics charts
- [ ] Bulk operations
- [ ] Export to Excel
- [ ] Multi-language (Twi, Ga)

## 13.4 Demo Limitations Documentation

```javascript
const DEMO_LIMITATIONS = {
  'External Integrations': 'All external systems (NIA, GRA, Lands Commission, Mobile Money, SMS) are simulated',
  'Payments': 'No real money is processed. All payments are simulated.',
  'SMS/Email': 'Messages are logged to console and shown in-app, not actually sent.',
  'Biometrics': 'Ghana Card photo verification is simulated (any valid format accepted).',
  'Performance': 'Not optimized for production load.',
  'Security': 'Basic security only. Not hardened for production.',
  'Offline Mode': 'Not implemented in demo.',
  'Multi-language': 'English only in demo.',
  'USSD': 'Web-based simulator only, not actual USSD integration.'
};
```

---

# Appendix A: Ghana-Specific Data

## A.1 Regions and Districts

```javascript
const GHANA_REGIONS = [
  {
    name: 'Greater Accra',
    code: 'GAR',
    districts: [
      'Accra Metropolitan',
      'Tema Metropolitan',
      'Ga East',
      'Ga West',
      'Ga North',
      'Ga South',
      'Ga Central',
      'Ledzokuku',
      'Krowor',
      'La Dade Kotopon',
      'La Nkwantanang Madina',
      'Adentan',
      'Ayawaso East',
      'Ayawaso North',
      'Ayawaso Central',
      'Ayawaso West',
      'Ablekuma Central',
      'Ablekuma North',
      'Ablekuma West',
      'Okaikwei North',
      'Korle Klottey',
      'Weija Gbawe',
      'Ada East',
      'Ada West',
      'Ningo Prampram',
      'Kpone Katamanso',
      'Shai Osudoku'
    ]
  },
  {
    name: 'Ashanti',
    code: 'ASH',
    districts: [
      'Kumasi Metropolitan',
      'Oforikrom',
      'Asokwa',
      'Suame',
      'Old Tafo',
      'Manhyia North',
      'Manhyia South',
      'Kwadaso',
      'Bantama',
      'Nhyiaeso',
      'Obuasi Municipal',
      'Obuasi East',
      'Ejisu',
      'Juaben',
      // ... more districts
    ]
  }
  // ... other regions
];
```

## A.2 Property Type Codes

```javascript
const PROPERTY_TYPES = {
  // Residential
  'R-SR': { name: 'Single Room', category: 'RESIDENTIAL', maxAdvance: 6 },
  'R-SC': { name: 'Self-Contained', category: 'RESIDENTIAL', maxAdvance: 6 },
  'R-1B': { name: '1-Bedroom', category: 'RESIDENTIAL', maxAdvance: 6 },
  'R-2B': { name: '2-Bedroom', category: 'RESIDENTIAL', maxAdvance: 6 },
  'R-3B': { name: '3-Bedroom', category: 'RESIDENTIAL', maxAdvance: 6 },
  'R-4B+': { name: '4+ Bedroom', category: 'RESIDENTIAL', maxAdvance: 6 },
  'R-HS': { name: 'House', category: 'RESIDENTIAL', maxAdvance: 6 },
  'R-VL': { name: 'Villa', category: 'RESIDENTIAL', maxAdvance: 6 },
  'R-CMP': { name: 'Compound Room', category: 'RESIDENTIAL', maxAdvance: 6 },
  
  // Commercial
  'C-SHP': { name: 'Shop', category: 'COMMERCIAL', maxAdvance: 12 },
  'C-OFF': { name: 'Office', category: 'COMMERCIAL', maxAdvance: 12 },
  'C-WHS': { name: 'Warehouse', category: 'COMMERCIAL', maxAdvance: 24 },
  'C-IND': { name: 'Industrial', category: 'COMMERCIAL', maxAdvance: 24 },
  'C-MXD': { name: 'Mixed Use', category: 'COMMERCIAL', maxAdvance: 12 }
};
```

## A.3 Ghana Phone Number Format

```javascript
// Ghana phone numbers
// Format: 0XX XXX XXXX (10 digits)
// Mobile prefixes: 020, 023, 024, 025, 026, 027, 028, 029, 050, 054, 055, 056, 057, 059

const PHONE_REGEX = /^0(2[0-9]|5[0-9])[0-9]{7}$/;

function formatGhanaPhone(phone) {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  // Handle international format
  if (digits.startsWith('233')) {
    return '0' + digits.slice(3);
  }
  
  return digits;
}
```

## A.4 Ghana Card Format

```javascript
// Ghana Card Number Format: GHA-XXXXXXXXX-X
const GHANA_CARD_REGEX = /^GHA-\d{9}-\d$/;

function validateGhanaCard(cardNumber) {
  return GHANA_CARD_REGEX.test(cardNumber);
}
```

## A.5 TIN Format

```javascript
// Ghana TIN Format: 
// Individual: Pxxxxxxxxx (10 chars, starts with P)
// Corporate: Cxxxxxxxxx (10 chars, starts with C)
const TIN_REGEX = /^[PC]\d{9}$/;
```

## A.6 Ghana Digital Address Format

```javascript
// Ghana Post Digital Address Format: XX-XXX-XXXX
// First 2 chars: Region code
// Next 3 chars: District code
// Last 4 chars: Unique identifier
const DIGITAL_ADDRESS_REGEX = /^[A-Z]{2}-\d{3}-\d{4}$/;

const REGION_CODES = {
  'GA': 'Greater Accra',
  'AS': 'Ashanti',
  'WR': 'Western',
  'ER': 'Eastern',
  'CR': 'Central',
  'NR': 'Northern',
  'UE': 'Upper East',
  'UW': 'Upper West',
  'VR': 'Volta',
  'BA': 'Brong Ahafo',
  'AH': 'Ahafo',
  'BO': 'Bono',
  'BE': 'Bono East',
  'OT': 'Oti',
  'NE': 'North East',
  'SV': 'Savannah',
  'WN': 'Western North'
};
```

---

# Appendix B: Error Codes

```javascript
const ERROR_CODES = {
  // Authentication (1xxx)
  'AUTH_001': 'Invalid credentials',
  'AUTH_002': 'Token expired',
  'AUTH_003': 'Token invalid',
  'AUTH_004': 'OTP expired',
  'AUTH_005': 'OTP invalid',
  'AUTH_006': 'Account locked',
  'AUTH_007': 'Account not verified',
  
  // Validation (2xxx)
  'VAL_001': 'Required field missing',
  'VAL_002': 'Invalid email format',
  'VAL_003': 'Invalid phone format',
  'VAL_004': 'Invalid Ghana Card format',
  'VAL_005': 'Invalid TIN format',
  'VAL_006': 'Invalid digital address format',
  'VAL_007': 'Amount exceeds limit',
  'VAL_008': 'Date range invalid',
  
  // Business Rules (3xxx)
  'BIZ_001': 'Advance payment exceeds limit',
  'BIZ_002': 'Security deposit exceeds limit',
  'BIZ_003': 'Contract already confirmed',
  'BIZ_004': 'Contract expired',
  'BIZ_005': 'Property not available',
  'BIZ_006': 'Insufficient compliance score',
  'BIZ_007': 'Payment already processed',
  'BIZ_008': 'Case already closed',
  
  // External Services (4xxx)
  'EXT_001': 'Ghana Card verification failed',
  'EXT_002': 'TIN verification failed',
  'EXT_003': 'Payment processing failed',
  'EXT_004': 'SMS delivery failed',
  
  // System (5xxx)
  'SYS_001': 'Database error',
  'SYS_002': 'File upload error',
  'SYS_003': 'PDF generation error',
  'SYS_004': 'Service unavailable'
};
```

---

# Appendix C: Notification Templates

```javascript
const NOTIFICATION_TEMPLATES = {
  'CONTRACT_CREATED': {
    title: 'New Contract Awaiting Confirmation',
    sms: 'Ghana Rental: A new contract has been created for you by {landlordName}. Login to confirm: {link}. Code: {code}',
    email: {
      subject: 'New Rental Contract Requires Your Confirmation',
      body: '...'
    }
  },
  
  'CONTRACT_CONFIRMED': {
    title: 'Contract Confirmed',
    sms: 'Ghana Rental: Contract {contractNumber} has been confirmed by {tenantName}. View details: {link}',
    email: { ... }
  },
  
  'PAYMENT_RECEIVED': {
    title: 'Payment Received',
    sms: 'Ghana Rental: Payment of GHS {amount} received for {property}. Tax: GHS {tax}. Ref: {reference}',
    email: { ... }
  },
  
  'PAYMENT_DUE': {
    title: 'Rent Payment Due',
    sms: 'Ghana Rental: Rent of GHS {amount} is due on {dueDate} for {property}. Pay now: {link}',
    email: { ... }
  },
  
  'TAX_CERTIFICATE_READY': {
    title: 'Tax Certificate Ready',
    sms: 'Ghana Rental: Your tax certificate for {period} is ready. Download: {link}',
    email: { ... }
  },
  
  'INSPECTION_SCHEDULED': {
    title: 'Property Inspection Scheduled',
    sms: 'Ghana Rental: An inspection has been scheduled for {property} on {date}. Case: {caseNumber}',
    email: { ... }
  },
  
  'CASE_ASSIGNED': {
    title: 'New Case Assigned',
    sms: 'Ghana Rental: Case {caseNumber} has been assigned to you. Priority: {priority}. View: {link}',
    email: { ... }
  }
};
```

---

**END OF TECHNICAL SPECIFICATION**

This document provides complete specifications for building a functional demo of the Ghana Rental Market Taxation System. All external integrations are simulated, and demo data is provided for immediate testing.
