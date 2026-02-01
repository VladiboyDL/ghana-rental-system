import { useState, useEffect } from 'react';
import {
  FileText,
  TrendingUp,
  Users,
  Building,
  Calendar,
  Download,
  BarChart3,
  PieChart,
  Filter,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI } from '../services/api';

const Reports = () => {
  const [loading, setLoading] = useState(false);
  const [activeReport, setActiveReport] = useState('tax_collection');
  const [reportData, setReportData] = useState([]);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    region: '',
    district: ''
  });

  const reportTypes = [
    {
      id: 'tax_collection',
      name: 'Tax Collection',
      icon: TrendingUp,
      description: 'Monthly tax collection and rent payment statistics'
    },
    {
      id: 'compliance',
      name: 'Compliance',
      icon: Users,
      description: 'Landlord compliance scores by region'
    },
    {
      id: 'registrations',
      name: 'Registrations',
      icon: Building,
      description: 'Daily user registration trends'
    }
  ];

  useEffect(() => {
    loadReport();
  }, [activeReport]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const params = {
        type: activeReport,
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.region && { region: filters.region }),
        ...(filters.district && { district: filters.district })
      };

      const response = await adminAPI.getReports(params);
      setReportData(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load report data');
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = () => {
    loadReport();
  };

  const formatCurrency = (amount) => {
    return `GHS ${parseFloat(amount || 0).toLocaleString('en-GH', { minimumFractionDigits: 2 })}`;
  };

  const formatNumber = (num) => {
    return parseInt(num || 0).toLocaleString();
  };

  const handleExport = () => {
    if (reportData.length === 0) {
      toast.error('No data to export');
      return;
    }

    // Convert data to CSV
    const headers = Object.keys(reportData[0]).join(',');
    const rows = reportData.map(row => Object.values(row).join(','));
    const csv = [headers, ...rows].join('\n');

    // Download CSV file
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeReport}_report_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success('Report exported successfully');
  };

  const renderTaxCollectionReport = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-green-50 border-green-200">
          <p className="text-sm text-green-600 mb-1">Total Tax Collected</p>
          <p className="text-2xl font-bold text-green-700">
            {formatCurrency(reportData.reduce((sum, r) => sum + parseFloat(r.total_tax || 0), 0))}
          </p>
        </div>
        <div className="card bg-blue-50 border-blue-200">
          <p className="text-sm text-blue-600 mb-1">Total Rent Processed</p>
          <p className="text-2xl font-bold text-blue-700">
            {formatCurrency(reportData.reduce((sum, r) => sum + parseFloat(r.total_rent || 0), 0))}
          </p>
        </div>
        <div className="card bg-purple-50 border-purple-200">
          <p className="text-sm text-purple-600 mb-1">Total Transactions</p>
          <p className="text-2xl font-bold text-purple-700">
            {formatNumber(reportData.reduce((sum, r) => sum + parseInt(r.transaction_count || 0), 0))}
          </p>
        </div>
        <div className="card bg-yellow-50 border-yellow-200">
          <p className="text-sm text-yellow-600 mb-1">Reporting Periods</p>
          <p className="text-2xl font-bold text-yellow-700">{reportData.length}</p>
        </div>
      </div>

      {/* Data Table */}
      <div className="card overflow-hidden">
        <h3 className="font-bold mb-4 flex items-center">
          <BarChart3 className="w-5 h-5 mr-2" />
          Monthly Tax Collection Breakdown
        </h3>
        {reportData.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No tax collection data available for the selected period</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Period</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Transactions</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Total Rent</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Tax Collected</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Tax Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {reportData.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{row.period}</td>
                    <td className="px-4 py-3 text-right">{formatNumber(row.transaction_count)}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(row.total_rent)}</td>
                    <td className="px-4 py-3 text-right text-green-600 font-medium">
                      {formatCurrency(row.total_tax)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500">
                      {row.total_rent > 0
                        ? ((parseFloat(row.total_tax) / parseFloat(row.total_rent)) * 100).toFixed(1)
                        : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const renderComplianceReport = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-yellow-50 border-yellow-200">
          <p className="text-sm text-yellow-600 mb-1">Total Landlords</p>
          <p className="text-2xl font-bold text-yellow-700">
            {formatNumber(reportData.reduce((sum, r) => sum + parseInt(r.landlord_count || 0), 0))}
          </p>
        </div>
        <div className="card bg-green-50 border-green-200">
          <p className="text-sm text-green-600 mb-1">Gold Status (90%+)</p>
          <p className="text-2xl font-bold text-green-700">
            {formatNumber(reportData.reduce((sum, r) => sum + parseInt(r.gold || 0), 0))}
          </p>
        </div>
        <div className="card bg-gray-50 border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Silver Status (75-89%)</p>
          <p className="text-2xl font-bold text-gray-700">
            {formatNumber(reportData.reduce((sum, r) => sum + parseInt(r.silver || 0), 0))}
          </p>
        </div>
        <div className="card bg-red-50 border-red-200">
          <p className="text-sm text-red-600 mb-1">Non-Compliant (&lt;60%)</p>
          <p className="text-2xl font-bold text-red-700">
            {formatNumber(reportData.reduce((sum, r) => sum + parseInt(r.non_compliant || 0), 0))}
          </p>
        </div>
      </div>

      {/* Data Table */}
      <div className="card overflow-hidden">
        <h3 className="font-bold mb-4 flex items-center">
          <PieChart className="w-5 h-5 mr-2" />
          Compliance by Region
        </h3>
        {reportData.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No compliance data available</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Region</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Landlords</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Avg Score</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Gold</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Silver</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Non-Compliant</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {reportData.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{row.region || 'Unknown'}</td>
                    <td className="px-4 py-3 text-right">{formatNumber(row.landlord_count)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`px-2 py-1 rounded-full text-sm ${
                        parseFloat(row.avg_score) >= 90 ? 'bg-green-100 text-green-700' :
                        parseFloat(row.avg_score) >= 75 ? 'bg-gray-100 text-gray-700' :
                        parseFloat(row.avg_score) >= 60 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {parseFloat(row.avg_score || 0).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-green-600">{formatNumber(row.gold)}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{formatNumber(row.silver)}</td>
                    <td className="px-4 py-3 text-right text-red-600">{formatNumber(row.non_compliant)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const renderRegistrationsReport = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-blue-50 border-blue-200">
          <p className="text-sm text-blue-600 mb-1">Total Registrations</p>
          <p className="text-2xl font-bold text-blue-700">
            {formatNumber(reportData.reduce((sum, r) => sum + parseInt(r.total || 0), 0))}
          </p>
        </div>
        <div className="card bg-green-50 border-green-200">
          <p className="text-sm text-green-600 mb-1">New Landlords</p>
          <p className="text-2xl font-bold text-green-700">
            {formatNumber(reportData.reduce((sum, r) => sum + parseInt(r.landlords || 0), 0))}
          </p>
        </div>
        <div className="card bg-purple-50 border-purple-200">
          <p className="text-sm text-purple-600 mb-1">New Tenants</p>
          <p className="text-2xl font-bold text-purple-700">
            {formatNumber(reportData.reduce((sum, r) => sum + parseInt(r.tenants || 0), 0))}
          </p>
        </div>
      </div>

      {/* Data Table */}
      <div className="card overflow-hidden">
        <h3 className="font-bold mb-4 flex items-center">
          <Users className="w-5 h-5 mr-2" />
          Daily Registration Trends
        </h3>
        {reportData.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No registration data available for the selected period</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Date</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Landlords</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Tenants</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {reportData.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">
                      {new Date(row.date).toLocaleDateString('en-GH', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-4 py-3 text-right text-green-600">{formatNumber(row.landlords)}</td>
                    <td className="px-4 py-3 text-right text-purple-600">{formatNumber(row.tenants)}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatNumber(row.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const renderReport = () => {
    switch (activeReport) {
      case 'tax_collection':
        return renderTaxCollectionReport();
      case 'compliance':
        return renderComplianceReport();
      case 'registrations':
        return renderRegistrationsReport();
      default:
        return null;
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center">
          <FileText className="w-6 h-6 mr-2" />
          Reports & Analytics
        </h1>
        <button
          onClick={handleExport}
          disabled={loading || reportData.length === 0}
          className="btn btn-secondary flex items-center space-x-2"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Report Type Tabs */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-2">
          {reportTypes.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => setActiveReport(type.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  activeReport === type.id
                    ? 'bg-ghana-green text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{type.name}</span>
              </button>
            );
          })}
        </div>
        <p className="text-sm text-gray-500 mt-3">
          {reportTypes.find(t => t.id === activeReport)?.description}
        </p>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex items-center mb-4">
          <Filter className="w-5 h-5 mr-2 text-gray-500" />
          <h3 className="font-medium">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="w-4 h-4 inline mr-1" />
              Start Date
            </label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="w-4 h-4 inline mr-1" />
              End Date
            </label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
            <select
              name="region"
              value={filters.region}
              onChange={handleFilterChange}
              className="input"
            >
              <option value="">All Regions</option>
              <option value="Greater Accra">Greater Accra</option>
              <option value="Ashanti">Ashanti</option>
              <option value="Western">Western</option>
              <option value="Central">Central</option>
              <option value="Eastern">Eastern</option>
              <option value="Northern">Northern</option>
              <option value="Volta">Volta</option>
              <option value="Upper East">Upper East</option>
              <option value="Upper West">Upper West</option>
              <option value="Brong Ahafo">Brong Ahafo</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleApplyFilters}
              disabled={loading}
              className="btn btn-primary w-full flex items-center justify-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Loading...' : 'Apply Filters'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Report Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ghana-green" />
        </div>
      ) : (
        renderReport()
      )}
    </div>
  );
};

export default Reports;
