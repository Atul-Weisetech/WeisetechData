import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import DataTable from "react-data-table-component";
import API_BASE from "../config";

const tableCustomStyles = {
  headRow: { style: { backgroundColor: "#eff6ff", borderBottom: "2px solid #bfdbfe" } },
  headCells: { style: { color: "#374151", fontWeight: "600", fontSize: "13px" } },
  rows: { style: { "&:hover": { backgroundColor: "#f0f9ff" } } },
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

export default function EmployeeLeaves() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [employeeData, setEmployeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    const load = async () => {
      if (!id) { setError("Employee ID is missing"); setLoading(false); return; }
      setLoading(true);
      setError("");
      try {
        const leaveRes = await axios.get(`${API_BASE}/api/leave-requests/employee/${id}`);
        const leaves = Array.isArray(leaveRes.data) ? leaveRes.data : leaveRes.data?.data || [];
        setLeaveRequests(leaves);

        const empRes = await axios.get(`${API_BASE}/api/employees/${id}`);
        const empData = Array.isArray(empRes.data) ? empRes.data[0] : empRes.data;
        setEmployeeData(empData);
        if (!empData) setError(`Employee with ID ${id} not found`);
      } catch (e) {
        setError(e?.response?.data?.error || e?.message || `Failed to fetch data for employee ${id}`);
        setLeaveRequests([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const filtered = leaveRequests.filter((req) => {
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
      width: "75px",
    },
    {
      name: "Description",
      selector: (row) => row.description,
      cell: (row) => (
        <span title={row.description} className="line-clamp-1 block max-w-[200px] truncate">
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
      name: "Applied Date",
      selector: (row) => row.applied_date,
      cell: (row) => (row.applied_date ? new Date(row.applied_date).toLocaleDateString() : "—"),
      sortable: true,
      minWidth: "120px",
    },
    {
      name: "Reviewed By",
      selector: (row) => row.reviewed_by || "—",
      sortable: true,
    },
  ];

  return (
    <div className="p-4 sm:p-6">
      <header className="mb-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl sm:text-2xl font-bold text-blue-700 truncate">Employee Leave Requests</h1>
          <button
            onClick={() => navigate("/welcome?view=employees")}
            className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 transition-colors whitespace-nowrap"
          >
            Back
          </button>
        </div>
        {employeeData && (
          <div className="mt-4 p-3 sm:p-4 bg-white rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-800">
              {employeeData.first_name} {employeeData.last_name}
            </h2>
            <p className="text-sm text-gray-600">Employee ID: {id} | {employeeData.email_address || ""}</p>
          </div>
        )}
      </header>

      {error && (
        <div className="mb-4 px-4 py-2 rounded border border-red-200 bg-red-50 text-red-700">{error}</div>
      )}

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
              No {activeFilter === "all" ? "" : activeFilter} leave requests found.
            </div>
          }
        />
      </div>
    </div>
  );
}
