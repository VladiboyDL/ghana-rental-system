import { useEffect, useState } from 'react';
import {
  Building, FileText, CreditCard, TrendingUp, Users,
  AlertTriangle, CheckCircle, Clock, DollarSign
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import { propertyAPI, contractAPI, paymentAPI, adminAPI } from '../services/api';

const StatCard = ({ icon: Icon, label, value, subValue, color }) => (
  <div className="card">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-500 text-sm">{label}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
        {subValue && <p className="text-sm text-gray-400 mt-1">{subValue}</p>}
      </div>
      <div className={`p-3 rounded-full ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const { user, isLandlord, isTenant, isAdmin, isGRA } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      if (isAdmin() || isGRA()) {
        const response = await adminAPI.getDashboard();
        setStats(response.data.data);
      } else if (isLandlord()) {
        const [properties, contracts, payments] = await Promise.all([
          propertyAPI.getAll(),
          contractAPI.getAll(),
          paymentAPI.getSummary()
        ]);
        setStats({
          properties: properties.data.meta?.total || properties.data.data?.length || 0,
          contracts: contracts.data.meta?.total || contracts.data.data?.length || 0,
          activeContracts: contracts.data.data?.filter(c => c.status === 'ACTIVE').length || 0,
          payments: payments.data.data
        });
      } else if (isTenant()) {
        const [contracts, payments] = await Promise.all([
          contractAPI.getAll(),
          paymentAPI.getAll()
        ]);
        setStats({
          contracts: contracts.data.data?.length || 0,
          activeContracts: contracts.data.data?.filter(c => c.status === 'ACTIVE').length || 0,
          pendingContracts: contracts.data.data?.filter(c => c.status === 'PENDING_TENANT_CONFIRMATION').length || 0,
          totalPaid: payments.data.data?.reduce((sum, p) => sum + p.grossAmount, 0) || 0
        });
      }
    } catch (error) {
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ghana-green" />
      </div>
    );
  }

  // Admin/GRA Dashboard
  if (isAdmin() || isGRA()) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={Users}
            label="Total Users"
            value={stats?.users?.total || 0}
            subValue={`${stats?.users?.landlords || 0} landlords, ${stats?.users?.tenants || 0} tenants`}
            color="bg-blue-500"
          />
          <StatCard
            icon={Building}
            label="Properties"
            value={stats?.properties?.total || 0}
            subValue={`${stats?.properties?.verified || 0} verified`}
            color="bg-green-500"
          />
          <StatCard
            icon={FileText}
            label="Active Contracts"
            value={stats?.contracts?.active || 0}
            subValue={`${stats?.contracts?.pending || 0} pending`}
            color="bg-purple-500"
          />
          <StatCard
            icon={DollarSign}
            label="Tax Collected"
            value={`GHS ${(stats?.payments?.totalTax || 0).toLocaleString()}`}
            subValue={`${stats?.payments?.totalCount || 0} transactions`}
            color="bg-ghana-gold"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="font-bold text-lg mb-4">Today's Activity</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-gray-600">Transactions</span>
                <span className="font-bold">{stats?.today?.transactions || 0}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-gray-600">Tax Collected</span>
                <span className="font-bold text-ghana-green">
                  GHS {(stats?.today?.taxCollected || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-600">Open Cases</span>
                <span className="font-bold text-ghana-red">{stats?.cases?.open || 0}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-bold text-lg mb-4">Case Overview</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-yellow-500" />
                  <span>Open</span>
                </div>
                <span className="font-bold">{stats?.cases?.open || 0}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  <span>In Progress</span>
                </div>
                <span className="font-bold">{stats?.cases?.inProgress || 0}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Closed</span>
                </div>
                <span className="font-bold">{stats?.cases?.closed || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Landlord Dashboard
  if (isLandlord()) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">
          Welcome, {user?.companyName || `${user?.firstName} ${user?.lastName}`}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={Building}
            label="My Properties"
            value={stats?.properties || 0}
            color="bg-blue-500"
          />
          <StatCard
            icon={FileText}
            label="Active Contracts"
            value={stats?.activeContracts || 0}
            color="bg-green-500"
          />
          <StatCard
            icon={CreditCard}
            label="Monthly Income"
            value={`GHS ${(stats?.payments?.currentMonth?.totalNet || 0).toLocaleString()}`}
            color="bg-purple-500"
          />
          <StatCard
            icon={TrendingUp}
            label="Compliance Score"
            value={`${user?.complianceScore || 0}%`}
            color={user?.complianceScore >= 75 ? 'bg-green-500' : 'bg-yellow-500'}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="font-bold text-lg mb-4">Year to Date</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-gray-600">Total Rent Received</span>
                <span className="font-bold">
                  GHS {(stats?.payments?.yearToDate?.totalGross || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-gray-600">Tax Withheld</span>
                <span className="font-bold text-ghana-red">
                  GHS {(stats?.payments?.yearToDate?.totalTax || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-600">Net Received</span>
                <span className="font-bold text-ghana-green">
                  GHS {(stats?.payments?.yearToDate?.totalNet || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-bold text-lg mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <a href="/properties/new" className="btn btn-secondary text-center">
                Add Property
              </a>
              <a href="/contracts/new" className="btn btn-secondary text-center">
                New Contract
              </a>
              <a href="/tax-certificates" className="btn btn-secondary text-center">
                Tax Certificates
              </a>
              <a href="/market" className="btn btn-secondary text-center">
                Market Rent
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Tenant Dashboard
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">
        Welcome, {user?.companyName || `${user?.firstName} ${user?.lastName}`}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard
          icon={FileText}
          label="Active Contracts"
          value={stats?.activeContracts || 0}
          color="bg-green-500"
        />
        <StatCard
          icon={Clock}
          label="Pending Confirmation"
          value={stats?.pendingContracts || 0}
          color="bg-yellow-500"
        />
        <StatCard
          icon={CreditCard}
          label="Total Paid"
          value={`GHS ${(stats?.totalPaid || 0).toLocaleString()}`}
          color="bg-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-bold text-lg mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <a href="/payments/new" className="btn btn-primary text-center">
              Make Payment
            </a>
            <a href="/contracts" className="btn btn-secondary text-center">
              View Contracts
            </a>
            <a href="/market" className="btn btn-secondary text-center">
              Check Market Rent
            </a>
            <a href="/report" className="btn btn-secondary text-center">
              Report Issue
            </a>
          </div>
        </div>

        {stats?.pendingContracts > 0 && (
          <div className="card bg-yellow-50 border border-yellow-200">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg">Pending Confirmation</h3>
                <p className="text-gray-600 text-sm mt-1">
                  You have {stats.pendingContracts} contract(s) waiting for your confirmation.
                </p>
                <a
                  href="/contracts?status=pending"
                  className="btn btn-primary mt-3 inline-block"
                >
                  Review Now
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
