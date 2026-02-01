import { useState } from 'react';
import { Search, TrendingUp, MapPin, Home, DollarSign, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';
import { marketAPI } from '../services/api';

const PROPERTY_TYPES = [
  { value: 'APARTMENT', label: 'Apartment' },
  { value: 'HOUSE', label: 'House' },
  { value: 'TOWNHOUSE', label: 'Townhouse' },
  { value: 'STUDIO', label: 'Studio' },
  { value: 'ROOM', label: 'Single Room' },
  { value: 'OFFICE', label: 'Office Space' },
  { value: 'SHOP', label: 'Shop/Retail' }
];

const REGIONS = [
  'Greater Accra', 'Ashanti', 'Western', 'Central', 'Eastern',
  'Northern', 'Volta', 'Upper East', 'Upper West', 'Brong Ahafo'
];

const MarketRent = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [formData, setFormData] = useState({
    region: 'Greater Accra',
    district: '',
    neighborhood: '',
    propertyType: 'APARTMENT',
    bedrooms: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!formData.district) {
      toast.error('Please enter a district');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const params = {
        region: formData.region,
        district: formData.district,
        propertyType: formData.propertyType,
        ...(formData.neighborhood && { neighborhood: formData.neighborhood }),
        ...(formData.bedrooms && { bedrooms: parseInt(formData.bedrooms) })
      };

      const response = await marketAPI.getRentCheck(params);
      setResult(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch market rent data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `GHS ${amount?.toLocaleString() || 0}`;
  };

  const getRentAssessment = (currentRent, marketAvg) => {
    if (!currentRent || !marketAvg) return null;
    const ratio = currentRent / marketAvg;
    if (ratio < 0.8) return { label: 'Below Market', color: 'green', description: 'This rent is below market average' };
    if (ratio > 1.2) return { label: 'Above Market', color: 'red', description: 'This rent is above market average' };
    return { label: 'At Market', color: 'blue', description: 'This rent is at market rate' };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-ghana-green text-white py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Market Rent Checker
            </h1>
            <p className="text-lg opacity-90">
              Find out the average rental prices in your area. Make informed decisions
              about renting or pricing your property.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Search Form */}
          <div className="card -mt-8 relative z-10 shadow-lg">
            <form onSubmit={handleSearch}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Region *
                  </label>
                  <select
                    name="region"
                    value={formData.region}
                    onChange={handleChange}
                    className="input"
                    required
                  >
                    {REGIONS.map(region => (
                      <option key={region} value={region}>{region}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    District *
                  </label>
                  <input
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    placeholder="e.g., Accra Metropolitan"
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Neighborhood
                  </label>
                  <input
                    type="text"
                    name="neighborhood"
                    value={formData.neighborhood}
                    onChange={handleChange}
                    placeholder="e.g., East Legon"
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Property Type *
                  </label>
                  <select
                    name="propertyType"
                    value={formData.propertyType}
                    onChange={handleChange}
                    className="input"
                    required
                  >
                    {PROPERTY_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bedrooms
                  </label>
                  <input
                    type="number"
                    name="bedrooms"
                    value={formData.bedrooms}
                    onChange={handleChange}
                    placeholder="Any"
                    min="0"
                    className="input"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary w-full flex items-center justify-center space-x-2"
                  >
                    <Search className="w-4 h-4" />
                    <span>{loading ? 'Searching...' : 'Search'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Results */}
          {result && (
            <div className="mt-8 space-y-6">
              {/* Location Summary */}
              <div className="card">
                <div className="flex items-center space-x-3 mb-4">
                  <MapPin className="w-6 h-6 text-ghana-green" />
                  <div>
                    <h2 className="text-xl font-bold">
                      {result.neighborhood || result.district}, {result.region}
                    </h2>
                    <p className="text-gray-500">
                      {result.propertyType} • {result.bedrooms ? `${result.bedrooms} bedrooms` : 'All sizes'}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-500">
                  Based on {result.sampleSize} properties in this area
                </p>
              </div>

              {/* Price Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card text-center">
                  <DollarSign className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Minimum</p>
                  <p className="text-2xl font-bold">{formatCurrency(result.minRent)}</p>
                  <p className="text-xs text-gray-400">per month</p>
                </div>
                <div className="card text-center bg-ghana-green text-white">
                  <TrendingUp className="w-8 h-8 mx-auto opacity-50 mb-2" />
                  <p className="text-sm opacity-80">Average</p>
                  <p className="text-3xl font-bold">{formatCurrency(result.averageRent)}</p>
                  <p className="text-xs opacity-80">per month</p>
                </div>
                <div className="card text-center">
                  <DollarSign className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Maximum</p>
                  <p className="text-2xl font-bold">{formatCurrency(result.maxRent)}</p>
                  <p className="text-xs text-gray-400">per month</p>
                </div>
              </div>

              {/* Detailed Stats */}
              <div className="card">
                <h3 className="font-bold mb-4 flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Price Distribution
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Median Rent</span>
                    <span className="font-bold">{formatCurrency(result.medianRent)}</span>
                  </div>
                  {result.percentile10 && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">10th Percentile (Budget)</span>
                      <span className="font-medium">{formatCurrency(result.percentile10)}</span>
                    </div>
                  )}
                  {result.percentile90 && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">90th Percentile (Premium)</span>
                      <span className="font-medium">{formatCurrency(result.percentile90)}</span>
                    </div>
                  )}
                </div>

                {/* Visual Range */}
                <div className="mt-6">
                  <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="absolute h-full bg-gradient-to-r from-green-400 via-ghana-green to-red-400"
                      style={{
                        left: `${(result.minRent / result.maxRent) * 100}%`,
                        right: '0%'
                      }}
                    />
                    <div
                      className="absolute h-full w-1 bg-white border-2 border-ghana-green"
                      style={{
                        left: `${(result.averageRent / result.maxRent) * 100}%`
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{formatCurrency(result.minRent)}</span>
                    <span>Average: {formatCurrency(result.averageRent)}</span>
                    <span>{formatCurrency(result.maxRent)}</span>
                  </div>
                </div>
              </div>

              {/* Tips */}
              <div className="card bg-blue-50 border-blue-200">
                <h3 className="font-bold text-blue-800 mb-2">Tips for Renters</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Rents below {formatCurrency(result.minRent * 1.1)} are considered budget-friendly for this area</li>
                  <li>• The median rent of {formatCurrency(result.medianRent)} represents the middle of the market</li>
                  <li>• Premium properties can command up to {formatCurrency(result.maxRent)} or more</li>
                  <li>• Always verify property ownership before signing a contract</li>
                </ul>
              </div>
            </div>
          )}

          {/* Info Section */}
          {!result && !loading && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card text-center">
                <Search className="w-10 h-10 mx-auto text-ghana-green mb-3" />
                <h3 className="font-bold mb-2">Search by Location</h3>
                <p className="text-sm text-gray-500">
                  Enter your preferred region, district, and neighborhood to find market rates.
                </p>
              </div>
              <div className="card text-center">
                <Home className="w-10 h-10 mx-auto text-ghana-green mb-3" />
                <h3 className="font-bold mb-2">Compare Properties</h3>
                <p className="text-sm text-gray-500">
                  See how different property types and sizes affect rental prices.
                </p>
              </div>
              <div className="card text-center">
                <TrendingUp className="w-10 h-10 mx-auto text-ghana-green mb-3" />
                <h3 className="font-bold mb-2">Make Informed Decisions</h3>
                <p className="text-sm text-gray-500">
                  Use market data to negotiate fair rental prices.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarketRent;
