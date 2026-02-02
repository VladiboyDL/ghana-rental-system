# Ghana Rental Market Taxation System

A comprehensive digital platform for managing rental contracts, automating tax withholding, and providing market transparency for Ghana's rental market.

## Overview

This system enables landlords, tenants, and government officials (GRA) to manage rental contracts with automatic 8% withholding tax calculation and collection. The platform supports web dashboard access, mobile apps (iOS/Android), and USSD access for feature phones.

### Key Features

- **Contract Management**: Digital registration and management of rental contracts
- **Automatic Tax Withholding**: 8% withholding tax calculated and tracked automatically
- **Multi-Platform Access**: Web dashboard, iOS/Android apps, and USSD simulator
- **Market Analytics**: Regional rent data and market insights
- **GRA Integration**: Tax certificates, compliance tracking, and enforcement tools
- **Role-Based Access**: Landlords, tenants, GRA officers, inspectors, and administrators

## Tech Stack

| Component | Technology |
|-----------|------------|
| **Backend** | Node.js, Express.js, PostgreSQL |
| **Web Frontend** | React 18, Vite, TailwindCSS, Zustand |
| **Mobile App** | React Native, Expo |
| **Database** | PostgreSQL (production), SQLite (development) |
| **Authentication** | JWT + bcrypt |
| **Deployment** | Render (backend + frontend), EAS (mobile) |

## Project Structure

```
ghana-rental-market/
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Auth, security, validation
│   │   ├── routes/          # API route definitions
│   │   ├── services/        # Business logic
│   │   └── utils/           # Helpers and constants
│   ├── database/
│   │   ├── migrations/      # Database schema
│   │   └── seeds/           # Demo data seeders
│   └── tests/               # Jest unit tests
├── frontend/                # React web dashboard
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API client
│   │   └── stores/          # Zustand state management
│   └── public/              # Static assets
├── mobile/                  # React Native Expo app
│   ├── src/
│   │   ├── components/      # Mobile UI components
│   │   ├── screens/         # Screen components
│   │   ├── services/        # API client
│   │   └── stores/          # Zustand with AsyncStorage
│   └── assets/              # Images and fonts
├── DFS/                     # Design & Functional Specs
├── docs/                    # API documentation
└── design/                  # Design assets
```

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- PostgreSQL (for production) or SQLite (for development)
- Expo CLI (for mobile development)

### 1. Clone the Repository

```bash
git clone https://github.com/your-repo/ghana-rental-market.git
cd ghana-rental-market
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Configure your .env file
# DATABASE_URL=postgresql://user:pass@localhost:5432/ghana_rental
# JWT_SECRET=your-secret-key
# SIMULATION_MODE=true

# Run migrations
npm run migrate

# Seed demo data
npm run seed

# Start development server
npm run dev
```

The API will be available at `http://localhost:3000`

### 3. Web Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
echo "VITE_API_URL=http://localhost:3000/api" > .env

# Start development server
npm run dev
```

The web dashboard will be available at `http://localhost:5173`

### 4. Mobile App Setup

```bash
cd mobile

# Install dependencies
npm install

# Start Expo development server
npm start

# Run on iOS Simulator
npm run ios

# Run on Android Emulator
npm run android
```

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Landlord | landlord@demo.com | demo123 |
| Tenant | tenant@demo.com | demo123 |
| GRA Officer | gra@demo.com | demo123 |
| Inspector | inspector@demo.com | demo123 |
| Admin | admin@demo.com | admin123 |

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

### Properties
- `GET /api/properties` - List properties
- `POST /api/properties` - Create property
- `GET /api/properties/:id` - Get property details
- `PUT /api/properties/:id` - Update property

### Contracts
- `GET /api/contracts` - List contracts
- `POST /api/contracts` - Create contract
- `PUT /api/contracts/:id/confirm` - Tenant confirms contract

### Payments
- `GET /api/payments` - List payments
- `POST /api/payments` - Record payment
- `GET /api/payments/summary` - Payment summary with tax

### Reports
- `GET /api/reports/tax-summary` - Tax collection summary
- `GET /api/reports/market-data` - Market rent analytics

### Health Check
- `GET /api/health` - API health status

## Database Schema

### Core Tables
- **users** - All system users (landlords, tenants, officers)
- **properties** - Registered rental properties
- **contracts** - Rental agreements between landlords and tenants
- **payments** - Rent payments with tax calculations

### Supporting Tables
- **market_rent_data** - Regional rent benchmarks
- **tax_certificates** - Monthly/annual tax certificates
- **inspection_cases** - Property inspection records
- **audit_logs** - System activity logs

## Business Rules

### Tax Calculation
- **Registered landlords**: 8% withholding tax
- **Unregistered landlords**: 15% withholding tax
- **Platform fee**: 1% (max GHS 50)

### Rental Limits
- **Residential advance**: Maximum 6 months
- **Commercial advance**: Maximum 12-24 months
- **Security deposit**: Maximum 3 months rent

### Property Types
- **Residential**: Single Room (R-SR), Self-Contained (R-SC), 1-4+ Bedroom (R-1B to R-4B+), Villa (R-VL)
- **Commercial**: Shop (C-SH), Office (C-OFF), Warehouse (C-WH), Industrial (C-IND)

## Testing

### Backend Tests

```bash
cd backend

# Run all tests
npm test

# Run with coverage
npm run test:coverage
```

Current test coverage: **53 tests passing**

### Frontend Tests

```bash
cd frontend

# Run tests
npm test
```

## Deployment

### Production URLs

| Service | URL |
|---------|-----|
| API | https://ghana-rental-api.onrender.com |
| Dashboard | https://ghana-rental-dashboard.onrender.com |
| Health Check | https://ghana-rental-api.onrender.com/api/health |

### Deploy to Render

1. Push code to GitHub
2. Connect repository to Render
3. Use `render.yaml` for blueprint deployment
4. Configure environment variables

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions.

### Mobile App Deployment

```bash
cd mobile

# Build for iOS TestFlight
eas build --platform ios --profile production

# Build for Android Play Store
eas build --platform android --profile production
```

## Security Features

- **Helmet.js** - Security headers
- **Rate Limiting** - 100 requests/15min (general), 5 requests/15min (auth)
- **CORS Whitelist** - Controlled origin access
- **Input Sanitization** - XSS and SQL injection prevention
- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - bcrypt with salt rounds

## Environment Variables

### Backend (.env)

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:pass@localhost:5432/ghana_rental
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
SIMULATION_MODE=true
DEMO_MODE=true
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3000/api
```

### Mobile (app.config.js)

```javascript
API_URL: __DEV__
  ? 'http://localhost:3000/api'
  : 'https://ghana-rental-api.onrender.com/api'
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Data Statistics (Demo)

| Entity | Count |
|--------|-------|
| Users | 488 (152 landlords, 332 tenants) |
| Properties | 177 |
| Contracts | 146 |
| Payments | 561 |
| Total Tax Collected | GHS 115,584.16 |

## License

This project is proprietary software developed for the Ghana Revenue Authority.

## Support

For technical support or questions:
- Check the [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- Review API documentation in `/docs`
- Contact the development team

---

Built with support from the Ghana Revenue Authority (GRA)
