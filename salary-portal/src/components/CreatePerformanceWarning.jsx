import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaArrowLeft } from 'react-icons/fa';
import { useNotification } from '../contexts/NotificationContext';
import API_BASE from '../config';

const initialWarningRow = () => ({ warning_type: '', notes: '' });

function CreatePerformanceWarning({ onCancel, onSuccess }) {
  const { showSuccess, showWarning, showError } = useNotification();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const [overallNotes, setOverallNotes] = useState('');
  const [warnings, setWarnings] = useState([initialWarningRow()]);
  const [error, setError] = useState('');

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
    fetchEmployees();
    setWarningTypes(getWarningTypes());
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/employees`);
      setEmployees(res.data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setError('Failed to load employees');
    }
  };

  const addWarningRow = () => {
    setWarnings((prev) => [...prev, initialWarningRow()]);
  };

  const removeWarningRow = (index) => {
    if (warnings.length <= 1) return;
    setWarnings((prev) => prev.filter((_, i) => i !== index));
  };

  const updateWarningRow = (index, field, value) => {
    setWarnings((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!employeeId) {
      setError('Please select an employee');
      setLoading(false);
      return;
    }

    const validRows = warnings.filter((row) => row.warning_type && row.warning_type.trim());
    if (validRows.length === 0) {
      setError('Please add at least one warning type');
      setLoading(false);
      return;
    }

    try {
      const selectedEmployee = employees.find((emp) => emp.employee_id === parseInt(employeeId));
      const employee_name = selectedEmployee
        ? `${selectedEmployee.first_name || ''} ${selectedEmployee.last_name || ''}`.trim()
        : '';
      const created_by = localStorage.getItem('name') || localStorage.getItem('email') || 'HR/Admin';

      // Prepare warning_types array
      const warning_types = validRows.map(row => ({
        warning_type: row.warning_type,
        description: row.notes || ''
      }));

      // Create single warning with multiple warning types
      const response = await axios.post(`${API_BASE}/api/performance-warnings`, {
        employee_id: parseInt(employeeId),
        employee_name: employee_name || `Employee ${employeeId}`,
        overall_notes: overallNotes || '',
        warning_types: warning_types,
        created_by: created_by
      });

      const previousCount = response.data?.previous_warning_count || 0;
      
      // Show notification if employee already has previous warnings
      if (previousCount > 0) {
        showWarning(`This employee already has ${previousCount} performance warning(s).`);
        // Show success notification after a short delay
        setTimeout(() => {
          showSuccess('Performance warning created successfully!');
        }, 500);
      } else {
        showSuccess('Performance warning created successfully!');
      }
      
      setEmployeeId('');
      setOverallNotes('');
      setWarnings([initialWarningRow()]);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Error creating performance warning:', err);
      const errorMessage = err.response?.data?.error ||
        err.response?.data?.message ||
        'Failed to create performance warning';
      setError(errorMessage);
      // Also show error notification
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 w-full">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onCancel}
          className="flex items-center gap-2 text-gray-600 hover:text-blue-700 transition text-sm font-medium"
        >
          <FaArrowLeft size={13} /> Back
        </button>
        <h2 className="text-xl font-semibold text-blue-700">Create Performance Warning</h2>
        <div className="w-16" />
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 w-full">
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Employee Selection */}
          <div>
            <label htmlFor="employee_id" className="block text-sm font-semibold text-gray-700 mb-2">
              Select Employee <span className="text-red-500">*</span>
            </label>
            <select
              id="employee_id"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            >
              <option value="">-- Select Employee --</option>
              {employees.map((emp) => {
                const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '';
                return (
                  <option key={emp.employee_id} value={emp.employee_id}>
                    {cap(emp.first_name)} {cap(emp.last_name)}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Warning types + notes (multiple rows) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-semibold text-gray-700">
                Warning Types & Notes <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={addWarningRow}
                className="text-sm px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
              >
                + Add another warning
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Add one or more warning types. Each warning can have its own note.
            </p>
            <div className="space-y-4">
              {warnings.map((row, index) => (
                <div
                  key={index}
                  className="p-4 border border-gray-200 rounded-lg bg-gray-50/50 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Warning #{index + 1}</span>
                    {warnings.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeWarningRow(index)}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Warning Type</label>
                    <select
                      value={row.warning_type}
                      onChange={(e) => updateWarningRow(index, 'warning_type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">-- Select type --</option>
                      {warningTypes
                        .filter((type) =>
                          type === row.warning_type ||
                          !warnings.some((w, i) => i !== index && w.warning_type === type)
                        )
                        .map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                  </div>
                  {row.warning_type && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Note for this warning</label>
                      <textarea
                        value={row.notes}
                        onChange={(e) => updateWarningRow(index, 'notes', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                        placeholder="Add note for this warning..."
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Overall Notes (shown last) */}
          <div>
            <label htmlFor="overall_notes" className="block text-sm font-semibold text-gray-700 mb-2">
              Overall Note (applies to all warnings)
            </label>
            <textarea
              id="overall_notes"
              value={overallNotes}
              onChange={(e) => setOverallNotes(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              placeholder="Write the overall problem/issue here..."
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center gap-3 mt-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-primary-600 text-white px-6 py-2 rounded hover:bg-primary-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Warning'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="w-40 border border-gray-300 text-gray-600 bg-gray-200 px-6 py-2 rounded hover:bg-gray-300 font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreatePerformanceWarning;
