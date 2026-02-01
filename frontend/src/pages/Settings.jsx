import { useState } from 'react';
import { User, Bell, Lock, Globe, Save, Phone, Mail, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { userAPI } from '../services/api';
import useAuthStore from '../store/authStore';

const Settings = () => {
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    otherNames: user?.otherNames || '',
    phone: user?.phone || '',
    email: user?.email || '',
    dateOfBirth: user?.dateOfBirth || '',
    gender: user?.gender || '',
    digitalAddress: user?.digitalAddress || '',
    region: user?.region || '',
    district: user?.district || '',
    city: user?.city || '',
    streetAddress: user?.streetAddress || ''
  });

  const [notificationPrefs, setNotificationPrefs] = useState({
    sms: true,
    email: true,
    push: true,
    paymentReminders: true,
    contractUpdates: true,
    marketAlerts: false
  });

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleNotificationChange = (e) => {
    const { name, checked } = e.target;
    setNotificationPrefs(prev => ({ ...prev, [name]: checked }));
  };

  const saveProfile = async () => {
    setLoading(true);
    try {
      const response = await userAPI.updateProfile(profileData);
      setUser({ ...user, ...response.data.data });
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const saveNotifications = async () => {
    setLoading(true);
    try {
      await userAPI.updateProfile({ notificationPreferences: notificationPrefs });
      toast.success('Notification preferences updated');
    } catch (error) {
      toast.error('Failed to update preferences');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'preferences', label: 'Preferences', icon: Globe }
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg flex-1 justify-center transition-colors ${
                activeTab === tab.id
                  ? 'bg-white shadow text-ghana-green'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-lg font-bold mb-4">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={profileData.firstName}
                  onChange={handleProfileChange}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={profileData.lastName}
                  onChange={handleProfileChange}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Other Names
                </label>
                <input
                  type="text"
                  name="otherNames"
                  value={profileData.otherNames}
                  onChange={handleProfileChange}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender
                </label>
                <select
                  name="gender"
                  value={profileData.gender}
                  onChange={handleProfileChange}
                  className="input"
                >
                  <option value="">Select</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={profileData.dateOfBirth}
                  onChange={handleProfileChange}
                  className="input"
                />
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-bold mb-4">Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={profileData.phone}
                  onChange={handleProfileChange}
                  className="input"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">Phone cannot be changed</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={profileData.email}
                  onChange={handleProfileChange}
                  className="input"
                />
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-bold mb-4">
              <MapPin className="w-5 h-5 inline mr-2" />
              Address
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Digital Address
                </label>
                <input
                  type="text"
                  name="digitalAddress"
                  value={profileData.digitalAddress}
                  onChange={handleProfileChange}
                  placeholder="e.g., GA-123-4567"
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Region
                </label>
                <input
                  type="text"
                  name="region"
                  value={profileData.region}
                  onChange={handleProfileChange}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  District
                </label>
                <input
                  type="text"
                  name="district"
                  value={profileData.district}
                  onChange={handleProfileChange}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={profileData.city}
                  onChange={handleProfileChange}
                  className="input"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Street Address
                </label>
                <input
                  type="text"
                  name="streetAddress"
                  value={profileData.streetAddress}
                  onChange={handleProfileChange}
                  className="input"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={saveProfile}
              disabled={loading}
              className="btn btn-primary flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-lg font-bold mb-4">Notification Channels</h2>
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-medium">SMS Notifications</p>
                  <p className="text-sm text-gray-500">Receive alerts via text message</p>
                </div>
                <input
                  type="checkbox"
                  name="sms"
                  checked={notificationPrefs.sms}
                  onChange={handleNotificationChange}
                  className="w-5 h-5 text-ghana-green rounded"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-gray-500">Receive alerts via email</p>
                </div>
                <input
                  type="checkbox"
                  name="email"
                  checked={notificationPrefs.email}
                  onChange={handleNotificationChange}
                  className="w-5 h-5 text-ghana-green rounded"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-sm text-gray-500">Receive in-app push notifications</p>
                </div>
                <input
                  type="checkbox"
                  name="push"
                  checked={notificationPrefs.push}
                  onChange={handleNotificationChange}
                  className="w-5 h-5 text-ghana-green rounded"
                />
              </label>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-bold mb-4">Notification Types</h2>
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-medium">Payment Reminders</p>
                  <p className="text-sm text-gray-500">Get reminded about upcoming payments</p>
                </div>
                <input
                  type="checkbox"
                  name="paymentReminders"
                  checked={notificationPrefs.paymentReminders}
                  onChange={handleNotificationChange}
                  className="w-5 h-5 text-ghana-green rounded"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-medium">Contract Updates</p>
                  <p className="text-sm text-gray-500">Notifications about contract changes</p>
                </div>
                <input
                  type="checkbox"
                  name="contractUpdates"
                  checked={notificationPrefs.contractUpdates}
                  onChange={handleNotificationChange}
                  className="w-5 h-5 text-ghana-green rounded"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-medium">Market Alerts</p>
                  <p className="text-sm text-gray-500">Updates about rental market trends</p>
                </div>
                <input
                  type="checkbox"
                  name="marketAlerts"
                  checked={notificationPrefs.marketAlerts}
                  onChange={handleNotificationChange}
                  className="w-5 h-5 text-ghana-green rounded"
                />
              </label>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={saveNotifications}
              disabled={loading}
              className="btn btn-primary flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Save Preferences'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-lg font-bold mb-4">Change Password</h2>
            <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <input type="password" className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input type="password" className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input type="password" className="input" />
              </div>
              <button className="btn btn-primary">Update Password</button>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-bold mb-4">Identity Verification</h2>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Ghana Card Verification</p>
                <p className="text-sm text-gray-500">
                  {user?.ghanaCardNumber ? `Verified: ${user.ghanaCardNumber}` : 'Not verified'}
                </p>
              </div>
              <span className={`badge ${user?.ghanaCardNumber ? 'badge-success' : 'badge-warning'}`}>
                {user?.ghanaCardNumber ? 'Verified' : 'Pending'}
              </span>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-bold mb-4">Active Sessions</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Current Device</p>
                  <p className="text-sm text-gray-500">Web Browser - Accra, Ghana</p>
                </div>
                <span className="badge badge-success">Active</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-lg font-bold mb-4">Language & Region</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Language
                </label>
                <select className="input">
                  <option value="en">English</option>
                  <option value="tw">Twi</option>
                  <option value="ga">Ga</option>
                  <option value="ee">Ewe</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Currency
                </label>
                <select className="input" disabled>
                  <option value="GHS">Ghana Cedi (GHS)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-bold mb-4">Display</h2>
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-medium">Dark Mode</p>
                  <p className="text-sm text-gray-500">Use dark theme (coming soon)</p>
                </div>
                <input
                  type="checkbox"
                  disabled
                  className="w-5 h-5 text-ghana-green rounded opacity-50"
                />
              </label>
            </div>
          </div>

          <div className="card bg-red-50 border-red-200">
            <h2 className="text-lg font-bold mb-4 text-red-800">Danger Zone</h2>
            <p className="text-sm text-red-700 mb-4">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <button className="btn bg-red-600 text-white hover:bg-red-700">
              Delete Account
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
