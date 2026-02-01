import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, CheckCircle, XCircle, FileText, QrCode, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { taxAPI } from '../services/api';

const VerifyCertificate = () => {
  const [searchParams] = useSearchParams();
  const initialCode = searchParams.get('code') || '';

  const [verificationCode, setVerificationCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const verifyCertificate = async (e) => {
    e.preventDefault();

    if (!verificationCode.trim()) {
      toast.error('Please enter a verification code');
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await taxAPI.verifyCertificate(verificationCode);
      setResult(response.data.data);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Certificate not found');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `GHS ${amount?.toLocaleString() || 0}`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-GH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getMonthName = (month) => {
    return new Date(2000, month - 1).toLocaleString('en-GH', { month: 'long' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-ghana-green text-white py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <Shield className="w-12 h-12 mx-auto mb-4 opacity-80" />
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              Certificate Verification Portal
            </h1>
            <p className="opacity-90">
              Verify the authenticity of Ghana Rental Tax Withholding Certificates
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Search Form */}
          <div className="card -mt-12 relative z-10 shadow-lg">
            <form onSubmit={verifyCertificate}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter Verification Code
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.toUpperCase())}
                  placeholder="e.g., VER-ABC123XYZ"
                  className="input flex-1 font-mono"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary flex items-center space-x-2"
                >
                  <Search className="w-4 h-4" />
                  <span>{loading ? 'Verifying...' : 'Verify'}</span>
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                The verification code can be found on the certificate or scanned from its QR code.
              </p>
            </form>
          </div>

          {/* Error Result */}
          {error && (
            <div className="card mt-6 border-red-200 bg-red-50">
              <div className="flex items-center space-x-4">
                <XCircle className="w-12 h-12 text-red-500" />
                <div>
                  <h2 className="text-lg font-bold text-red-800">Verification Failed</h2>
                  <p className="text-red-600">{error}</p>
                </div>
              </div>
              <div className="mt-4 p-4 bg-red-100 rounded-lg">
                <p className="text-sm text-red-700">
                  This certificate could not be verified. Please ensure you have entered
                  the correct verification code. If you believe this is an error,
                  please contact the Ghana Revenue Authority.
                </p>
              </div>
            </div>
          )}

          {/* Success Result */}
          {result && (
            <div className="space-y-6 mt-6">
              {/* Verification Badge */}
              <div className="card border-green-200 bg-green-50">
                <div className="flex items-center space-x-4">
                  <CheckCircle className="w-12 h-12 text-green-500" />
                  <div>
                    <h2 className="text-lg font-bold text-green-800">Certificate Verified</h2>
                    <p className="text-green-600">This is an authentic tax withholding certificate.</p>
                  </div>
                </div>
              </div>

              {/* Certificate Details */}
              <div className="card">
                <div className="flex items-center space-x-3 mb-6">
                  <FileText className="w-8 h-8 text-ghana-green" />
                  <div>
                    <h2 className="text-xl font-bold">{result.certificateNumber}</h2>
                    <p className="text-gray-500">Tax Withholding Certificate</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-500">Period</p>
                    <p className="font-medium">
                      {result.periodType === 'ANNUAL'
                        ? `Full Year ${result.periodYear}`
                        : `${getMonthName(result.periodMonth)} ${result.periodYear}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Generated On</p>
                    <p className="font-medium">{formatDate(result.generatedAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Rent Received</p>
                    <p className="font-bold text-xl">{formatCurrency(result.totalRentReceived)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Tax Withheld</p>
                    <p className="font-bold text-xl text-ghana-green">{formatCurrency(result.totalTaxWithheld)}</p>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t">
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <QrCode className="w-4 h-4" />
                    <span>Verification Code: <code className="font-mono font-medium">{result.verificationCode}</code></span>
                  </div>
                </div>
              </div>

              {/* Landlord Info */}
              {result.landlord && (
                <div className="card">
                  <h3 className="font-bold mb-4">Certificate Holder</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Name</p>
                      <p className="font-medium">{result.landlord.name}</p>
                    </div>
                    {result.landlord.tinNumber && (
                      <div>
                        <p className="text-gray-500">TIN</p>
                        <p className="font-medium">{result.landlord.tinNumber}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Disclaimer */}
              <div className="card bg-yellow-50 border-yellow-200">
                <h3 className="font-bold text-yellow-800 mb-2">Important Notice</h3>
                <p className="text-sm text-yellow-700">
                  This verification confirms that the certificate was issued by the Ghana Rental
                  Taxation Platform. For official tax filing purposes, please use the original
                  certificate document. If you have any concerns about this certificate,
                  please contact the Ghana Revenue Authority.
                </p>
              </div>
            </div>
          )}

          {/* Info Section */}
          {!result && !error && (
            <div className="mt-8 space-y-6">
              <div className="card">
                <h3 className="font-bold mb-4">What is this portal?</h3>
                <p className="text-gray-600">
                  This portal allows you to verify the authenticity of tax withholding certificates
                  issued through the Ghana Rental Taxation Platform. Landlords receive these certificates
                  as proof of tax withheld on rental income.
                </p>
              </div>

              <div className="card">
                <h3 className="font-bold mb-4">How to verify</h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-600">
                  <li>Find the verification code on the certificate (usually at the bottom)</li>
                  <li>Or scan the QR code on the certificate</li>
                  <li>Enter the code in the field above</li>
                  <li>Click "Verify" to check authenticity</li>
                </ol>
              </div>

              <div className="card">
                <h3 className="font-bold mb-4">Need help?</h3>
                <p className="text-gray-600">
                  If you encounter any issues or believe a certificate is fraudulent,
                  please contact the Ghana Revenue Authority at{' '}
                  <a href="tel:+233302740840" className="text-ghana-green hover:underline">
                    +233 302 740 840
                  </a>
                  {' '}or email{' '}
                  <a href="mailto:support@gra.gov.gh" className="text-ghana-green hover:underline">
                    support@gra.gov.gh
                  </a>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-100 py-6 mt-8">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          <p>Ghana Rental Taxation Platform - A Government of Ghana Initiative</p>
          <p className="mt-1">In partnership with the Ghana Revenue Authority</p>
        </div>
      </div>
    </div>
  );
};

export default VerifyCertificate;
