import React, { useState } from 'react';
import CreatePerformanceWarning from './CreatePerformanceWarning';
import ViewPerformanceWarnings from './ViewPerformanceWarnings';
import ManageWarningTypes from './ManageWarningTypes';

function PerformanceWarning() {
  const [activeView, setActiveView] = useState('main'); // 'main', 'create', 'manageTypes'
  const [showManageTypes, setShowManageTypes] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  if (activeView === 'create') {
    return (
      <CreatePerformanceWarning 
        onCancel={() => setActiveView('main')}
        onSuccess={() => {
          setActiveView('main');
          setRefreshKey(prev => prev + 1);
        }}
      />
    );
  }
                                                                                              
  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Performance Warning</h1>
          <p className="text-lg text-gray-600">Manage employee performance warnings</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setActiveView('create')}
            className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105"
          >
            ➕ Create Warning
          </button>
          <button
            onClick={() => setShowManageTypes(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105"
          >
            ⚙️ Manage Warning Types
          </button>
        </div>
      </div>

      {/* Show warnings list by default */}
      <ViewPerformanceWarnings 
        key={refreshKey}
        onBack={null}
      />

      {showManageTypes && (
        <ManageWarningTypes 
          onClose={() => {
            setShowManageTypes(false);
            setRefreshKey(prev => prev + 1); // Refresh to reload warning types
          }}
        />
      )}
    </div>
  );
}

export default PerformanceWarning;
