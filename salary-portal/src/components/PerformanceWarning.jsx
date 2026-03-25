import { useState } from "react";
import { Settings, Plus, RefreshCw } from "lucide-react";
import CreatePerformanceWarning from "./CreatePerformanceWarning";
import ViewPerformanceWarnings from "./ViewPerformanceWarnings";
import ManageWarningTypes from "./ManageWarningTypes";

function PerformanceWarning() {
  const [activeView, setActiveView] = useState("main");
  const [showManageTypes, setShowManageTypes] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="p-6">
      {activeView === "create" ? (
        <CreatePerformanceWarning
          onCancel={() => setActiveView("main")}
          onSuccess={() => {
            setActiveView("main");
            setRefreshKey((prev) => prev + 1);
          }}
        />
      ) : (
        <>
          <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Performance Warning
              </h1>
              <p className="text-lg text-gray-600">
                Manage employee performance warnings
              </p>
            </div>

            <div className="flex flex-wrap justify-end gap-3 ml-auto">
              <button
                onClick={() => setActiveView("create")}
                className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2.5 px-5 rounded-lg transition-colors flex items-center gap-2"
              >
                <Plus size={16} />
                Create Warning
              </button>

              <button
                onClick={() => setShowManageTypes(true)}
                className="bg-primary-50 hover:bg-primary-100 text-primary-700 font-semibold py-2.5 px-5 rounded-lg transition-colors flex items-center gap-2 border border-primary-300"
              >
                <Settings size={16} />
                Manage Warning Types
              </button>

              <button
                onClick={() => setRefreshKey((prev) => prev + 1)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 px-5 rounded-lg transition-colors flex items-center gap-2 border border-gray-300"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>
          </div>

          <ViewPerformanceWarnings key={refreshKey} onBack={null} />

          {showManageTypes && (
            <ManageWarningTypes
              onClose={() => {
                setShowManageTypes(false);
                setRefreshKey((prev) => prev + 1);
              }}
            />
          )}
        </>
      )}
    </div>
  );
}

export default PerformanceWarning;
