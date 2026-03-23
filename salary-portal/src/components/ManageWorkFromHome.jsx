import { useState, useEffect } from "react";
import axios from "axios";
import DataTable from "react-data-table-component";
import { toast } from "react-toastify";
import API_BASE from "../config";

const tableCustomStyles = {
  headRow: { style: { backgroundColor: "#eff6ff", borderBottom: "2px solid #bfdbfe" } },
  headCells: { style: { color: "#374151", fontWeight: "600", fontSize: "13px" } },
  rows: { style: { "&:hover": { backgroundColor: "#f0f9ff" }, alignItems: "flex-start", paddingTop: "8px", paddingBottom: "8px" } },
  pagination: { style: { borderTop: "1px solid #e2e8f0", backgroundColor: "#f8fafc" } },
};

const statusStyles = {
  requested: "bg-yellow-100 text-yellow-800 border-yellow-200",
  approved: "bg-green-100 text-green-800 border-green-200",
  declined: "bg-red-100 text-red-800 border-red-200",
};

const StatusBadge = ({ statusText }) => {
  const status = (statusText || "").toLowerCase();
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusStyles[status] || "bg-gray-100 text-gray-800"}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

function ManageWorkFromHome() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [activeFilter, setActiveFilter] = useState("all");
  const [editingRequest, setEditingRequest] = useState(null);

  useEffect(() => {
    fetchRequests();
    fetchPendingCount();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/work-from-home`);
      setRequests(res.data?.data || res.data || []);
    } catch (error) {
      toast.error("Failed to fetch work from home requests: " + (error.response?.data?.error || error.message));
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingCount = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/work-from-home/pending-count`);
      setPendingCount(res.data?.data?.pending_work_from_home_requests ?? 0);
    } catch {}
  };

  const handleStatusUpdate = async (requestId, newStatus) => {
    try {
      const status = (newStatus || "").toLowerCase() === "rejected" ? "declined" : (newStatus || "").toLowerCase();
      const reviewerName = localStorage.getItem("name") || localStorage.getItem("email") || "HR User";
      await axios.put(`${API_BASE}/api/work-from-home/${requestId}/status`, {
        status,
        reviewed_by: reviewerName,
        reviewed_at: new Date().toISOString(),
      });
      setRequests((prev) =>
        prev.map((req) =>
          req.id === requestId
            ? { ...req, status_text: status.charAt(0).toUpperCase() + status.slice(1), status }
            : req
        )
      );
      if (newStatus === "approved" || newStatus === "declined") {
        const original = requests.find((r) => r.id === requestId);
        if (original?.status_text?.toLowerCase() === "requested")
          setPendingCount((p) => Math.max(0, p - 1));
      }
      setEditingRequest(null);
    } catch {
      toast.error("Failed to update status");
    }
  };

  const filtered = requests.filter((req) => {
    if (activeFilter === "all") return true;
    const status = (req.status_text || "").toLowerCase();
    if (activeFilter === "pending") return status === "requested";
    return status === activeFilter;
  });

  const filterBtnClass = (name) =>
    `px-3 sm:px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
      activeFilter === name
        ? "bg-primary-600 text-white shadow-sm"
        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
    }`;

  const columns = [
    {
      name: "Employee",
      selector: (row) => row.employee_name,
      cell: (row) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{row.employee_name}</div>
          <div className="text-xs text-gray-500">ID: {row.employee_id}</div>
        </div>
      ),
      sortable: true,
      minWidth: "140px",
    },
    {
      name: "Date Range",
      selector: (row) => row.from_date,
      cell: (row) => `${new Date(row.from_date).toLocaleDateString()} – ${new Date(row.to_date).toLocaleDateString()}`,
      sortable: true,
      minWidth: "160px",
    },
    {
      name: "Days",
      selector: (row) => row.number_of_days,
      sortable: true,
      width: "70px",
    },
    {
      name: "Description",
      selector: (row) => row.description,
      cell: (row) => (
        <span title={row.description} className="line-clamp-1 block max-w-[180px] truncate text-sm text-gray-700">
          {row.description}
        </span>
      ),
      grow: 2,
    },
    {
      name: "Status",
      selector: (row) => row.status_text,
      cell: (row) => <StatusBadge statusText={row.status_text} />,
      sortable: true,
      width: "120px",
    },
    {
      name: "Actions",
      cell: (row) =>
        editingRequest?.id === row.id ? (
          <div className="flex flex-col gap-1.5">
            <div className="flex gap-1.5">
              <button
                onClick={() => handleStatusUpdate(row.id, "approved")}
                className="px-2.5 py-1 rounded text-xs font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
              >
                Approve
              </button>
              <button
                onClick={() => handleStatusUpdate(row.id, "declined")}
                className="px-2.5 py-1 rounded text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Decline
              </button>
            </div>
            <button
              onClick={() => setEditingRequest(null)}
              className="text-xs text-gray-500 hover:text-gray-700 underline text-left"
            >
              Cancel
            </button>
          </div>
        ) : (row.status_text || "").toLowerCase() === "requested" ? (
          <div className="flex gap-1.5">
            <button
              onClick={() => handleStatusUpdate(row.id, "approved")}
              className="px-2.5 py-1 rounded text-xs font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
            >
              Approve
            </button>
            <button
              onClick={() => handleStatusUpdate(row.id, "declined")}
              className="px-2.5 py-1 rounded text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
            >
              Decline
            </button>
          </div>
        ) : (
          <div className="flex gap-2 items-center">
            <span className="text-xs text-gray-500">Reviewed</span>
            <button
              onClick={() => setEditingRequest({ id: row.id, currentStatus: (row.status_text || "").toLowerCase() })}
              className="text-xs text-primary-600 hover:text-primary-800 underline"
            >
              Edit
            </button>
          </div>
        ),
      ignoreRowClick: true,
      minWidth: "140px",
    },
  ];

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Manage Work From Home</h1>
          <p className="text-sm text-gray-600">Review and approve work from home requests</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm text-gray-600">Pending</span>
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 text-yellow-800 font-semibold border border-yellow-200">
            {pendingCount}
          </span>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap mb-4">
        {["all", "pending", "approved", "declined"].map((f) => (
          <button key={f} onClick={() => setActiveFilter(f)} className={filterBtnClass(f)}>
            {f === "all" ? "All Requests" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <DataTable
          columns={columns}
          data={filtered}
          progressPending={loading}
          pagination
          paginationRowsPerPageOptions={[5, 10, 25, 50]}
          customStyles={tableCustomStyles}
          noDataComponent={
            <div className="text-center py-12 text-gray-400">
              No {activeFilter === "all" ? "" : activeFilter} work from home requests to display.
            </div>
          }
        />
      </div>
    </div>
  );
}

export default ManageWorkFromHome;
