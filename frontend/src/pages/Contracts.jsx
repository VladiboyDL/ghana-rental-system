import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, FileText, Building, User, Calendar, DollarSign, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { contractAPI } from '../services/api';
import useAuthStore from '../store/authStore';

const Contracts = () => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const { isLandlord } = useAuthStore();

  useEffect(() => {
    loadContracts();
  }, [filter]);

  const loadContracts = async () => {
    try {
      const response = await contractAPI.getAll({ status: filter || undefined });
      setContracts(response.data.data);
    } catch (error) {
      toast.error('Failed to load contracts');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'ACTIVE': 'badge-success',
      'PENDING_TENANT_CONFIRMATION': 'badge-warning',
      'EXPIRED': 'badge-info',
      'TERMINATED': 'badge-danger',
      'DISPUTED': 'badge-danger',
      'DRAFT': 'badge-info'
    };
    return badges[status] || 'badge-info';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-GH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

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
        <h1 className="text-2xl font-bold">
          {isLandlord() ? 'My Contracts' : 'Rental Contracts'}
        </h1>
        {isLandlord() && (
          <Link to="/contracts/new" className="btn btn-primary flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>New Contract</span>
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === '' ? 'bg-ghana-green text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
            onClick={() => setFilter('')}
          >
            All
          </button>
          <button
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'ACTIVE' ? 'bg-ghana-green text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
            onClick={() => setFilter('ACTIVE')}
          >
            Active
          </button>
          <button
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'PENDING_TENANT_CONFIRMATION' ? 'bg-ghana-green text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
            onClick={() => setFilter('PENDING_TENANT_CONFIRMATION')}
          >
            Pending
          </button>
          <button
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'EXPIRED' ? 'bg-ghana-green text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
            onClick={() => setFilter('EXPIRED')}
          >
            Expired
          </button>
        </div>
      </div>

      {/* Contracts List */}
      {contracts.length === 0 ? (
        <div className="card text-center py-12">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600">No contracts found</h3>
          <p className="text-gray-400 mt-1">
            {isLandlord() ? 'Create your first rental contract' : 'No contracts to display'}
          </p>
          {isLandlord() && (
            <Link to="/contracts/new" className="btn btn-primary mt-4 inline-flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>New Contract</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {contracts.map((contract) => (
            <Link
              key={contract.id}
              to={`/contracts/${contract.id}`}
              className="card hover:shadow-lg transition-shadow block"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-bold text-lg">{contract.contractNumber}</h3>
                    <span className={`badge ${getStatusBadge(contract.status)}`}>
                      {contract.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center text-gray-600">
                      <Building className="w-4 h-4 mr-2 text-gray-400" />
                      <span>{contract.property?.propertyTypeName}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <User className="w-4 h-4 mr-2 text-gray-400" />
                      <span>{isLandlord() ? contract.tenant?.name : contract.landlord?.name}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      <span>{formatDate(contract.startDate)} - {formatDate(contract.endDate)}</span>
                    </div>
                    <div className="flex items-center font-medium">
                      <DollarSign className="w-4 h-4 mr-1 text-ghana-green" />
                      <span>GHS {contract.monthlyRent.toLocaleString()}/mo</span>
                    </div>
                  </div>
                </div>

                {contract.status === 'PENDING_TENANT_CONFIRMATION' && (
                  <div className="flex items-center text-yellow-600">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    <span className="text-sm font-medium">Awaiting confirmation</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm text-gray-500">
                <span>{contract.property?.neighborhood}, {contract.property?.district}</span>
                <span>Tax: GHS {contract.totalTaxWithheld?.toLocaleString() || 0}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Contracts;
