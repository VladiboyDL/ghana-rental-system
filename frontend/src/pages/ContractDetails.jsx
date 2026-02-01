import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, FileText, Building, User, Calendar, DollarSign,
  CheckCircle, XCircle, AlertCircle, Clock, Download
} from 'lucide-react';
import toast from 'react-hot-toast';
import { contractAPI, paymentAPI } from '../services/api';
import useAuthStore from '../store/authStore';

const ContractDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmCode, setConfirmCode] = useState('');
  const [confirming, setConfirming] = useState(false);
  const { user, isTenant, isLandlord } = useAuthStore();

  useEffect(() => {
    loadContract();
  }, [id]);

  const loadContract = async () => {
    try {
      const response = await contractAPI.getById(id);
      setContract(response.data.data);
    } catch (error) {
      toast.error('Failed to load contract');
      navigate('/contracts');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!confirmCode.trim()) {
      toast.error('Please enter the confirmation code');
      return;
    }
    setConfirming(true);
    try {
      await contractAPI.confirm(id, confirmCode);
      toast.success('Contract confirmed successfully!');
      loadContract();
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to confirm contract');
    } finally {
      setConfirming(false);
    }
  };

  const handleTerminate = async () => {
    if (!window.confirm('Are you sure you want to terminate this contract?')) {
      return;
    }
    try {
      await contractAPI.terminate(id, 'Mutual agreement');
      toast.success('Contract terminated');
      loadContract();
    } catch (error) {
      toast.error('Failed to terminate contract');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'ACTIVE': { class: 'badge-success', icon: CheckCircle, color: 'green' },
      'PENDING_TENANT_CONFIRMATION': { class: 'badge-warning', icon: Clock, color: 'yellow' },
      'EXPIRED': { class: 'badge-info', icon: AlertCircle, color: 'blue' },
      'TERMINATED': { class: 'badge-danger', icon: XCircle, color: 'red' },
      'DISPUTED': { class: 'badge-danger', icon: AlertCircle, color: 'red' },
      'DRAFT': { class: 'badge-info', icon: FileText, color: 'gray' }
    };
    return badges[status] || { class: 'badge-info', icon: AlertCircle, color: 'gray' };
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-GH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return `GHS ${amount?.toLocaleString() || 0}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ghana-green" />
      </div>
    );
  }

  if (!contract) {
    return null;
  }

  const statusInfo = getStatusBadge(contract.status);
  const StatusIcon = statusInfo.icon;
  const isPendingConfirmation = contract.status === 'PENDING_TENANT_CONFIRMATION';
  const canConfirm = isPendingConfirmation && isTenant() && contract.tenantId === user?.id;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">{contract.contractNumber}</h1>
            <div className={`badge ${statusInfo.class} mt-1`}>
              {contract.status.replace(/_/g, ' ')}
            </div>
          </div>
        </div>
        {contract.status === 'ACTIVE' && (
          <button
            onClick={handleTerminate}
            className="btn btn-danger"
          >
            Terminate Contract
          </button>
        )}
      </div>

      {/* Confirmation Alert for Tenant */}
      {canConfirm && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
          <div className="flex items-start space-x-4">
            <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-bold text-yellow-800">Action Required: Confirm Contract</h3>
              <p className="text-yellow-700 mt-1">
                You have received a confirmation code via SMS. Enter it below to confirm this rental contract.
              </p>
              <div className="flex items-center space-x-4 mt-4">
                <input
                  type="text"
                  value={confirmCode}
                  onChange={(e) => setConfirmCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  className="input max-w-xs"
                  maxLength={6}
                />
                <button
                  onClick={handleConfirm}
                  disabled={confirming}
                  className="btn btn-primary"
                >
                  {confirming ? 'Confirming...' : 'Confirm Contract'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contract Terms */}
          <div className="card">
            <h2 className="text-lg font-bold mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Contract Terms
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Contract Type</p>
                <p className="font-medium">{contract.contractType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Payment Frequency</p>
                <p className="font-medium">{contract.paymentFrequency}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Start Date</p>
                <p className="font-medium">{formatDate(contract.startDate)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">End Date</p>
                <p className="font-medium">{formatDate(contract.endDate)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Advance Months</p>
                <p className="font-medium">{contract.advanceMonths} months</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Duration</p>
                <p className="font-medium">
                  {Math.ceil((new Date(contract.endDate) - new Date(contract.startDate)) / (1000 * 60 * 60 * 24 * 30))} months
                </p>
              </div>
            </div>
          </div>

          {/* Financial Terms */}
          <div className="card">
            <h2 className="text-lg font-bold mb-4 flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Financial Terms
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b">
                <span className="text-gray-600">Monthly Rent</span>
                <span className="font-bold text-lg">{formatCurrency(contract.monthlyRent)}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b">
                <span className="text-gray-600">Security Deposit</span>
                <span className="font-medium">{formatCurrency(contract.securityDeposit)}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b">
                <span className="text-gray-600">Service Charge</span>
                <span className="font-medium">{formatCurrency(contract.serviceCharge)}/month</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b">
                <span className="text-gray-600">Tax Rate</span>
                <span className="font-medium">{(contract.taxRate * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between items-center py-3 bg-gray-50 rounded-lg px-4">
                <span className="font-medium">Total Tax Withheld</span>
                <span className="font-bold text-ghana-green">{formatCurrency(contract.totalTaxWithheld)}</span>
              </div>
            </div>
          </div>

          {/* Property Info */}
          <div className="card">
            <h2 className="text-lg font-bold mb-4 flex items-center">
              <Building className="w-5 h-5 mr-2" />
              Property
            </h2>
            {contract.property && (
              <Link to={`/properties/${contract.property.id}`} className="block hover:bg-gray-50 -m-4 p-4 rounded-xl">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold">{contract.property.propertyTypeName}</p>
                    <p className="text-gray-500">{contract.property.digitalAddress}</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {contract.property.neighborhood}, {contract.property.district}
                    </p>
                  </div>
                  <span className="text-ghana-green">View Property &rarr;</span>
                </div>
              </Link>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <div className="card">
            <h2 className="text-lg font-bold mb-4">Status</h2>
            <div className={`flex items-center space-x-2 p-4 rounded-lg bg-${statusInfo.color}-50`}>
              <StatusIcon className={`w-6 h-6 text-${statusInfo.color}-600`} />
              <span className="font-medium">{contract.status.replace(/_/g, ' ')}</span>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Landlord Signed</span>
                <span>{contract.landlordSigned ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tenant Confirmed</span>
                <span>{contract.tenantConfirmed ? 'Yes' : 'No'}</span>
              </div>
              {contract.landlordSignedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Landlord Signed At</span>
                  <span>{formatDate(contract.landlordSignedAt)}</span>
                </div>
              )}
              {contract.tenantConfirmedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Tenant Confirmed At</span>
                  <span>{formatDate(contract.tenantConfirmedAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Parties */}
          <div className="card">
            <h2 className="text-lg font-bold mb-4">Parties</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 flex items-center">
                  <User className="w-4 h-4 mr-1" />
                  Landlord
                </p>
                <p className="font-medium">{contract.landlord?.name}</p>
                <p className="text-sm text-gray-500">{contract.landlord?.phone}</p>
              </div>
              <div className="border-t pt-4">
                <p className="text-sm text-gray-500 flex items-center">
                  <User className="w-4 h-4 mr-1" />
                  Tenant
                </p>
                <p className="font-medium">{contract.tenant?.name}</p>
                <p className="text-sm text-gray-500">{contract.tenant?.phone}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          {contract.status === 'ACTIVE' && (
            <div className="card">
              <h2 className="text-lg font-bold mb-4">Actions</h2>
              <div className="space-y-2">
                <Link
                  to={`/payments?contractId=${contract.id}`}
                  className="btn btn-primary w-full"
                >
                  View Payments
                </Link>
                {contract.contractDocumentUrl && (
                  <a
                    href={contract.contractDocumentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary w-full flex items-center justify-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Contract</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="card">
            <h2 className="text-lg font-bold mb-4">Timeline</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 rounded-full bg-ghana-green" />
                <div>
                  <p className="font-medium">Created</p>
                  <p className="text-gray-500">{formatDate(contract.createdAt)}</p>
                </div>
              </div>
              {contract.landlordSignedAt && (
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 rounded-full bg-ghana-green" />
                  <div>
                    <p className="font-medium">Landlord Signed</p>
                    <p className="text-gray-500">{formatDate(contract.landlordSignedAt)}</p>
                  </div>
                </div>
              )}
              {contract.tenantConfirmedAt && (
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 rounded-full bg-ghana-green" />
                  <div>
                    <p className="font-medium">Tenant Confirmed</p>
                    <p className="text-gray-500">{formatDate(contract.tenantConfirmedAt)}</p>
                  </div>
                </div>
              )}
              {contract.terminatedAt && (
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <div>
                    <p className="font-medium">Terminated</p>
                    <p className="text-gray-500">{formatDate(contract.terminatedAt)}</p>
                    {contract.terminationReason && (
                      <p className="text-gray-400">{contract.terminationReason}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractDetails;
