import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, DollarSign, Calendar, CheckCircle, Clock, XCircle,
  FileText, CreditCard, Building, User
} from 'lucide-react';
import toast from 'react-hot-toast';
import { paymentAPI } from '../services/api';
import useAuthStore from '../store/authStore';

const PaymentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isLandlord, isTenant } = useAuthStore();

  useEffect(() => {
    loadPayment();
  }, [id]);

  const loadPayment = async () => {
    try {
      const response = await paymentAPI.getById(id);
      setPayment(response.data.data);
    } catch (error) {
      toast.error('Failed to load payment');
      navigate('/payments');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'COMPLETED': { class: 'badge-success', icon: CheckCircle, color: 'green' },
      'PENDING': { class: 'badge-warning', icon: Clock, color: 'yellow' },
      'PROCESSING': { class: 'badge-info', icon: Clock, color: 'blue' },
      'FAILED': { class: 'badge-danger', icon: XCircle, color: 'red' },
      'CANCELLED': { class: 'badge-danger', icon: XCircle, color: 'red' }
    };
    return badges[status] || { class: 'badge-info', icon: Clock, color: 'gray' };
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-GH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (date) => {
    return new Date(date).toLocaleString('en-GH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  if (!payment) {
    return null;
  }

  const statusInfo = getStatusBadge(payment.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div>
      <div className="flex items-center space-x-4 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold">{payment.paymentReference}</h1>
          <div className={`badge ${statusInfo.class} mt-1`}>
            {payment.status}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Amount Breakdown */}
          <div className="card">
            <h2 className="text-lg font-bold mb-4 flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Payment Breakdown
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b">
                <span className="text-gray-600">Gross Amount (Rent)</span>
                <span className="font-bold text-xl">{formatCurrency(payment.grossAmount)}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b">
                <div>
                  <span className="text-gray-600">Tax Withheld</span>
                  <p className="text-xs text-gray-400">8% Withholding Tax (GRA)</p>
                </div>
                <span className="font-medium text-red-600">-{formatCurrency(payment.taxAmount)}</span>
              </div>
              {payment.platformFee > 0 && (
                <div className="flex justify-between items-center py-3 border-b">
                  <div>
                    <span className="text-gray-600">Platform Fee</span>
                    <p className="text-xs text-gray-400">1% capped at GHS 50</p>
                  </div>
                  <span className="font-medium text-red-600">-{formatCurrency(payment.platformFee)}</span>
                </div>
              )}
              <div className="flex justify-between items-center py-3 bg-green-50 rounded-lg px-4">
                <span className="font-bold">Net Amount to Landlord</span>
                <span className="font-bold text-2xl text-ghana-green">{formatCurrency(payment.netAmount)}</span>
              </div>
            </div>
          </div>

          {/* Payment Period */}
          <div className="card">
            <h2 className="text-lg font-bold mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Payment Period
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Period Start</p>
                <p className="font-medium">{formatDate(payment.periodStart)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Period End</p>
                <p className="font-medium">{formatDate(payment.periodEnd)}</p>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="card">
            <h2 className="text-lg font-bold mb-4 flex items-center">
              <CreditCard className="w-5 h-5 mr-2" />
              Payment Method
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Method</p>
                <p className="font-medium">{payment.paymentMethod}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Provider</p>
                <p className="font-medium">{payment.paymentProvider || 'N/A'}</p>
              </div>
              {payment.providerReference && (
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Provider Reference</p>
                  <p className="font-mono text-sm">{payment.providerReference}</p>
                </div>
              )}
            </div>
          </div>

          {/* Contract Info */}
          {payment.contract && (
            <div className="card">
              <h2 className="text-lg font-bold mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Related Contract
              </h2>
              <Link
                to={`/contracts/${payment.contract.id}`}
                className="block hover:bg-gray-50 -m-4 p-4 rounded-xl"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold">{payment.contract.contractNumber}</p>
                    <p className="text-sm text-gray-500">
                      {payment.contract.property?.neighborhood}, {payment.contract.property?.district}
                    </p>
                  </div>
                  <span className="text-ghana-green">View Contract &rarr;</span>
                </div>
              </Link>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="card">
            <h2 className="text-lg font-bold mb-4">Status</h2>
            <div className={`flex items-center space-x-2 p-4 rounded-lg bg-${statusInfo.color}-50`}>
              <StatusIcon className={`w-6 h-6 text-${statusInfo.color}-600`} />
              <span className="font-medium">{payment.status}</span>
            </div>
            {payment.status === 'FAILED' && payment.failureReason && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{payment.failureReason}</p>
              </div>
            )}
          </div>

          {/* Parties */}
          <div className="card">
            <h2 className="text-lg font-bold mb-4">Parties</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 flex items-center">
                  <User className="w-4 h-4 mr-1" />
                  Tenant (Payer)
                </p>
                <p className="font-medium">{payment.tenant?.name}</p>
                <p className="text-sm text-gray-500">{payment.tenant?.phone}</p>
              </div>
              <div className="border-t pt-4">
                <p className="text-sm text-gray-500 flex items-center">
                  <Building className="w-4 h-4 mr-1" />
                  Landlord (Recipient)
                </p>
                <p className="font-medium">{payment.landlord?.name}</p>
                <p className="text-sm text-gray-500">{payment.landlord?.phone}</p>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="card">
            <h2 className="text-lg font-bold mb-4">Timeline</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 rounded-full bg-ghana-green" />
                <div>
                  <p className="font-medium">Initiated</p>
                  <p className="text-gray-500">{formatDateTime(payment.initiatedAt)}</p>
                </div>
              </div>
              {payment.completedAt && (
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <div>
                    <p className="font-medium">Completed</p>
                    <p className="text-gray-500">{formatDateTime(payment.completedAt)}</p>
                  </div>
                </div>
              )}
              {payment.failedAt && (
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <div>
                    <p className="font-medium">Failed</p>
                    <p className="text-gray-500">{formatDateTime(payment.failedAt)}</p>
                  </div>
                </div>
              )}
              {payment.settledAt && (
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 rounded-full bg-ghana-green" />
                  <div>
                    <p className="font-medium">Settled</p>
                    <p className="text-gray-500">{formatDateTime(payment.settledAt)}</p>
                    {payment.settlementReference && (
                      <p className="text-xs text-gray-400 font-mono">{payment.settlementReference}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tax Info */}
          <div className="card bg-yellow-50 border-yellow-200">
            <h2 className="text-lg font-bold mb-2 text-yellow-800">Tax Information</h2>
            <p className="text-sm text-yellow-700">
              The withholding tax of {formatCurrency(payment.taxAmount)} has been automatically
              remitted to the Ghana Revenue Authority (GRA).
            </p>
            {payment.status === 'COMPLETED' && (
              <p className="text-sm text-yellow-700 mt-2">
                This payment will be included in the landlord's tax certificate.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetails;
