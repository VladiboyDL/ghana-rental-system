import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

const Register = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: 'TENANT_INDIVIDUAL',
    ghanaCardNumber: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const { register, verifyOTP, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleStep1 = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    const result = await register({
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
      firstName: formData.firstName,
      lastName: formData.lastName,
      role: formData.role
    });

    if (result.success) {
      toast.success('OTP sent to your phone!');
      setStep(2);
    } else {
      toast.error(result.error);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    const result = await verifyOTP(formData.phone, otp);

    if (result.success) {
      toast.success('Registration successful!');
      navigate('/dashboard');
    } else {
      toast.error(result.error);
    }
  };

  const roles = [
    { value: 'TENANT_INDIVIDUAL', label: 'Individual Tenant' },
    { value: 'TENANT_CORPORATE', label: 'Corporate Tenant' },
    { value: 'LANDLORD_INDIVIDUAL', label: 'Individual Landlord' },
    { value: 'LANDLORD_CORPORATE', label: 'Corporate Landlord' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-ghana-green to-green-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-xl shadow-lg mb-4">
            <Building className="w-8 h-8 text-ghana-green" />
          </div>
          <h1 className="text-2xl font-bold text-white">Ghana Rental System</h1>
          <p className="text-green-200 mt-1">Create Your Account</p>
        </div>

        {/* Registration Card */}
        <div className="bg-white rounded-xl shadow-xl p-6">
          {step === 1 ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">Register</h2>
                <span className="text-sm text-gray-500">Step 1 of 2</span>
              </div>

              <form onSubmit={handleStep1} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      className="input"
                      placeholder="First name"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      className="input"
                      placeholder="Last name"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Email</label>
                  <input
                    type="email"
                    name="email"
                    className="input"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label className="label">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    className="input"
                    placeholder="0241234567"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label className="label">I am a...</label>
                  <select
                    name="role"
                    className="input"
                    value={formData.role}
                    onChange={handleChange}
                  >
                    {roles.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      className="input pr-10"
                      placeholder="Create password"
                      value={formData.password}
                      onChange={handleChange}
                      required
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

                <div>
                  <label className="label">Confirm Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    className="input"
                    placeholder="Confirm password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-full"
                  disabled={isLoading}
                >
                  {isLoading ? 'Processing...' : 'Continue'}
                </button>
              </form>
            </>
          ) : (
            <>
              <button
                type="button"
                className="flex items-center text-gray-500 hover:text-gray-700 mb-4"
                onClick={() => setStep(1)}
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </button>

              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-800">Verify Phone</h2>
                <p className="text-gray-600 text-sm mt-1">
                  Enter the 6-digit code sent to {formData.phone}
                </p>
              </div>

              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div>
                  <label className="label">Verification Code</label>
                  <input
                    type="text"
                    className="input text-center text-2xl tracking-widest"
                    placeholder="000000"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-full"
                  disabled={isLoading || otp.length !== 6}
                >
                  {isLoading ? 'Verifying...' : 'Verify & Complete'}
                </button>

                <p className="text-center text-sm text-gray-500">
                  Didn't receive code?{' '}
                  <button type="button" className="text-ghana-green hover:underline">
                    Resend
                  </button>
                </p>
              </form>
            </>
          )}

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">Already have an account? </span>
            <Link to="/login" className="text-ghana-green font-medium hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
