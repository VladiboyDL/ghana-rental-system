import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, AlertTriangle, CheckCircle, Clock, MapPin, Calendar,
  User, FileText, Upload, Building, Image, MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';
import { caseAPI } from '../services/api';
import useAuthStore from '../store/authStore';

const CaseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [inspectionNotes, setInspectionNotes] = useState('');
  const [outcome, setOutcome] = useState('');
  const [outcomeNotes, setOutcomeNotes] = useState('');
  const [penaltyAmount, setPenaltyAmount] = useState('');
  const { user, isInspector, isGRAOfficer } = useAuthStore();

  useEffect(() => {
    loadCase();
  }, [id]);

  const loadCase = async () => {
    try {
      const response = await caseAPI.getById(id);
      setCaseData(response.data.data);
    } catch (error) {
      toast.error('Failed to load case');
      navigate('/cases');
    } finally {
      setLoading(false);
    }
  };

  const scheduleInspection = async () => {
    const date = prompt('Enter inspection date (YYYY-MM-DD):');
    if (!date) return;

    setUpdating(true);
    try {
      await caseAPI.scheduleInspection(id, { scheduledDate: date });
      toast.success('Inspection scheduled');
      loadCase();
    } catch (error) {
      toast.error('Failed to schedule inspection');
    } finally {
      setUpdating(false);
    }
  };

  const submitReport = async () => {
    if (!outcome) {
      toast.error('Please select an outcome');
      return;
    }

    setUpdating(true);
    try {
      await caseAPI.submitReport(id, {
        inspectionNotes,
        outcome,
        outcomeNotes,
        penaltyAmount: penaltyAmount ? parseFloat(penaltyAmount) : undefined
      });
      toast.success('Report submitted');
      loadCase();
    } catch (error) {
      toast.error('Failed to submit report');
    } finally {
      setUpdating(false);
    }
  };

  const closeCase = async () => {
    if (!window.confirm('Are you sure you want to close this case?')) return;

    setUpdating(true);
    try {
      await caseAPI.closeCase(id);
      toast.success('Case closed');
      loadCase();
    } catch (error) {
      toast.error('Failed to close case');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'OPEN': { class: 'badge-warning', icon: AlertTriangle, color: 'yellow' },
      'ASSIGNED': { class: 'badge-info', icon: User, color: 'blue' },
      'IN_PROGRESS': { class: 'badge-info', icon: Clock, color: 'blue' },
      'PENDING_REVIEW': { class: 'badge-warning', icon: FileText, color: 'orange' },
      'CLOSED': { class: 'badge-success', icon: CheckCircle, color: 'green' },
      'ESCALATED': { class: 'badge-danger', icon: AlertTriangle, color: 'red' }
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

  if (!caseData) {
    return null;
  }

  const statusInfo = getStatusBadge(caseData.status);
  const StatusIcon = statusInfo.icon;
  const canInspect = isInspector() && caseData.assignedInspectorId === user?.id;
  const canReview = isGRAOfficer() && caseData.status === 'PENDING_REVIEW';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">{caseData.caseNumber}</h1>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`badge ${statusInfo.class}`}>
                {caseData.status.replace(/_/g, ' ')}
              </span>
              <span className={`px-2 py-1 text-xs rounded-full ${
                caseData.priority === 'HIGH' ? 'bg-red-100 text-red-700' :
                caseData.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                'bg-green-100 text-green-700'
              }`}>
                {caseData.priority} Priority
              </span>
            </div>
          </div>
        </div>
        {canReview && caseData.status === 'PENDING_REVIEW' && (
          <button onClick={closeCase} disabled={updating} className="btn btn-primary">
            Approve & Close Case
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Case Description */}
          <div className="card">
            <h2 className="text-lg font-bold mb-4">Case Details</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Case Type</p>
                <p className="font-medium">{caseData.caseType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Description</p>
                <p className="text-gray-700">{caseData.description}</p>
              </div>
              {caseData.allegations && caseData.allegations.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500">Allegations</p>
                  <ul className="list-disc list-inside text-gray-700">
                    {caseData.allegations.map((allegation, index) => (
                      <li key={index}>{allegation}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Source</p>
                  <p className="font-medium">{caseData.source}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Risk Score</p>
                  <p className={`font-bold text-xl ${
                    caseData.riskScore > 70 ? 'text-red-600' :
                    caseData.riskScore > 40 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {caseData.riskScore}/100
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Property Info */}
          {caseData.property && (
            <div className="card">
              <h2 className="text-lg font-bold mb-4 flex items-center">
                <Building className="w-5 h-5 mr-2" />
                Property Information
              </h2>
              <Link to={`/properties/${caseData.property.id}`} className="block hover:bg-gray-50 -m-4 p-4 rounded-xl">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold">{caseData.property.propertyTypeName}</p>
                    <p className="text-gray-500">{caseData.property.digitalAddress}</p>
                    <div className="flex items-center text-sm text-gray-400 mt-1">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span>{caseData.property.neighborhood}, {caseData.property.district}</span>
                    </div>
                  </div>
                  <span className="text-ghana-green">View &rarr;</span>
                </div>
              </Link>
            </div>
          )}

          {/* Inspection Section - For Inspectors */}
          {canInspect && caseData.status !== 'CLOSED' && (
            <div className="card">
              <h2 className="text-lg font-bold mb-4">Inspection Report</h2>

              {caseData.status === 'ASSIGNED' && (
                <div className="mb-4">
                  <button
                    onClick={scheduleInspection}
                    disabled={updating}
                    className="btn btn-secondary"
                  >
                    Schedule Inspection
                  </button>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Inspection Notes
                  </label>
                  <textarea
                    value={inspectionNotes}
                    onChange={(e) => setInspectionNotes(e.target.value)}
                    rows={4}
                    className="input"
                    placeholder="Document your inspection findings..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Outcome *
                  </label>
                  <select
                    value={outcome}
                    onChange={(e) => setOutcome(e.target.value)}
                    className="input"
                  >
                    <option value="">Select Outcome</option>
                    <option value="COMPLIANT">Compliant - No Issues Found</option>
                    <option value="NON_COMPLIANT">Non-Compliant - Violations Found</option>
                    <option value="PARTIALLY_COMPLIANT">Partially Compliant - Minor Issues</option>
                    <option value="INCONCLUSIVE">Inconclusive - More Info Needed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Outcome Notes
                  </label>
                  <textarea
                    value={outcomeNotes}
                    onChange={(e) => setOutcomeNotes(e.target.value)}
                    rows={3}
                    className="input"
                    placeholder="Additional notes about the outcome..."
                  />
                </div>
                {outcome === 'NON_COMPLIANT' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Recommended Penalty (GHS)
                    </label>
                    <input
                      type="number"
                      value={penaltyAmount}
                      onChange={(e) => setPenaltyAmount(e.target.value)}
                      className="input"
                      placeholder="0.00"
                    />
                  </div>
                )}
                <button
                  onClick={submitReport}
                  disabled={updating || !outcome}
                  className="btn btn-primary"
                >
                  {updating ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </div>
          )}

          {/* Evidence */}
          {caseData.evidence && caseData.evidence.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-bold mb-4 flex items-center">
                <Image className="w-5 h-5 mr-2" />
                Evidence
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {caseData.evidence.map((item, index) => (
                  <div key={index} className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                    <Image className="w-8 h-8 text-gray-400" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Outcome (if completed) */}
          {caseData.outcome && (
            <div className="card">
              <h2 className="text-lg font-bold mb-4">Inspection Outcome</h2>
              <div className="space-y-4">
                <div className={`p-4 rounded-lg ${
                  caseData.outcome === 'COMPLIANT' ? 'bg-green-50 border border-green-200' :
                  caseData.outcome === 'NON_COMPLIANT' ? 'bg-red-50 border border-red-200' :
                  'bg-yellow-50 border border-yellow-200'
                }`}>
                  <p className="font-bold">{caseData.outcome.replace(/_/g, ' ')}</p>
                  {caseData.outcomeNotes && (
                    <p className="text-sm mt-2">{caseData.outcomeNotes}</p>
                  )}
                </div>
                {caseData.penaltyAmount > 0 && (
                  <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg">
                    <span className="font-medium">Penalty Amount</span>
                    <span className="text-xl font-bold text-red-600">
                      {formatCurrency(caseData.penaltyAmount)}
                    </span>
                  </div>
                )}
                {caseData.inspectionNotes && (
                  <div>
                    <p className="text-sm text-gray-500">Inspection Notes</p>
                    <p className="text-gray-700">{caseData.inspectionNotes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <div className="card">
            <h2 className="text-lg font-bold mb-4">Status</h2>
            <div className={`flex items-center space-x-2 p-4 rounded-lg bg-${statusInfo.color}-50`}>
              <StatusIcon className={`w-6 h-6 text-${statusInfo.color}-600`} />
              <span className="font-medium">{caseData.status.replace(/_/g, ' ')}</span>
            </div>
          </div>

          {/* Assignment */}
          <div className="card">
            <h2 className="text-lg font-bold mb-4">Assignment</h2>
            {caseData.assignedInspector ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-500">Assigned Inspector</p>
                <p className="font-medium">{caseData.assignedInspector.name}</p>
                <p className="text-sm text-gray-500">{caseData.assignedInspector.phone}</p>
                {caseData.assignedAt && (
                  <p className="text-xs text-gray-400">
                    Assigned on {formatDate(caseData.assignedAt)}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-gray-500">Not yet assigned</p>
            )}
          </div>

          {/* Schedule */}
          {(caseData.scheduledDate || caseData.inspectionDate) && (
            <div className="card">
              <h2 className="text-lg font-bold mb-4">Schedule</h2>
              <div className="space-y-3">
                {caseData.scheduledDate && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Scheduled</p>
                      <p className="font-medium">{formatDate(caseData.scheduledDate)}</p>
                    </div>
                  </div>
                )}
                {caseData.inspectionDate && (
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="text-sm text-gray-500">Inspected</p>
                      <p className="font-medium">{formatDate(caseData.inspectionDate)}</p>
                    </div>
                  </div>
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
                  <p className="text-gray-500">{formatDate(caseData.createdAt)}</p>
                </div>
              </div>
              {caseData.assignedAt && (
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <div>
                    <p className="font-medium">Assigned</p>
                    <p className="text-gray-500">{formatDate(caseData.assignedAt)}</p>
                  </div>
                </div>
              )}
              {caseData.completedAt && (
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  <div>
                    <p className="font-medium">Inspection Completed</p>
                    <p className="text-gray-500">{formatDate(caseData.completedAt)}</p>
                  </div>
                </div>
              )}
              {caseData.closedAt && (
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <div>
                    <p className="font-medium">Closed</p>
                    <p className="text-gray-500">{formatDate(caseData.closedAt)}</p>
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

export default CaseDetails;
