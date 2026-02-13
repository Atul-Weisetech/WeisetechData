import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNotification } from '../contexts/NotificationContext';

function ViewPerformanceWarnings({ onBack }) {
  const { showSuccess, showError, showConfirm } = useNotification();
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ overall_notes: '', warning_types: [] });
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailWarning, setDetailWarning] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const getWarningTypes = () => {
    try {
      const stored = localStorage.getItem('custom_warning_types');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading warning types:', error);
    }
    return [
      'Attendance Issue',
      'Performance Issue',
      'Behavioral Issue',
      'Policy Violation',
      'Quality Issue',
      'Deadline Missed',
      'Other'
    ];
  };

  const [warningTypes, setWarningTypes] = useState(getWarningTypes());

  useEffect(() => {
    fetchWarnings();
    // Reload warning types in case they were updated
    setWarningTypes(getWarningTypes());
  }, []);

  const fetchWarnings = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/performance-warnings');
      setWarnings(res.data?.data || res.data || []);
      setError('');
    } catch (error) {
      console.error('Error fetching performance warnings:', error);
      setError('Failed to load performance warnings');
      setWarnings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    showConfirm(
      'Are you sure you want to delete this warning?',
      async () => {
        try {
          await axios.delete(`http://localhost:5000/api/performance-warnings/${id}`);
          showSuccess('Warning deleted successfully');
          fetchWarnings();
        } catch (error) {
          console.error('Error deleting warning:', error);
          showError('Failed to delete warning: ' + (error.response?.data?.error || error.message));
        }
      },
      () => {
        // User cancelled, do nothing
      }
    );
  };

  const handleEdit = async (warning) => {
    try {
      // Fetch full details with descriptions for editing
      const res = await axios.get(`http://localhost:5000/api/performance-warnings/${warning.id}`);
      const fullWarning = res.data?.data;
      
      setEditingId(warning.id);
      setEditForm({
        overall_notes: fullWarning?.overall_notes || '',
        warning_types: fullWarning?.warning_types ? fullWarning.warning_types.map(wt => ({
          warning_type: typeof wt === 'string' ? wt : wt.warning_type || '',
          description: typeof wt === 'string' ? '' : wt.description || ''
        })) : []
      });
    } catch (error) {
      console.error('Error fetching warning details:', error);
      // Fallback to basic data if fetch fails
      setEditingId(warning.id);
      setEditForm({
        overall_notes: warning.overall_notes || '',
        warning_types: warning.warning_types ? warning.warning_types.map(wt => ({
          warning_type: typeof wt === 'string' ? wt : wt.warning_type || '',
          description: ''
        })) : []
      });
    }
  };

  const handleSaveEdit = async (id) => {
    try {
      await axios.put(`http://localhost:5000/api/performance-warnings/${id}`, editForm);
      showSuccess('Warning updated successfully');
      setEditingId(null);
      fetchWarnings();
    } catch (error) {
      console.error('Error updating warning:', error);
      showError('Failed to update warning: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ overall_notes: '', warning_types: [] });
  };

  const addWarningTypeToEdit = () => {
    setEditForm({
      ...editForm,
      warning_types: [...editForm.warning_types, { warning_type: '', description: '' }]
    });
  };

  const removeWarningTypeFromEdit = (index) => {
    setEditForm({
      ...editForm,
      warning_types: editForm.warning_types.filter((_, i) => i !== index)
    });
  };

  const updateWarningTypeInEdit = (index, field, value) => {
    const updated = [...editForm.warning_types];
    updated[index] = { ...updated[index], [field]: value };
    setEditForm({ ...editForm, warning_types: updated });
  };

  const handleRowClick = async (warning) => {
    // Don't open modal if clicking on action buttons or if editing
    if (editingId === warning.id) return;
    
    try {
      setLoadingDetail(true);
      const res = await axios.get(`http://localhost:5000/api/performance-warnings/${warning.id}`);
      const data = res.data?.data || res.data || null;
      console.log('Fetched warning details:', data); // Debug log
      setDetailWarning(data);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Error fetching warning details:', error);
      showError('Failed to load warning details: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoadingDetail(false);
    }
  };

  const filteredWarnings = warnings;

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="w-full">
      {onBack && (
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">View Performance Warnings</h1>
            <p className="text-lg text-gray-600">View and manage all performance warnings</p>
          </div>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
          >
            ← Back
          </button>
        </div>
      )}

      {/* Refresh Button */}
      <div className="mb-6 flex justify-end">
        <button
          onClick={fetchWarnings}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
        >
          🔄 Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading warnings...</p>
        </div>
      ) : filteredWarnings.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <p className="text-gray-600 text-lg">No performance warnings found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Warning Types
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Overall Notes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredWarnings.map((warning) => (
                  <tr 
                    key={warning.id} 
                    className={`hover:bg-gray-50 ${editingId !== warning.id ? 'cursor-pointer' : ''}`}
                    onClick={() => editingId !== warning.id && handleRowClick(warning)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {warning.employee_name || `Employee ${warning.employee_id}`}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {editingId === warning.id ? (
                        <div className="space-y-2">
                          {editForm.warning_types.map((wt, idx) => (
                            <div key={idx} className="flex gap-2 items-start">
                              <select
                                value={wt.warning_type}
                                onChange={(e) => updateWarningTypeInEdit(idx, 'warning_type', e.target.value)}
                                className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
                              >
                                <option value="">-- Select type --</option>
                                {warningTypes.map((type) => (
                                  <option key={type} value={type}>
                                    {type}
                                  </option>
                                ))}
                              </select>
                              <textarea
                                value={wt.description}
                                onChange={(e) => updateWarningTypeInEdit(idx, 'description', e.target.value)}
                                placeholder="Note..."
                                rows={1}
                                className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
                              />
                              {editForm.warning_types.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeWarningTypeFromEdit(idx)}
                                  className="text-red-600 hover:text-red-800 text-xs"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={addWarningTypeToEdit}
                            className="text-xs text-primary-600 hover:text-primary-700"
                          >
                            + Add type
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {warning.warning_types && warning.warning_types.length > 0 ? (
                            warning.warning_types.map((wt, idx) => {
                              // Handle both string format (from API) and object format (legacy/fallback)
                              const warningTypeName = typeof wt === 'string' ? wt : wt.warning_type;
                              return (
                                <span
                                  key={idx}
                                  className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800 mr-2 mb-1"
                                >
                                  {warningTypeName}
                                </span>
                              );
                            })
                          ) : (
                            <span className="text-xs text-gray-400">No warning types</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingId === warning.id ? (
                        <textarea
                          value={editForm.overall_notes}
                          onChange={(e) => setEditForm({ ...editForm, overall_notes: e.target.value })}
                          rows={3}
                          className="w-full px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 text-sm"
                          placeholder="Overall notes..."
                        />
                      ) : (
                        <div className="text-sm text-gray-900 max-w-md">
                          {warning.overall_notes || '—'}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {warning.created_by || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(warning.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {editingId === warning.id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveEdit(warning.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            ✓ Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            ✕ Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleEdit(warning)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDelete(warning.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Performance Warning Details</h2>
                <p className="text-sm text-gray-600 mt-1">Complete information about this warning</p>
              </div>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setDetailWarning(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1">
              {loadingDetail ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
                  <p className="mt-4 text-gray-600">Loading details...</p>
                </div>
              ) : detailWarning ? (
                <div className="space-y-6">
                  {/* Employee Details */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Employee Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Employee Name</label>
                        <p className="text-base text-gray-900 mt-1">
                          {detailWarning.employee?.name || detailWarning.employee_name || '—'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Employee ID</label>
                        <p className="text-base text-gray-900 mt-1">
                          {detailWarning.employee?.id || detailWarning.employee_id || '—'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Warning Types */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Warning Types</h3>
                    {detailWarning.warning_types && detailWarning.warning_types.length > 0 ? (
                      <div className="space-y-4">
                        {detailWarning.warning_types.map((wt, idx) => (
                          <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-white">
                            <div className="mb-2">
                              <span className="px-3 py-1 inline-flex text-sm font-semibold rounded-full bg-orange-100 text-orange-800">
                                {wt.warning_type}
                              </span>
                            </div>
                            {wt.description && (
                              <div className="mt-2">
                                <label className="text-sm font-medium text-gray-600">Description</label>
                                <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">{wt.description}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No warning types assigned</p>
                    )}
                  </div>

                  {/* Overall Note */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Overall Note</h3>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">
                      {detailWarning.overall_note || detailWarning.overall_notes || 'No overall note provided'}
                    </p>
                  </div>

                  {/* Metadata */}
                  <div className="border-t border-gray-200 pt-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <label className="font-medium text-gray-600">Created By</label>
                        <p className="text-gray-900 mt-1">{detailWarning.created_by || '—'}</p>
                      </div>
                      <div>
                        <label className="font-medium text-gray-600">Created At</label>
                        <p className="text-gray-900 mt-1">{formatDate(detailWarning.created_at)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-600">No details available</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setDetailWarning(null);
                }}
                className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ViewPerformanceWarnings;
