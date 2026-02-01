import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { propertyAPI } from '../services/api';

const PROPERTY_TYPES = [
  { value: 'APARTMENT', label: 'Apartment' },
  { value: 'HOUSE', label: 'House' },
  { value: 'TOWNHOUSE', label: 'Townhouse' },
  { value: 'STUDIO', label: 'Studio' },
  { value: 'ROOM', label: 'Single Room' },
  { value: 'OFFICE', label: 'Office Space' },
  { value: 'SHOP', label: 'Shop/Retail' },
  { value: 'WAREHOUSE', label: 'Warehouse' },
  { value: 'LAND', label: 'Land' }
];

const PROPERTY_CATEGORIES = [
  { value: 'RESIDENTIAL', label: 'Residential' },
  { value: 'COMMERCIAL', label: 'Commercial' },
  { value: 'INDUSTRIAL', label: 'Industrial' },
  { value: 'MIXED_USE', label: 'Mixed Use' }
];

const OWNERSHIP_TYPES = [
  { value: 'FREEHOLD', label: 'Freehold' },
  { value: 'LEASEHOLD', label: 'Leasehold' },
  { value: 'FAMILY_LAND', label: 'Family Land' },
  { value: 'STATE_LAND', label: 'State Land' }
];

const REGIONS = [
  'Greater Accra', 'Ashanti', 'Western', 'Central', 'Eastern',
  'Northern', 'Volta', 'Upper East', 'Upper West', 'Brong Ahafo',
  'Western North', 'Ahafo', 'Bono East', 'Oti', 'North East', 'Savannah'
];

const PropertyForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    digitalAddress: '',
    region: '',
    district: '',
    city: '',
    neighborhood: '',
    streetAddress: '',
    propertyType: 'APARTMENT',
    propertyCategory: 'RESIDENTIAL',
    bedrooms: '',
    bathrooms: '',
    floorAreaSqm: '',
    yearBuilt: '',
    isFurnished: false,
    hasParking: false,
    hasSecurity: false,
    hasGenerator: false,
    amenities: [],
    ownershipType: 'FREEHOLD'
  });

  useEffect(() => {
    if (isEditing) {
      loadProperty();
    }
  }, [id]);

  const loadProperty = async () => {
    try {
      const response = await propertyAPI.getById(id);
      const property = response.data.data;
      setFormData({
        digitalAddress: property.digitalAddress || '',
        region: property.region || '',
        district: property.district || '',
        city: property.city || '',
        neighborhood: property.neighborhood || '',
        streetAddress: property.streetAddress || '',
        propertyType: property.propertyType || 'APARTMENT',
        propertyCategory: property.propertyCategory || 'RESIDENTIAL',
        bedrooms: property.bedrooms || '',
        bathrooms: property.bathrooms || '',
        floorAreaSqm: property.floorAreaSqm || '',
        yearBuilt: property.yearBuilt || '',
        isFurnished: property.isFurnished || false,
        hasParking: property.hasParking || false,
        hasSecurity: property.hasSecurity || false,
        hasGenerator: property.hasGenerator || false,
        amenities: property.amenities || [],
        ownershipType: property.ownershipType || 'FREEHOLD'
      });
    } catch (error) {
      toast.error('Failed to load property');
      navigate('/properties');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        ...formData,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null,
        floorAreaSqm: formData.floorAreaSqm ? parseFloat(formData.floorAreaSqm) : null,
        yearBuilt: formData.yearBuilt ? parseInt(formData.yearBuilt) : null
      };

      if (isEditing) {
        await propertyAPI.update(id, data);
        toast.success('Property updated successfully');
      } else {
        await propertyAPI.create(data);
        toast.success('Property created successfully');
      }
      navigate('/properties');
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to save property');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center space-x-4 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold">
          {isEditing ? 'Edit Property' : 'Add New Property'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Location Section */}
        <div className="card">
          <h2 className="text-lg font-bold mb-4 flex items-center">
            <MapPin className="w-5 h-5 mr-2" />
            Location
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Digital Address *
              </label>
              <input
                type="text"
                name="digitalAddress"
                value={formData.digitalAddress}
                onChange={handleChange}
                placeholder="e.g., GA-123-4567"
                className="input"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Ghana Post GPS digital address</p>
            </div>
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
                <option value="">Select Region</option>
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
                City
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="e.g., Accra"
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Neighborhood *
              </label>
              <input
                type="text"
                name="neighborhood"
                value={formData.neighborhood}
                onChange={handleChange}
                placeholder="e.g., East Legon"
                className="input"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Street Address
              </label>
              <input
                type="text"
                name="streetAddress"
                value={formData.streetAddress}
                onChange={handleChange}
                placeholder="e.g., 15 Palm Street"
                className="input"
              />
            </div>
          </div>
        </div>

        {/* Property Details Section */}
        <div className="card">
          <h2 className="text-lg font-bold mb-4">Property Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                Category *
              </label>
              <select
                name="propertyCategory"
                value={formData.propertyCategory}
                onChange={handleChange}
                className="input"
                required
              >
                {PROPERTY_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
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
                min="0"
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bathrooms
              </label>
              <input
                type="number"
                name="bathrooms"
                value={formData.bathrooms}
                onChange={handleChange}
                min="0"
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Floor Area (sqm)
              </label>
              <input
                type="number"
                name="floorAreaSqm"
                value={formData.floorAreaSqm}
                onChange={handleChange}
                min="0"
                step="0.1"
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year Built
              </label>
              <input
                type="number"
                name="yearBuilt"
                value={formData.yearBuilt}
                onChange={handleChange}
                min="1900"
                max={new Date().getFullYear()}
                className="input"
              />
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="card">
          <h2 className="text-lg font-bold mb-4">Features</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                name="isFurnished"
                checked={formData.isFurnished}
                onChange={handleChange}
                className="w-4 h-4 text-ghana-green rounded"
              />
              <span>Furnished</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                name="hasParking"
                checked={formData.hasParking}
                onChange={handleChange}
                className="w-4 h-4 text-ghana-green rounded"
              />
              <span>Parking</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                name="hasSecurity"
                checked={formData.hasSecurity}
                onChange={handleChange}
                className="w-4 h-4 text-ghana-green rounded"
              />
              <span>Security</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                name="hasGenerator"
                checked={formData.hasGenerator}
                onChange={handleChange}
                className="w-4 h-4 text-ghana-green rounded"
              />
              <span>Generator</span>
            </label>
          </div>
        </div>

        {/* Ownership Section */}
        <div className="card">
          <h2 className="text-lg font-bold mb-4">Ownership</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ownership Type *
            </label>
            <select
              name="ownershipType"
              value={formData.ownershipType}
              onChange={handleChange}
              className="input"
              required
            >
              {OWNERSHIP_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
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
            <span>{loading ? 'Saving...' : (isEditing ? 'Update Property' : 'Add Property')}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default PropertyForm;
