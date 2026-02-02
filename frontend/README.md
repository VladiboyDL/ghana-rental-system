# Ghana Rental System - Web Dashboard

React web application for the Ghana Rental Market Taxation System admin dashboard.

## Overview

This frontend provides:
- Admin dashboard for landlords, tenants, and GRA officers
- Property and contract management interfaces
- Payment tracking and tax reporting
- Market analytics and visualizations
- USSD simulator for testing

## Tech Stack

- **Framework**: React 18.3
- **Build Tool**: Vite 6.0
- **Styling**: TailwindCSS 3.4
- **State Management**: Zustand 5.0
- **Routing**: React Router DOM 7.1
- **HTTP Client**: Axios 1.7
- **Icons**: Lucide React
- **Charts**: Recharts 2.15

## Project Structure

```
frontend/
├── src/
│   ├── main.jsx              # App entry point
│   ├── App.jsx               # Root component with routing
│   ├── index.css             # Global styles + Tailwind
│   ├── components/           # Reusable UI components
│   │   ├── Layout.jsx        # Main layout with sidebar
│   │   ├── Sidebar.jsx       # Navigation sidebar
│   │   ├── Header.jsx        # Top header bar
│   │   ├── StatsCard.jsx     # Dashboard stat cards
│   │   ├── PropertyCard.jsx  # Property display card
│   │   ├── ContractCard.jsx  # Contract display card
│   │   ├── PaymentTable.jsx  # Payment history table
│   │   ├── LoadingSpinner.jsx
│   │   └── ErrorBoundary.jsx
│   ├── pages/                # Page components
│   │   ├── Login.jsx         # Authentication page
│   │   ├── Dashboard.jsx     # Main dashboard
│   │   ├── Properties.jsx    # Property management
│   │   ├── Contracts.jsx     # Contract management
│   │   ├── Payments.jsx      # Payment history
│   │   ├── Reports.jsx       # Analytics & reports
│   │   ├── Settings.jsx      # User settings
│   │   └── USSDSimulator.jsx # USSD testing tool
│   ├── services/             # API integration
│   │   └── api.js            # Axios API client
│   ├── stores/               # Zustand state stores
│   │   ├── authStore.js      # Authentication state
│   │   └── uiStore.js        # UI state (sidebar, theme)
│   └── hooks/                # Custom React hooks
│       ├── useApi.js         # API request hook
│       └── index.js          # Hook exports
├── public/                   # Static assets
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- Backend API running (see backend/README.md)

### Installation

```bash
# Install dependencies
npm install

# Create environment file
echo "VITE_API_URL=http://localhost:3000/api" > .env
```

### Running Development Server

```bash
# Start development server
npm run dev
```

Dashboard will be available at `http://localhost:5173`

### Building for Production

```bash
# Build production bundle
npm run build

# Preview production build
npm run preview
```

## Environment Variables

Create a `.env` file:

```env
# API URL
VITE_API_URL=http://localhost:3000/api

# For production
VITE_API_URL=https://ghana-rental-api.onrender.com/api
```

## Pages

### Login (`/login`)
- Email and password authentication
- Quick demo login buttons for testing
- Automatic redirect after login

### Dashboard (`/`)
- Overview statistics (properties, contracts, payments)
- Recent activity feed
- Quick action buttons
- Tax collection summary (GRA users)

### Properties (`/properties`)
- Property listing with filters
- Add new property form
- Property details modal
- Edit property functionality
- Status badges (Verified, Pending)

### Contracts (`/contracts`)
- Contract listing with search
- Create new contract wizard
- Contract confirmation flow
- Status tracking (Active, Pending, Expired)

### Payments (`/payments`)
- Payment history table
- Tax withholding breakdown
- Payment status badges
- Export functionality

### Reports (`/reports`)
- Tax collection analytics
- Regional breakdown charts
- Property type distribution
- Time-series trends

### Settings (`/settings`)
- Profile management
- Notification preferences
- Security settings
- Account information

### USSD Simulator (`/ussd`)
- Test USSD flows
- Simulate feature phone interactions
- Debug USSD session states

## Components

### Layout Components

```jsx
// Main layout wrapper
<Layout>
  <YourPageContent />
</Layout>

// Includes:
// - Responsive sidebar
// - Header with user menu
// - Main content area
```

### UI Components

```jsx
// Stats card for dashboard
<StatsCard
  title="Total Properties"
  value={177}
  icon={Building}
  trend="+12%"
/>

// Property card
<PropertyCard
  property={propertyData}
  onView={() => {}}
  onEdit={() => {}}
/>

// Contract card
<ContractCard
  contract={contractData}
  onConfirm={() => {}}
/>

// Loading spinner
<LoadingSpinner size="lg" />
```

## State Management

### Auth Store (Zustand)

```javascript
import { useAuthStore } from './stores/authStore';

// In component
const { user, token, login, logout, isAuthenticated } = useAuthStore();

// Login
await login(email, password);

// Logout
logout();

// Check auth
if (isAuthenticated) { ... }
```

### UI Store (Zustand)

```javascript
import { useUIStore } from './stores/uiStore';

// In component
const { sidebarOpen, toggleSidebar, theme } = useUIStore();
```

## API Integration

### API Client

```javascript
import api from './services/api';

// GET request
const properties = await api.get('/properties');

// POST request
const newProperty = await api.post('/properties', data);

// With query params
const filtered = await api.get('/properties', {
  params: { region: 'Greater Accra', status: 'VERIFIED' }
});
```

### Custom Hook

```javascript
import { useApi } from './hooks/useApi';

function MyComponent() {
  const { data, loading, error, execute } = useApi(
    () => api.get('/properties')
  );

  useEffect(() => {
    execute();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <Error message={error} />;
  return <PropertyList properties={data} />;
}
```

## Styling

### TailwindCSS Classes

```jsx
// Button styles
<button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
  Submit
</button>

// Card styles
<div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
  Content
</div>

// Form input
<input className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" />
```

### Color Scheme

| Color | Usage | Tailwind Class |
|-------|-------|----------------|
| Green 600 | Primary actions | `bg-green-600` |
| Red 500 | Destructive/Tax | `bg-red-500` |
| Blue 500 | Info/Links | `bg-blue-500` |
| Gray 100 | Backgrounds | `bg-gray-100` |
| Gray 800 | Text | `text-gray-800` |

## Routing

```jsx
// App.jsx routes
<Routes>
  <Route path="/login" element={<Login />} />
  <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
  <Route path="/properties" element={<ProtectedRoute><Properties /></ProtectedRoute>} />
  <Route path="/contracts" element={<ProtectedRoute><Contracts /></ProtectedRoute>} />
  <Route path="/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
  <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
  <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
  <Route path="/ussd" element={<ProtectedRoute><USSDSimulator /></ProtectedRoute>} />
</Routes>
```

## Demo Accounts

Use these accounts on the login page:

| Role | Email | Password |
|------|-------|----------|
| Landlord | landlord@demo.com | demo123 |
| Tenant | tenant@demo.com | demo123 |
| GRA Officer | gra@demo.com | demo123 |
| Admin | admin@demo.com | admin123 |

## Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

## Build & Deploy

### Development Build

```bash
npm run dev
```

### Production Build

```bash
npm run build
```

Output in `dist/` folder.

### Deploy to Render

The dashboard is deployed as a static site on Render:

1. Push code to GitHub
2. Render auto-deploys from `render.yaml`
3. Build command: `npm run build`
4. Publish directory: `dist`

### Production URL

https://ghana-rental-dashboard.onrender.com

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance

- Code splitting via Vite
- Lazy loading for routes
- Optimized bundle size
- Gzip compression

## Troubleshooting

### API Connection Issues

```bash
# Check API URL in .env
echo $VITE_API_URL

# Test API health
curl http://localhost:3000/api/health
```

### Build Errors

```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
npm run build
```

### CORS Issues

Ensure the backend has your frontend URL in the CORS whitelist:
- `http://localhost:5173`
- `http://localhost:5174`

## License

Proprietary - Ghana Revenue Authority
