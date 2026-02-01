import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  DollarSign, Calendar, CheckCircle, Clock, XCircle, AlertCircle,
  TrendingUp, FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import { paymentAPI } from '../services/api';
import useAuthStore from '../store/authStore';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [searchParams] = useSearchParams();
  const contractId = searchParams.get('contractId');
  const { isLandlord, isTenant } = useAuthStore();

  useEffect(() => {
    loadPayments();
    loadSummary();
  }, [filter, contractId]);

  const loadPayments = async () => {
    try {
      const params = { status: filter || undefined };
      if (contractId) params.contractId = contractId;
      const response = await paymentAPI.getAll(params);
      setPayments(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const response = await paymentAPI.getSummary();
      setSummary(response.data.data);
    } catch (error) {
      console.error('Failed to load summary');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'COMPLETED': { class: 'badge-success', icon: CheckCircle },
      'PENDING': { class: 'badge-warning', icon: Clock },
      'PROCESSING': { class: 'badge-info', icon: Clock },
      'FAILED': { class: 'badge-danger', icon: XCircle },
      'CANCELLED': { class: 'badge-danger', icon: XCircle }
    };
    return badges[status] || { class: 'badge-info', icon: AlertCircle };
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-GH', {
      year: 'numeric',
      month: 'short',
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Payments</h1>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total {isLandlord() ? 'Received' : 'Paid'}</p>
                <p className="text-2xl font-bold">{formatCurrency(summary.totalAmount)}</p>
              </div>
              <DollarSign className="w-10 h-10 text-ghana-green opacity-20" />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tax Withheld</p>
                <p className="text-2xl font-bold">{formatCurrency(summary.totalTax)}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-ghana-yellow opacity-20" />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-2xl font-bold">{summary.completedCount || 0}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-500 opacity-20" />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-2xl font-bold">{summary.pendingCount || 0}</p>
              </div>
              <Clock className="w-10 h-10 text-yellow-500 opacity-20" />
            </div>
          </div>
        </div>
      )}

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
              filter === 'COMPLETED' ? 'bg-ghana-green text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
            onClick={() => setFilter('COMPLETED')}
          >
            Completed
          </button>
          <button
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'PENDING' ? 'bg-ghana-green text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
            onClick={() => setFilter('PENDING')}
          >
            Pending
          </button>
          <button
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'FAILED' ? 'bg-ghana-green text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
            onClick={() => setFilter('FAILED')}
          >
            Failed
          </button>
        </div>
      </div>

      {/* Payments List */}
      {payments.length === 0 ? (
        <div className="card text-center py-12">
          <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600">No payments found</h3>
          <p className="text-gray-400 mt-1">
            {contractId ? 'No payments for this contract yet' : 'Payment history will appear here'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {payments.map((payment) => {
            const statusInfo = getStatusBadge(payment.status);
            const StatusIcon = statusInfo.icon;

            return (
              <Link
                key={payment.id}
                to={`/payments/${payment.id}`}
                className="card hover:shadow-lg transition-shadow block"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-bold">{payment.paymentReference}</h3>
                      <span className={`badge ${statusInfo.class} flex items-center space-x-1`}>
                        <StatusIcon className="w-3 h-3" />
                        <span>{payment.status}</span>
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center text-gray-600">
                        <FileText className="w-4 h-4 mr-2 text-gray-400" />
                        <span>{payment.contract?.contractNumber || 'N/A'}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        <span>{formatDate(payment.periodStart)} - {formatDate(payment.periodEnd)}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <span className="text-xs text-gray-400 mr-1">Method:</span>
                        <span>{payment.paymentMethod}</span>
                      </div>
                      <div className="flex items-center font-medium">
                        <DollarSign className="w-4 h-4 mr-1 text-ghana-green" />
                        <span>{formatCurrency(payment.grossAmount)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-gray-500">Tax Withheld</p>
                    <p className="font-bold text-ghana-green">{formatCurrency(payment.taxAmount)}</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm text-gray-500">
                  <span>
                    {isTenant() ? `To: ${payment.landlord?.name}` : `From: ${payment.tenant?.name}`}
                  </span>
                  <span>
                    Net: {formatCurrency(payment.netAmount)}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Payments;
