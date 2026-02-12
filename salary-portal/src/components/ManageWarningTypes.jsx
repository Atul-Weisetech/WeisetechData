import React, { useState, useEffect } from 'react';

function ManageWarningTypes({ onClose }) {const defaultTypes = [    'Attendance Issue',
    'Performance Issue',
    'Behavioral Issue',
    'Policy Violation',
    'Quality Issue',
    'Deadline Missed',
    'Other'
  ];

  const [warningTypes, setWarningTypes] = useState([]);
  const [newType, setNewType] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    loadWarningTypes();
  }, []);

  const loadWarningTypes = () => {
    try {
      const stored = localStorage.getItem('custom_warning_types');
      if (stored) {
        const parsed = JSON.parse(stored);
        setWarningTypes(parsed);
      } else {
        setWarningTypes(defaultTypes);
      }
    } catch (error) {
      console.error('Error loading warning types:', error);
      setWarningTypes(defaultTypes);
    }
  };

  const saveWarningTypes = (types) => {
    try {
      localStorage.setItem('custom_warning_types', JSON.stringify(types));
      setWarningTypes(types);
    } catch (error) {
      console.error('Error saving warning types:', error);
      alert('Failed to save warning types');
    }
  };

  const handleAdd = () => {
    if (!newType.trim()) {
      alert('Please enter a warning type');
      return;
    }
    if (warningTypes.includes(newType.trim())) {
      alert('This warning type already exists');
      return;
    }
    const updated = [...warningTypes, newType.trim()];
    saveWarningTypes(updated);
    setNewType('');
  };

  const handleEdit = (index) => {
    setEditingIndex(index);
    setEditValue(warningTypes[index]);
  };

  const handleSaveEdit = () => {
    if (!editValue.trim()) {
      alert('Warning type cannot be empty');
      return;
    }
    if (warningTypes.includes(editValue.trim()) && warningTypes.indexOf(editValue.trim()) !== editingIndex) {
      alert('This warning type already exists');
      return;
    }
    const updated = [...warningTypes];
    updated[editingIndex] = editValue.trim();
    saveWarningTypes(updated);
    setEditingIndex(null);
    setEditValue('');
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditValue('');
  };

  const handleDelete = (index) => {
    if (defaultTypes.includes(warningTypes[index])) {
      if (!window.confirm('This is a default warning type. Are you sure you want to remove it?')) {
        return;
      }
    } else {
      if (!window.confirm('Are you sure you want to delete this warning type?')) {
        return;
      }
    }
    const updated = warningTypes.filter((_, i) => i !== index);
    saveWarningTypes(updated);
  };

  const handleReset = () => {
    if (window.confirm('Reset to default warning types? This will remove all custom types.')) {
      saveWarningTypes(defaultTypes);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Manage Warning Types</h2>
            <p className="text-sm text-gray-600 mt-1">Add, edit, or remove warning types</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {/* Add New Type */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Add New Warning Type
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
                placeholder="Enter warning type name"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <button
                onClick={handleAdd}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          {/* Warning Types List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Warning Types</h3>
              <button
                onClick={handleReset}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Reset to Defaults
              </button>
            </div>
            <div className="space-y-2">
              {warningTypes.map((type, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                >
                  {editingIndex === index ? (
                    <>
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex-1 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') handleSaveEdit();
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                        autoFocus
                      />
                      <button
                        onClick={handleSaveEdit}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-3 py-1 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded text-sm"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-gray-900">{type}</span>
                      {defaultTypes.includes(type) && (
                        <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">Default</span>
                      )}
                      <button
                        onClick={() => handleEdit(index)}
                        className="px-3 py-1 text-indigo-600 hover:text-indigo-700 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(index)}
                        className="px-3 py-1 text-red-600 hover:text-red-700 text-sm"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default ManageWarningTypes;
