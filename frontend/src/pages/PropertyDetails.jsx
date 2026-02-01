import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Edit, MapPin, Home, Bed, Bath, Square, Calendar,
  CheckCircle, XCircle, AlertCircle, Car, Shield, Zap, Sofa
} from 'lucide-react';
import toast from 'react-hot-toast';
import { propertyAPI } from '../services/api';
import useAuthStore from '../store/authStore';

const PropertyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isLandlord } = useAuthStore();

  useEffect(() => {
    loadProperty();
  }, [id]);

  const loadProperty = async () => {
    try {
      const response = await propertyAPI.getById(id);
      setProperty(response.data.data);
    } catch (error) {
      toast.error('Failed to load property');
      navigate('/properties');
    } finally {
      setLoading(false);
    }
  };

  const requestVerification = async () => {
    try {
      await propertyAPI.requestVerification(id);
      toast.success('Verification requested successfully');
      loadProperty();
    } catch (error) {
      toast.error('Failed to request verification');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'VERIFIED': { class: 'badge-success', icon: CheckCircle },
      'PENDING_VERIFICATION': { class: 'badge-warning', icon: AlertCircle },
      'REJECTED': { class: 'badge-danger', icon: XCircle },
      'SUSPENDED': { class: 'badge-danger', icon: XCircle }
    };
    return badges[status] || { class: 'badge-info', icon: AlertCircle };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ghana-green" />
      </div>
    );
  }

  if (!property) {
    return null;
  }

  const statusInfo = getStatusBadge(property.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">{property.propertyCode}</h1>
            <p className="text-gray-500">{property.digitalAddress}</p>
          </div>
        </div>
        {isLandlord() && property.status !== 'VERIFIED' && (
          <div className="flex items-center space-x-3">
            <Link to={`/properties/${id}/edit`} className="btn btn-secondary flex items-center space-x-2">
              <Edit className="w-4 h-4" />
              <span>Edit</span>
            </Link>
            {property.status === 'PENDING_VERIFICATION' ? (
              <span className="badge badge-warning">Verification Pending</span>
            ) : (
              <button onClick={requestVerification} className="btn btn-primary">
                Request Verification
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Property Images */}
          <div className="card">
            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
              {property.photos && property.photos.length > 0 ? (
                <img
                  src={property.photos[0]}
                  alt={property.propertyCode}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <Home className="w-16 h-16 text-gray-300" />
              )}
            </div>
          </div>

          {/* Details */}
          <div className="card">
            <h2 className="text-lg font-bold mb-4">Property Details</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Home className="w-6 h-6 mx-auto mb-2 text-ghana-green" />
                <p className="text-sm text-gray-500">Type</p>
                <p className="font-medium">{property.propertyTypeName}</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Bed className="w-6 h-6 mx-auto mb-2 text-ghana-green" />
                <p className="text-sm text-gray-500">Bedrooms</p>
                <p className="font-medium">{property.bedrooms || 'N/A'}</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Bath className="w-6 h-6 mx-auto mb-2 text-ghana-green" />
                <p className="text-sm text-gray-500">Bathrooms</p>
                <p className="font-medium">{property.bathrooms || 'N/A'}</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Square className="w-6 h-6 mx-auto mb-2 text-ghana-green" />
                <p className="text-sm text-gray-500">Area</p>
                <p className="font-medium">{property.floorAreaSqm ? `${property.floorAreaSqm} sqm` : 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="card">
            <h2 className="text-lg font-bold mb-4">Features & Amenities</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className={`flex items-center space-x-2 p-3 rounded-lg ${property.isFurnished ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-400'}`}>
                <Sofa className="w-5 h-5" />
                <span>Furnished</span>
              </div>
              <div className={`flex items-center space-x-2 p-3 rounded-lg ${property.hasParking ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-400'}`}>
                <Car className="w-5 h-5" />
                <span>Parking</span>
              </div>
              <div className={`flex items-center space-x-2 p-3 rounded-lg ${property.hasSecurity ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-400'}`}>
                <Shield className="w-5 h-5" />
                <span>Security</span>
              </div>
              <div className={`flex items-center space-x-2 p-3 rounded-lg ${property.hasGenerator ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-400'}`}>
                <Zap className="w-5 h-5" />
                <span>Generator</span>
              </div>
            </div>
            {property.amenities && property.amenities.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-500 mb-2">Other Amenities</p>
                <div className="flex flex-wrap gap-2">
                  {property.amenities.map((amenity, index) => (
                    <span key={index} className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="card">
            <h2 className="text-lg font-bold mb-4">Status</h2>
            <div className={`flex items-center space-x-2 p-3 rounded-lg ${statusInfo.class.replace('badge-', 'bg-').replace('success', 'green-100').replace('warning', 'yellow-100').replace('danger', 'red-100').replace('info', 'blue-100')}`}>
              <StatusIcon className="w-5 h-5" />
              <span className="font-medium">{property.status.replace(/_/g, ' ')}</span>
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Availability</span>
                <span className={property.isAvailable ? 'text-green-600' : 'text-red-600'}>
                  {property.isAvailable ? 'Available' : 'Not Available'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Ownership Verified</span>
                <span className={property.ownershipVerified ? 'text-green-600' : 'text-gray-400'}>
                  {property.ownershipVerified ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>

          {/* Location Card */}
          <div className="card">
            <h2 className="text-lg font-bold mb-4">Location</h2>
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium">{property.neighborhood}</p>
                  <p className="text-sm text-gray-500">{property.district}, {property.region}</p>
                  {property.streetAddress && (
                    <p className="text-sm text-gray-500">{property.streetAddress}</p>
                  )}
                </div>
              </div>
              <div className="text-sm text-gray-500">
                <span className="font-medium">Digital Address:</span> {property.digitalAddress}
              </div>
            </div>
          </div>

          {/* Ownership Card */}
          <div className="card">
            <h2 className="text-lg font-bold mb-4">Ownership</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Type</span>
                <span className="font-medium">{property.ownershipType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Category</span>
                <span className="font-medium">{property.propertyCategory}</span>
              </div>
              {property.yearBuilt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Year Built</span>
                  <span className="font-medium">{property.yearBuilt}</span>
                </div>
              )}
            </div>
          </div>

          {/* Landlord Info */}
          {property.landlord && (
            <div className="card">
              <h2 className="text-lg font-bold mb-4">Landlord</h2>
              <div className="space-y-2 text-sm">
                <p className="font-medium">{property.landlord.name}</p>
                <p className="text-gray-500">{property.landlord.phone}</p>
                <p className="text-gray-500">{property.landlord.email}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          {isLandlord() && (
            <div className="card">
              <h2 className="text-lg font-bold mb-4">Actions</h2>
              <div className="space-y-2">
                <Link
                  to={`/contracts/new?propertyId=${id}`}
                  className="btn btn-primary w-full"
                >
                  Create Contract
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyDetails;
