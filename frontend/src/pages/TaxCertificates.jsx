import { useEffect, useState } from 'react';
import { FileText, Download, Calendar, DollarSign, CheckCircle, QrCode } from 'lucide-react';
import toast from 'react-hot-toast';
import { taxAPI } from '../services/api';
import useAuthStore from '../store/authStore';

const TaxCertificates = () => {
  const [certificates, setCertificates] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const { isLandlord } = useAuthStore();

  useEffect(() => {
    loadCertificates();
    loadSummary();
  }, [selectedYear]);

  const loadCertificates = async () => {
    try {
      const response = await taxAPI.getCertificates({ year: selectedYear });
      setCertificates(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load certificates');
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const response = await taxAPI.getSummary({ year: selectedYear });
      setSummary(response.data.data);
    } catch (error) {
      console.error('Failed to load summary');
    }
  };

  const generateCertificate = async (periodType, periodMonth = null) => {
    setGenerating(true);
    try {
      const data = {
        periodType,
        periodYear: selectedYear,
        ...(periodMonth && { periodMonth })
      };
      await taxAPI.generateCertificate(data);
      toast.success('Certificate generated successfully');
      loadCertificates();
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to generate certificate');
    } finally {
      setGenerating(false);
    }
  };

  const downloadCertificate = async (id) => {
    try {
      const response = await taxAPI.downloadCertificate(id);
      // In a real app, this would trigger a file download
      toast.success('Certificate downloaded');
    } catch (error) {
      toast.error('Failed to download certificate');
    }
  };

  const formatCurrency = (amount) => {
    return `GHS ${amount?.toLocaleString() || 0}`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-GH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getMonthName = (month) => {
    return new Date(2000, month - 1).toLocaleString('en-GH', { month: 'long' });
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

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
        <h1 className="text-2xl font-bold">Tax Certificates</h1>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          className="input w-32"
        >
          {years.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Rent Received</p>
                <p className="text-2xl font-bold">{formatCurrency(summary.totalRent)}</p>
              </div>
              <DollarSign className="w-10 h-10 text-ghana-green opacity-20" />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Tax Withheld</p>
                <p className="text-2xl font-bold">{formatCurrency(summary.totalTax)}</p>
              </div>
              <FileText className="w-10 h-10 text-ghana-yellow opacity-20" />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Certificates Issued</p>
                <p className="text-2xl font-bold">{summary.certificateCount || 0}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-500 opacity-20" />
            </div>
          </div>
        </div>
      )}

      {/* Generate Certificate */}
      {isLandlord() && (
        <div className="card mb-6">
          <h2 className="text-lg font-bold mb-4">Generate New Certificate</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => generateCertificate('ANNUAL')}
              disabled={generating}
              className="btn btn-primary"
            >
              {generating ? 'Generating...' : `Annual Certificate (${selectedYear})`}
            </button>
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">or Monthly:</span>
              <select
                onChange={(e) => e.target.value && generateCertificate('MONTHLY', parseInt(e.target.value))}
                className="input w-40"
                disabled={generating}
              >
                <option value="">Select Month</option>
                {months.map(month => (
                  <option key={month} value={month}>{getMonthName(month)}</option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Certificates are official proof of tax withheld on rental income.
            You can use these for tax filing purposes.
          </p>
        </div>
      )}

      {/* Certificates List */}
      {certificates.length === 0 ? (
        <div className="card text-center py-12">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600">No certificates found</h3>
          <p className="text-gray-400 mt-1">
            {isLandlord()
              ? 'Generate your first tax certificate above'
              : 'Tax certificates will appear here'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {certificates.map((cert) => (
            <div key={cert.id} className="card">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <FileText className="w-6 h-6 text-ghana-green" />
                    <h3 className="font-bold">{cert.certificateNumber}</h3>
                    <span className="badge badge-success flex items-center space-x-1">
                      <CheckCircle className="w-3 h-3" />
                      <span>Verified</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Period</p>
                      <p className="font-medium">
                        {cert.periodType === 'ANNUAL'
                          ? `Full Year ${cert.periodYear}`
                          : `${getMonthName(cert.periodMonth)} ${cert.periodYear}`}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Total Rent</p>
                      <p className="font-medium">{formatCurrency(cert.totalRentReceived)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Tax Withheld</p>
                      <p className="font-medium text-ghana-green">{formatCurrency(cert.totalTaxWithheld)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Generated</p>
                      <p className="font-medium">{formatDate(cert.generatedAt)}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => downloadCertificate(cert.id)}
                    className="btn btn-secondary flex items-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </button>
                </div>
              </div>

              {/* Verification Info */}
              <div className="mt-4 pt-4 border-t flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <QrCode className="w-4 h-4" />
                  <span>Verification Code: <code className="font-mono">{cert.verificationCode}</code></span>
                </div>
                <a
                  href={`/verify-certificate?code=${cert.verificationCode}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-ghana-green hover:underline"
                >
                  Verify Online
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Box */}
      <div className="card bg-blue-50 border-blue-200 mt-6">
        <h3 className="font-bold text-blue-800 mb-2">About Tax Certificates</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Certificates are official GRA documents proving tax withholding</li>
          <li>• Use these for your annual tax returns and declarations</li>
          <li>• Each certificate has a unique verification code for authenticity</li>
          <li>• Third parties can verify certificates at our public verification portal</li>
        </ul>
      </div>
    </div>
  );
};

export default TaxCertificates;
