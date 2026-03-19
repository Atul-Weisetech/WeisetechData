import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import API_BASE from "../config";

export default function EmployeeLeaves() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [employeeData, setEmployeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) {
        console.warn("No employee ID provided");
        setError("Employee ID is missing");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      setLeaveRequests([]);
      setEmployeeData(null);
      
      console.log("=== Loading data for employee ID:", id, "===");
      
      try {
        // Fetch leave requests for employee - using same pattern as WelcomeEmployee.jsx
        const leaveRes = await axios.get(
          `${API_BASE}/api/leave-requests/employee/${id}`
        );
        
        console.log("Raw Leave API Response:", JSON.stringify(leaveRes.data, null, 2));
        
        // Use exact same parsing logic as WelcomeEmployee.jsx (line 118-120)
        const leaves = Array.isArray(leaveRes.data)
          ? leaveRes.data
          : leaveRes.data?.data || [];
        
        console.log(`✓ Parsed ${leaves.length} leave request(s) for employee ${id}`);
        if (leaves.length > 0) {
          console.log("Leave requests:", leaves);
        } else {
          console.log("⚠ No leave requests found in response");
        }
        
        setLeaveRequests(leaves);

        // Fetch employee data
        const employeeRes = await axios.get(
          `${API_BASE}/api/employees/${id}`
        );
        
        console.log("Raw Employee API Response:", JSON.stringify(employeeRes.data, null, 2));
        
        let empData = null;
        if (Array.isArray(employeeRes.data)) {
          empData = employeeRes.data[0] || null;
        } else if (employeeRes.data && typeof employeeRes.data === 'object') {
          empData = employeeRes.data;
        }
        
        console.log(`✓ Parsed employee data:`, empData);
        setEmployeeData(empData);
        
        if (!empData) {
          console.warn(`⚠ Employee data not found for ID: ${id}`);
          setError(`Employee with ID ${id} not found`);
        }
        
        console.log("=== Data loading complete ===");
      } catch (e) {
        console.error("❌ Error loading data for employee", id, ":", e);
        console.error("Error response data:", e.response?.data);
        console.error("Error status:", e.response?.status);
        console.error("Error config URL:", e.config?.url);
        
        const errorMessage = 
          e?.response?.data?.error ||
          e?.response?.data?.message ||
          e?.message ||
          `Failed to fetch data for employee ${id}`;
        
        setError(errorMessage);
        setLeaveRequests([]);
        
        // Try to still fetch employee data even if leave requests fail
        if (e?.config?.url?.includes('/leave-requests')) {
          try {
            const employeeRes = await axios.get(
              `${API_BASE}/api/employees/${id}`
            );
            const empData = Array.isArray(employeeRes.data)
              ? employeeRes.data[0]
              : employeeRes.data;
            setEmployeeData(empData);
          } catch (empErr) {
            console.error("Failed to fetch employee data:", empErr);
            setEmployeeData(null);
          }
        } else {
          setEmployeeData(null);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    filterRequests();
  }, [leaveRequests, activeFilter]);

  const filterRequests = () => {
    if (activeFilter === "all") {
      setFilteredRequests(leaveRequests);
    } else {
      const filtered = leaveRequests.filter((request) => {
        const status = (request.status_text || "").toLowerCase();
        switch (activeFilter) {
          case "pending":
            return status === "requested";
          case "approved":
            return status === "approved";
          case "declined":
            return status === "declined";
          default:
            return true;
        }
      });
      setFilteredRequests(filtered);
    }
  };

  const getStatusBadge = (statusText) => {
    const status = (statusText || "").toLowerCase();
    const statusStyles = {
      requested: "bg-yellow-100 text-yellow-800 border-yellow-200",
      approved: "bg-green-100 text-green-800 border-green-200",
      declined: "bg-red-100 text-red-800 border-red-200",
    };

    const label = status.charAt(0).toUpperCase() + status.slice(1);
    return (
      <span
        className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium border ${
          statusStyles[status] || "bg-gray-100 text-gray-800"
        }`}
      >
        {label}
      </span>
    );
  };

  const getFilterButtonClass = (filterName) => {
    const baseClass = "rounded-lg font-medium transition-colors";
    return activeFilter === filterName
      ? `${baseClass} bg-blue-600 text-white shadow-sm`
      : `${baseClass} bg-white text-gray-700 border border-gray-300 hover:bg-gray-50`;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile Sidebar Drawer */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-72 bg-white shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="font-semibold text-slate-800">Menu</div>
              <button
                type="button"
                onClick={() => setIsSidebarOpen(false)}
                className="w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
                aria-label="Close menu"
              >
                ×
              </button>
            </div>
            <Sidebar
              onSelect={() => setIsSidebarOpen(false)}
              className="shadow-none"
            />
          </div>
        </div>
      )}

      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-56 shrink-0 sticky top-0 h-screen">
          <Sidebar className="h-screen" />
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 overflow-x-hidden max-w-full">
          {/* Header */}
          <header className="mb-6">
            {/* Desktop: Single row with everything */}
            <div className="hidden sm:flex sm:items-center sm:justify-between sm:gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-blue-700 truncate">
                  Employee Leave Requests
                </h1>
              </div>
              <button
                onClick={() => navigate("/welcome?view=employees")}
                className="bg-primary-600 text-white px-3 py-2 rounded hover:bg-primary-700 whitespace-nowrap"
              >
                Back
              </button>
            </div>

            {/* Mobile: Multi-line layout */}
            <div className="sm:hidden space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => setIsSidebarOpen(true)}
                    className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 shadow-sm shrink-0"
                    aria-label="Open menu"
                  >
                    ☰
                  </button>
                  <h1 className="text-lg font-bold text-blue-700 truncate">
                    Employee Leaves
                  </h1>
                </div>
                <button
                  onClick={() => navigate("/welcome?view=employees")}
                  className="bg-primary-600 text-white px-3 py-2 text-sm rounded hover:bg-primary-700 whitespace-nowrap shrink-0"
                >
                  Back
                </button>
              </div>
            </div>

            {/* Employee Info */}
            {employeeData && (
              <div className="mt-4 p-3 sm:p-4 bg-white rounded-lg shadow">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                  {employeeData.first_name} {employeeData.last_name}
                </h2>
                <p className="text-sm text-gray-600">
                  Employee ID: {id} | {employeeData.email_address || ""}
                </p>
              </div>
            )}
          </header>

          {error && (
            <div className="mb-4 px-4 py-2 rounded border border-red-200 bg-red-50 text-red-700">
              {error}
            </div>
          )}

          {/* Filter Buttons */}
          <div className="mb-6 overflow-x-hidden">
            <div className="flex gap-1 sm:gap-2 flex-nowrap">
              <button
                onClick={() => setActiveFilter("all")}
                className={`${getFilterButtonClass(
                  "all"
                )} px-1.5 sm:px-4 py-1 sm:py-2 text-[10px] sm:text-sm whitespace-nowrap flex-1 sm:flex-none`}
              >
                All Requests
              </button>
              <button
                onClick={() => setActiveFilter("pending")}
                className={`${getFilterButtonClass(
                  "pending"
                )} px-1.5 sm:px-4 py-1 sm:py-2 text-[10px] sm:text-sm whitespace-nowrap flex-1 sm:flex-none`}
              >
                Pending
              </button>
              <button
                onClick={() => setActiveFilter("approved")}
                className={`${getFilterButtonClass(
                  "approved"
                )} px-1.5 sm:px-4 py-1 sm:py-2 text-[10px] sm:text-sm whitespace-nowrap flex-1 sm:flex-none`}
              >
                Approved
              </button>
              <button
                onClick={() => setActiveFilter("declined")}
                className={`${getFilterButtonClass(
                  "declined"
                )} px-1.5 sm:px-4 py-1 sm:py-2 text-[10px] sm:text-sm whitespace-nowrap flex-1 sm:flex-none`}
              >
                Declined
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : leaveRequests.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <div className="text-gray-400 text-6xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Leave Requests Found
              </h3>
              <p className="text-gray-500">
                This employee has not submitted any leave requests yet.
              </p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <div className="text-gray-400 text-6xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No {activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)} Requests
              </h3>
              <p className="text-gray-500">
                This employee has no {activeFilter} leave requests. Try selecting a different filter.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden max-w-full">
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          Date Range
                        </th>
                        <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          Days
                        </th>
                        <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          Status
                        </th>
                        <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          Applied Date
                        </th>
                        <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          Reviewed By
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredRequests.map((req) => (
                        <tr key={req.id}>
                          <td className="px-2 sm:px-6 py-4 sm:whitespace-nowrap">
                            <div className="text-xs sm:text-sm text-gray-900">
                              {new Date(req.from_date).toLocaleDateString()} -{" "}
                              {new Date(req.to_date).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-2 sm:px-6 py-4 sm:whitespace-nowrap text-xs sm:text-sm text-gray-900">
                            {req.number_of_days}
                          </td>
                          <td className="px-2 sm:px-6 py-4 text-xs sm:text-sm text-gray-700 max-w-[120px] sm:max-w-xs">
                            <div
                              className="line-clamp-2 sm:line-clamp-1 truncate"
                              title={req.description}
                            >
                              {req.description}
                            </div>
                          </td>
                          <td className="px-2 sm:px-6 py-4 sm:whitespace-nowrap">
                            {getStatusBadge(req.status_text)}
                          </td>
                          <td className="px-2 sm:px-6 py-4 sm:whitespace-nowrap text-xs sm:text-sm text-gray-900">
                            {req.applied_date
                              ? new Date(req.applied_date).toLocaleDateString()
                              : "-"}
                          </td>
                          <td className="px-2 sm:px-6 py-4 sm:whitespace-nowrap text-xs sm:text-sm text-gray-900">
                            {req.reviewed_by || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
