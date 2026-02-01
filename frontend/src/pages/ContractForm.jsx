import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { contractAPI, propertyAPI, userAPI } from '../services/api';

const CONTRACT_TYPES = [
  { value: 'RESIDENTIAL', label: 'Residential' },
  { value: 'COMMERCIAL', label: 'Commercial' },
  { value: 'SHORT_TERM', label: 'Short Term' }
];

const PAYMENT_FREQUENCIES = [
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'BIANNUAL', label: 'Bi-Annual' },
  { value: 'ANNUAL', label: 'Annual' }
];

const ContractForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedPropertyId = searchParams.get('propertyId');

  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [searchTenant, setSearchTenant] = useState('');
  const [formData, setFormData] = useState({
    propertyId: preselectedPropertyId || '',
    tenantId: '',
    contractType: 'RESIDENTIAL',
    startDate: '',
    endDate: '',
    monthlyRent: '',
    securityDeposit: '',
    serviceCharge: '',
    advanceMonths: '2',
    paymentFrequency: 'MONTHLY'
  });

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      const response = await propertyAPI.getAll({ status: 'VERIFIED' });
      setProperties(response.data.data || []);
    } catch (error) {
      console.error('Failed to load properties');
    }
  };

  const searchTenants = async () => {
    if (!searchTenant.trim()) return;
    try {
      const response = await userAPI.getTenants({ search: searchTenant });
      setTenants(response.data.data || []);
    } catch (error) {
      toast.error('Failed to search tenants');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.propertyId) {
      toast.error('Please select a property');
      return;
    }
    if (!formData.tenantId) {
      toast.error('Please select a tenant');
      return;
    }

    setLoading(true);

    try {
      const data = {
        ...formData,
        monthlyRent: parseFloat(formData.monthlyRent),
        securityDeposit: parseFloat(formData.securityDeposit) || 0,
        serviceCharge: parseFloat(formData.serviceCharge) || 0,
        advanceMonths: parseInt(formData.advanceMonths)
      };

      await contractAPI.create(data);
      toast.success('Contract created successfully! Confirmation code sent to tenant.');
      navigate('/contracts');
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to create contract');
    } finally {
      setLoading(false);
    }
  };

  const selectedProperty = properties.find(p => p.id === formData.propertyId);
  const selectedTenant = tenants.find(t => t.id === formData.tenantId);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center space-x-4 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold">Create New Contract</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Property Selection */}
        <div className="card">
          <h2 className="text-lg font-bold mb-4">Select Property</h2>
          <select
            name="propertyId"
            value={formData.propertyId}
            onChange={handleChange}
            className="input"
            required
          >
            <option value="">Select a property</option>
            {properties.map(property => (
              <option key={property.id} value={property.id}>
                {property.propertyCode} - {property.propertyTypeName} in {property.neighborhood}
              </option>
            ))}
          </select>
          {selectedProperty && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="font-medium">{selectedProperty.propertyTypeName}</p>
              <p className="text-sm text-gray-500">{selectedProperty.digitalAddress}</p>
              <p className="text-sm text-gray-500">
                {selectedProperty.neighborhood}, {selectedProperty.district}
              </p>
            </div>
          )}
        </div>

        {/* Tenant Selection */}
        <div className="card">
          <h2 className="text-lg font-bold mb-4">Select Tenant</h2>
          <div className="flex space-x-2">
            <input
              type="text"
              value={searchTenant}
              onChange={(e) => setSearchTenant(e.target.value)}
              placeholder="Search by name, email, or phone"
              className="input flex-1"
            />
            <button
              type="button"
              onClick={searchTenants}
              className="btn btn-secondary flex items-center space-x-2"
            >
              <Search className="w-4 h-4" />
              <span>Search</span>
            </button>
          </div>
          {tenants.length > 0 && (
            <div className="mt-4 space-y-2">
              {tenants.map(tenant => (
                <label
                  key={tenant.id}
                  className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                    formData.tenantId === tenant.id
                      ? 'border-ghana-green bg-green-50'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="tenantId"
                    value={tenant.id}
                    checked={formData.tenantId === tenant.id}
                    onChange={handleChange}
                    className="mr-3"
                  />
                  <div>
                    <p className="font-medium">{tenant.firstName} {tenant.lastName}</p>
                    <p className="text-sm text-gray-500">{tenant.phone} • {tenant.email}</p>
                  </div>
                </label>
              ))}
            </div>
          )}
          {selectedTenant && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                Selected: <strong>{selectedTenant.firstName} {selectedTenant.lastName}</strong>
              </p>
            </div>
          )}
        </div>

        {/* Contract Terms */}
        <div className="card">
          <h2 className="text-lg font-bold mb-4">Contract Terms</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contract Type *
              </label>
              <select
                name="contractType"
                value={formData.contractType}
                onChange={handleChange}
                className="input"
                required
              >
                {CONTRACT_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Frequency *
              </label>
              <select
                name="paymentFrequency"
                value={formData.paymentFrequency}
                onChange={handleChange}
                className="input"
                required
              >
                {PAYMENT_FREQUENCIES.map(freq => (
                  <option key={freq.value} value={freq.value}>{freq.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date *
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Advance Months *
              </label>
              <input
                type="number"
                name="advanceMonths"
                value={formData.advanceMonths}
                onChange={handleChange}
                min="1"
                max="24"
                className="input"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Number of months paid in advance</p>
            </div>
          </div>
        </div>

        {/* Financial Terms */}
        <div className="card">
          <h2 className="text-lg font-bold mb-4">Financial Terms</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monthly Rent (GHS) *
              </label>
              <input
                type="number"
                name="monthlyRent"
                value={formData.monthlyRent}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Security Deposit (GHS)
              </label>
              <input
                type="number"
                name="securityDeposit"
                value={formData.securityDeposit}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monthly Service Charge (GHS)
              </label>
              <input
                type="number"
                name="serviceCharge"
                value={formData.serviceCharge}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="input"
              />
            </div>
          </div>

          {/* Tax Info */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-medium text-yellow-800 mb-2">Tax Information</h3>
            <p className="text-sm text-yellow-700">
              An 8% withholding tax will be automatically deducted from each rent payment.
              This tax is remitted directly to the Ghana Revenue Authority (GRA).
            </p>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Creating...' : 'Create Contract'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ContractForm;
