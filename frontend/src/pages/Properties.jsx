import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Building, MapPin, Bed, Bath, Check, Clock, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { propertyAPI } from '../services/api';

const Properties = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', search: '' });

  useEffect(() => {
    loadProperties();
  }, [filter.status]);

  const loadProperties = async () => {
    try {
      const response = await propertyAPI.getAll({ status: filter.status || undefined });
      setProperties(response.data.data);
    } catch (error) {
      toast.error('Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'VERIFIED': 'badge-success',
      'PENDING_VERIFICATION': 'badge-warning',
      'REJECTED': 'badge-danger'
    };
    return badges[status] || 'badge-info';
  };

  const filteredProperties = properties.filter(p =>
    p.propertyCode?.toLowerCase().includes(filter.search.toLowerCase()) ||
    p.neighborhood?.toLowerCase().includes(filter.search.toLowerCase()) ||
    p.district?.toLowerCase().includes(filter.search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ghana-green" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Properties</h1>
        <Link to="/properties/new" className="btn btn-primary flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Add Property</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search properties..."
              className="input pl-10"
              value={filter.search}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
            />
          </div>
          <select
            className="input w-auto"
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
          >
            <option value="">All Status</option>
            <option value="VERIFIED">Verified</option>
            <option value="PENDING_VERIFICATION">Pending</option>
          </select>
        </div>
      </div>

      {/* Properties Grid */}
      {filteredProperties.length === 0 ? (
        <div className="card text-center py-12">
          <Building className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600">No properties found</h3>
          <p className="text-gray-400 mt-1">Add your first property to get started</p>
          <Link to="/properties/new" className="btn btn-primary mt-4 inline-flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Add Property</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProperties.map((property) => (
            <Link
              key={property.id}
              to={`/properties/${property.id}`}
              className="card hover:shadow-lg transition-shadow"
            >
              <div className="aspect-video bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                {property.photos?.length > 0 ? (
                  <img
                    src={property.photos[0]}
                    alt={property.propertyCode}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <Building className="w-12 h-12 text-gray-300" />
                )}
              </div>

              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold">{property.propertyTypeName}</h3>
                <span className={`badge ${getStatusBadge(property.status)}`}>
                  {property.status === 'VERIFIED' ? (
                    <><Check className="w-3 h-3 mr-1" /> Verified</>
                  ) : (
                    <><Clock className="w-3 h-3 mr-1" /> Pending</>
                  )}
                </span>
              </div>

              <p className="text-sm text-gray-500 mb-2">{property.propertyCode}</p>

              <div className="flex items-center text-sm text-gray-600 mb-3">
                <MapPin className="w-4 h-4 mr-1" />
                {property.neighborhood}, {property.district}
              </div>

              {property.bedrooms && (
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Bed className="w-4 h-4 mr-1" />
                    {property.bedrooms} Bed
                  </div>
                  <div className="flex items-center">
                    <Bath className="w-4 h-4 mr-1" />
                    {property.bathrooms} Bath
                  </div>
                  {property.isFurnished && (
                    <span className="badge badge-info">Furnished</span>
                  )}
                </div>
              )}

              <div className="mt-3 pt-3 border-t flex items-center justify-between text-sm">
                <span className={property.isAvailable ? 'text-green-600' : 'text-gray-400'}>
                  {property.isAvailable ? 'Available' : 'Occupied'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Properties;
