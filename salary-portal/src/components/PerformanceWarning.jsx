import React, { useState } from "react";
import { Settings, Plus } from "lucide-react";
import CreatePerformanceWarning from "./CreatePerformanceWarning";
import ViewPerformanceWarnings from "./ViewPerformanceWarnings";
import ManageWarningTypes from "./ManageWarningTypes";

function PerformanceWarning() {
  const [activeView, setActiveView] = useState("main");
  const [showManageTypes, setShowManageTypes] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  if (activeView === "create") {
    return (
      <CreatePerformanceWarning
        onCancel={() => setActiveView("main")}
        onSuccess={() => {
          setActiveView("main");
          setRefreshKey((prev) => prev + 1);
        }}
      />
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Performance Warning
          </h1>
          <p className="text-lg text-gray-600">
            Manage employee performance warnings
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Create Warning Button */}
          <button
            onClick={() => setActiveView("create")}
            className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
          >
            <Plus size={18} />
            Create Warning
          </button>

          {/* Manage Warning Types Button */}
          <button
            onClick={() => setShowManageTypes(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
          >
            <Settings size={18} />
            Manage Warning Types
          </button>
        </div>
      </div>

      {/* Show warnings list by default */}
      <ViewPerformanceWarnings key={refreshKey} onBack={null} />

      {showManageTypes && (
        <ManageWarningTypes
          onClose={() => {
            setShowManageTypes(false);
            setRefreshKey((prev) => prev + 1);
          }}
        />
      )}
    </div>
  );
}

export default PerformanceWarning;
