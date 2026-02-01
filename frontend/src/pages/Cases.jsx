import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, AlertTriangle, CheckCircle, Clock, Eye, MapPin,
  Calendar, User, Filter
} from 'lucide-react';
import toast from 'react-hot-toast';
import { caseAPI } from '../services/api';
import useAuthStore from '../store/authStore';

const Cases = () => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const { user, isInspector } = useAuthStore();

  useEffect(() => {
    loadCases();
  }, [filter, priorityFilter]);

  const loadCases = async () => {
    try {
      const params = {
        ...(filter && { status: filter }),
        ...(priorityFilter && { priority: priorityFilter })
      };
      const response = await caseAPI.getAll(params);
      setCases(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load cases');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'OPEN': { class: 'badge-warning', icon: AlertTriangle },
      'ASSIGNED': { class: 'badge-info', icon: User },
      'IN_PROGRESS': { class: 'badge-info', icon: Clock },
      'PENDING_REVIEW': { class: 'badge-warning', icon: Eye },
      'CLOSED': { class: 'badge-success', icon: CheckCircle },
      'ESCALATED': { class: 'badge-danger', icon: AlertTriangle }
    };
    return badges[status] || { class: 'badge-info', icon: Clock };
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      'HIGH': 'bg-red-100 text-red-700',
      'MEDIUM': 'bg-yellow-100 text-yellow-700',
      'LOW': 'bg-green-100 text-green-700'
    };
    return badges[priority] || 'bg-gray-100 text-gray-700';
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
        <h1 className="text-2xl font-bold">Inspection Cases</h1>
        {!isInspector() && (
          <Link to="/cases/new" className="btn btn-primary">
            Create New Case
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card">
          <p className="text-sm text-gray-500">Open</p>
          <p className="text-2xl font-bold text-yellow-600">
            {cases.filter(c => c.status === 'OPEN').length}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">In Progress</p>
          <p className="text-2xl font-bold text-blue-600">
            {cases.filter(c => ['ASSIGNED', 'IN_PROGRESS'].includes(c.status)).length}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Pending Review</p>
          <p className="text-2xl font-bold text-orange-600">
            {cases.filter(c => c.status === 'PENDING_REVIEW').length}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Closed</p>
          <p className="text-2xl font-bold text-green-600">
            {cases.filter(c => c.status === 'CLOSED').length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="input"
            >
              <option value="">All Status</option>
              <option value="OPEN">Open</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="PENDING_REVIEW">Pending Review</option>
              <option value="CLOSED">Closed</option>
              <option value="ESCALATED">Escalated</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="input"
            >
              <option value="">All Priority</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Cases List */}
      {cases.length === 0 ? (
        <div className="card text-center py-12">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600">No cases found</h3>
          <p className="text-gray-400 mt-1">
            {isInspector() ? 'Cases assigned to you will appear here' : 'Create a case to start an inspection'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {cases.map((caseItem) => {
            const statusInfo = getStatusBadge(caseItem.status);
            const StatusIcon = statusInfo.icon;

            return (
              <Link
                key={caseItem.id}
                to={`/cases/${caseItem.id}`}
                className="card hover:shadow-lg transition-shadow block"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-bold">{caseItem.caseNumber}</h3>
                      <span className={`badge ${statusInfo.class} flex items-center space-x-1`}>
                        <StatusIcon className="w-3 h-3" />
                        <span>{caseItem.status.replace(/_/g, ' ')}</span>
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getPriorityBadge(caseItem.priority)}`}>
                        {caseItem.priority}
                      </span>
                    </div>

                    <p className="text-gray-600 mb-3">{caseItem.description}</p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center text-gray-500">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span>{caseItem.property?.neighborhood || 'N/A'}</span>
                      </div>
                      <div className="flex items-center text-gray-500">
                        <span className="text-xs mr-1">Type:</span>
                        <span>{caseItem.caseType}</span>
                      </div>
                      <div className="flex items-center text-gray-500">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>{formatDate(caseItem.createdAt)}</span>
                      </div>
                      {caseItem.assignedInspector && (
                        <div className="flex items-center text-gray-500">
                          <User className="w-4 h-4 mr-2" />
                          <span>{caseItem.assignedInspector.name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {caseItem.riskScore > 0 && (
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Risk Score</p>
                      <p className={`text-2xl font-bold ${
                        caseItem.riskScore > 70 ? 'text-red-600' :
                        caseItem.riskScore > 40 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {caseItem.riskScore}
                      </p>
                    </div>
                  )}
                </div>

                {caseItem.scheduledDate && (
                  <div className="mt-4 pt-4 border-t flex items-center text-sm">
                    <Calendar className="w-4 h-4 mr-2 text-ghana-green" />
                    <span className="text-gray-600">
                      Scheduled: {formatDate(caseItem.scheduledDate)}
                    </span>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Cases;
