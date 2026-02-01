import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Properties from './pages/Properties';
import PropertyDetails from './pages/PropertyDetails';
import PropertyForm from './pages/PropertyForm';
import Contracts from './pages/Contracts';
import ContractDetails from './pages/ContractDetails';
import ContractForm from './pages/ContractForm';
import Payments from './pages/Payments';
import PaymentDetails from './pages/PaymentDetails';
import TaxCertificates from './pages/TaxCertificates';
import MarketRent from './pages/MarketRent';
import Cases from './pages/Cases';
import CaseDetails from './pages/CaseDetails';
import USSDSimulator from './pages/USSDSimulator';
import Settings from './pages/Settings';
import VerifyCertificate from './pages/VerifyCertificate';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { token, user } = useAuthStore();
  const isAuthenticated = !!token && !!user;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Layout>{children}</Layout>;
};

// Public Route Component (redirect to dashboard if authenticated)
const PublicRoute = ({ children }) => {
  const { token, user } = useAuthStore();
  const isAuthenticated = !!token && !!user;

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            style: {
              background: '#006B3F',
            },
          },
          error: {
            style: {
              background: '#CE1126',
            },
          },
        }}
      />
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
        <Route path="/verify-certificate" element={<VerifyCertificate />} />
        <Route path="/market-rent" element={<MarketRent />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Properties */}
        <Route
          path="/properties"
          element={
            <ProtectedRoute>
              <Properties />
            </ProtectedRoute>
          }
        />
        <Route
          path="/properties/new"
          element={
            <ProtectedRoute allowedRoles={['LANDLORD_INDIVIDUAL', 'LANDLORD_CORPORATE']}>
              <PropertyForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/properties/:id"
          element={
            <ProtectedRoute>
              <PropertyDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/properties/:id/edit"
          element={
            <ProtectedRoute allowedRoles={['LANDLORD_INDIVIDUAL', 'LANDLORD_CORPORATE']}>
              <PropertyForm />
            </ProtectedRoute>
          }
        />

        {/* Contracts */}
        <Route
          path="/contracts"
          element={
            <ProtectedRoute>
              <Contracts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/contracts/new"
          element={
            <ProtectedRoute allowedRoles={['LANDLORD_INDIVIDUAL', 'LANDLORD_CORPORATE']}>
              <ContractForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/contracts/:id"
          element={
            <ProtectedRoute>
              <ContractDetails />
            </ProtectedRoute>
          }
        />

        {/* Payments */}
        <Route
          path="/payments"
          element={
            <ProtectedRoute>
              <Payments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payments/:id"
          element={
            <ProtectedRoute>
              <PaymentDetails />
            </ProtectedRoute>
          }
        />

        {/* Tax Certificates */}
        <Route
          path="/tax-certificates"
          element={
            <ProtectedRoute allowedRoles={['LANDLORD_INDIVIDUAL', 'LANDLORD_CORPORATE', 'GRA_OFFICER', 'GRA_SUPERVISOR', 'ADMIN', 'SYSTEM_ADMIN']}>
              <TaxCertificates />
            </ProtectedRoute>
          }
        />

        {/* Cases (Inspections) */}
        <Route
          path="/cases"
          element={
            <ProtectedRoute allowedRoles={['INSPECTOR', 'GRA_OFFICER', 'GRA_SUPERVISOR', 'ADMIN', 'SYSTEM_ADMIN']}>
              <Cases />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cases/:id"
          element={
            <ProtectedRoute allowedRoles={['INSPECTOR', 'GRA_OFFICER', 'GRA_SUPERVISOR', 'ADMIN', 'SYSTEM_ADMIN']}>
              <CaseDetails />
            </ProtectedRoute>
          }
        />

        {/* USSD Simulator */}
        <Route
          path="/ussd"
          element={
            <ProtectedRoute>
              <USSDSimulator />
            </ProtectedRoute>
          }
        />

        {/* Settings */}
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />

        {/* Default Redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
