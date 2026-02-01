import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Home, Building, FileText, CreditCard, Shield, Users,
  BarChart3, Settings, LogOut, Menu, X, Bell, Phone
} from 'lucide-react';
import { useState } from 'react';
import useAuthStore from '../store/authStore';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Check roles directly from user object
  const userRole = user?.role || '';
  const isGRA = ['GRA_OFFICER', 'GRA_SUPERVISOR'].includes(userRole);
  const isAdmin = ['ADMIN', 'SYSTEM_ADMIN'].includes(userRole);
  const isInspector = userRole === 'INSPECTOR';

  const getNavItems = () => {
    const items = [
      { to: '/dashboard', icon: Home, label: 'Dashboard' }
    ];

    // GRA Officers, Supervisors, and Admins see full menu
    if (isGRA || isAdmin) {
      items.push(
        { to: '/properties', icon: Building, label: 'Properties' },
        { to: '/contracts', icon: FileText, label: 'Contracts' },
        { to: '/payments', icon: CreditCard, label: 'Payments' },
        { to: '/tax-certificates', icon: Shield, label: 'Tax Certificates' },
        { to: '/cases', icon: Shield, label: 'Cases' },
        { to: '/reports', icon: BarChart3, label: 'Reports' }
      );
    }

    // Inspectors see their cases
    if (isInspector) {
      items.push(
        { to: '/cases', icon: Shield, label: 'My Cases' },
        { to: '/properties', icon: Building, label: 'Properties' }
      );
    }

    items.push(
      { to: '/ussd', icon: Phone, label: 'USSD Simulator' },
      { to: '/settings', icon: Settings, label: 'Settings' }
    );

    return items;
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-white shadow-lg transform transition-transform duration-300
        lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b">
          <Link to="/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-ghana-green rounded-lg flex items-center justify-center">
              <Building className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">GhanaRent</span>
          </Link>
          <button
            className="lg:hidden p-2"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`
                  flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors
                  ${isActive
                    ? 'bg-ghana-green text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-gray-50">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-ghana-gold rounded-full flex items-center justify-center">
              <span className="font-bold text-ghana-green">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 text-gray-600 hover:text-ghana-red w-full px-2 py-1"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top bar */}
        <header className="bg-white shadow-sm sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              className="lg:hidden p-2"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex items-center space-x-4 ml-auto">
              <button className="p-2 hover:bg-gray-100 rounded-full relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-ghana-red rounded-full" />
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
