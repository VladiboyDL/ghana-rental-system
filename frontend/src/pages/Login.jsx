import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building, Eye, EyeOff, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }

    const result = await login(email, password);

    if (result.success) {
      toast.success('Login successful!');
      navigate('/dashboard');
    } else {
      toast.error(result.error);
    }
  };

  // Only show demo logins for web-allowed roles (GRA, Inspector, Admin)
  const demoLogins = [
    { label: 'GRA Officer', email: 'gra@demo.gh', password: 'demo123' },
    { label: 'Inspector', email: 'inspector@demo.gh', password: 'demo123' },
    { label: 'Supervisor', email: 'supervisor@demo.gh', password: 'demo123' },
    { label: 'Admin', email: 'admin@demo.gh', password: 'admin123' }
  ];

  const handleDemoLogin = (demo) => {
    setEmail(demo.email);
    setPassword(demo.password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ghana-green to-green-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-xl shadow-lg mb-4">
            <Building className="w-8 h-8 text-ghana-green" />
          </div>
          <h1 className="text-2xl font-bold text-white">Ghana Rental System</h1>
          <p className="text-green-200 mt-1">GRA Administration Portal</p>
        </div>

        {/* Mobile App Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <Smartphone className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">For Landlords & Tenants</h3>
              <p className="text-sm text-yellow-700 mt-1">
                Please use the Ghana Rental Tax mobile app available on iOS and Android to manage your properties, contracts, and payments.
              </p>
            </div>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-xl shadow-xl p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Staff Sign In</h2>
          <p className="text-sm text-gray-500 mb-6">
            For GRA Officers, Inspectors, and Administrators only
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="text"
                className="input"
                placeholder="Enter your GRA email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                Remember me
              </label>
              <Link to="/forgot-password" className="text-ghana-green hover:underline">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Demo Logins */}
          <div className="mt-6 pt-6 border-t">
            <p className="text-sm text-gray-500 text-center mb-3">Quick Demo Login</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {demoLogins.map((demo) => (
                <button
                  key={demo.label}
                  type="button"
                  className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full"
                  onClick={() => handleDemoLogin(demo)}
                >
                  {demo.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Public Links */}
        <div className="mt-6 text-center space-x-4 text-sm">
          <Link to="/market" className="text-green-200 hover:text-white">
            Market Rent Checker
          </Link>
          <span className="text-green-400">|</span>
          <Link to="/verify" className="text-green-200 hover:text-white">
            Verify Certificate
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
