import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import DataTable from "react-data-table-component";
import { FaArrowLeft, FaEdit, FaCalendarAlt, FaRupeeSign, FaMapMarkerAlt, FaClock, FaMoneyBillWave } from "react-icons/fa";
import API_BASE from "../config";

const tableCustomStyles = {
  headRow: { style: { backgroundColor: "#eff6ff", borderBottom: "2px solid #bfdbfe" } },
  headCells: { style: { color: "#374151", fontWeight: "600", fontSize: "13px" } },
  rows: { style: { "&:hover": { backgroundColor: "#f0f9ff" }, alignItems: "flex-start" } },
  cells: { style: { whiteSpace: "normal", wordBreak: "break-word", paddingTop: "10px", paddingBottom: "10px" } },
  pagination: { style: { borderTop: "1px solid #e2e8f0", backgroundColor: "#f8fafc" } },
};

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const statusStyles = {
  requested: "bg-yellow-100 text-yellow-800",
  approved:  "bg-green-100 text-green-800",
  declined:  "bg-red-100 text-red-800",
};

export default function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("attendance");

  // Employee
  const [employee, setEmployee] = useState(null);
  const [empLoading, setEmpLoading] = useState(true);

  // Attendance
  const [attendance, setAttendance] = useState([]);
  const [totalHours, setTotalHours] = useState(0);
  const [attLoading, setAttLoading] = useState(true);
  const [attError, setAttError] = useState("");
  const now = new Date();
  const [attMonth, setAttMonth] = useState({ month: now.getMonth() + 1, year: now.getFullYear() });

  // Payrolls
  const [payrolls, setPayrolls] = useState([]);
  const [payrollLoading, setPayrollLoading] = useState(false);
  const [payrollError, setPayrollError] = useState("");

  // Leaves
  const [leaves, setLeaves] = useState([]);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [leaveError, setLeaveError] = useState("");

  useEffect(() => {
    setEmpLoading(true);
    axios
      .get(`${API_BASE}/api/employees/${id}`)
      .then((res) => setEmployee(Array.isArray(res.data) ? res.data[0] : res.data))
      .catch(() => setEmployee(null))
      .finally(() => setEmpLoading(false));
  }, [id]);

  
  useEffect(() => {
    setAttLoading(true);
    setAttError("");
    axios
      .get(`${API_BASE}/api/attendance/records/${id}?month=${attMonth.month}&year=${attMonth.year}`)
      .then((res) => {
        if (res.data?.success === false) {
          setAttError(res.data.message || "Server returned an error");
          setAttendance([]);
        } else {
          setAttendance(res.data?.records ?? []);
          setTotalHours(res.data?.total_hours ?? 0);
        }
      })
      .catch((err) => {
        setAttError(err?.response?.data?.message || err.message || "Failed to fetch attendance");
        setAttendance([]);
        setTotalHours(0);
      })
      .finally(() => setAttLoading(false));
  }, [id, attMonth]);

  useEffect(() => {
    if (activeTab !== "payrolls" || payrolls.length > 0) return;
    setPayrollLoading(true);
    setPayrollError("");
    axios
      .get(`${API_BASE}/api/payrolls/employee/${id}`)
      .then((res) => setPayrolls(res.data || []))
      .catch((err) => setPayrollError(err?.response?.data?.message || "Failed to fetch payrolls"))
      .finally(() => setPayrollLoading(false));
  }, [activeTab, id, payrolls.length]);

  useEffect(() => {
    if (activeTab !== "leaves" || leaves.length > 0) return;
    setLeaveLoading(true);
    setLeaveError("");
    axios
      .get(`${API_BASE}/api/leave-requests/employee/${id}`)
      .then((res) => setLeaves(Array.isArray(res.data) ? res.data : res.data?.data || []))
      .catch((err) => setLeaveError(err?.response?.data?.message || "Failed to fetch leaves"))
      .finally(() => setLeaveLoading(false));
  }, [activeTab, id, leaves.length]);

  const changeMonth = (delta) => {
    setAttMonth((prev) => {
      let { month, year } = prev;
      month += delta;
      if (month > 12) { month = 1; year++; }
      if (month < 1)  { month = 12; year--; }
      const n = new Date();
      if (year > n.getFullYear() || (year === n.getFullYear() && month > n.getMonth() + 1)) return prev;
      return { month, year };
    });
  };

  const fmtDate = (val) => {
    if (!val) return "—";
    const num = Number(val);
    // API stores joining_date as Unix timestamp in seconds — multiply by 1000 for JS Date
    const d = !isNaN(num) && num > 0 ? new Date(num * 1000) : new Date(val);

    if (isNaN(d.getTime())) return String(val);
    const day   = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year  = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const tabs = [
    { key: "attendance", label: "Attendance", icon: <FaClock size={13} /> },
    { key: "payrolls",   label: "Payrolls",   icon: <FaMoneyBillWave size={13} /> },
    { key: "leaves",     label: "Leaves",     icon: <FaCalendarAlt size={13} /> },
  ];

  if (empLoading) return <div className="text-center py-20 text-gray-400 text-lg">Loading employee...</div>;
  if (!employee)  return <div className="text-center py-20 text-red-500">Employee not found.</div>;

  return (
    <div className="p-4 sm:p-6 w-full">

      {/* Back */}
      <button
        onClick={() => navigate("/welcome?view=employees")}
        className="flex items-center gap-2 text-gray-600 hover:text-blue-700 transition text-sm font-medium mb-4"
      >
        <FaArrowLeft size={13} /> Back
      </button>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl shadow-md overflow-hidden mb-6">
        <div className="flex flex-col sm:flex-row gap-5 p-5">

          {/* Left — Avatar + Name + Email + Role badge */}
          <div className="flex flex-col items-center gap-2 sm:w-52 shrink-0">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center text-2xl font-bold text-primary-600">
                {employee.first_name?.[0]}{employee.last_name?.[0]}
              </div>
              <button
                onClick={() => navigate(`/edit-employee/${employee.employee_id}`)}
                title="Edit Employee"
                className="absolute bottom-0 right-0 w-6 h-6 bg-primary-600 hover:bg-primary-700 text-white rounded-full flex items-center justify-center shadow"
              >
                <FaEdit size={10} />
              </button>
            </div>
            <div className="text-center">
              <h2 className="text-base font-bold text-gray-900 leading-tight capitalize">
                {employee.first_name} {employee.last_name}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5 break-all">{employee.email_address || "—"}</p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-primary-50 text-primary-700 border border-primary-200">
              {employee.designation || "Employee"}
            </span>
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px bg-gray-200 self-stretch" />

          {/* Right — Info fields in compact grid */}
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 text-sm">
            {[
              { icon: <FaCalendarAlt size={11} className="text-purple-500" />, label: "Joining Date", value: fmtDate(employee.joining_date) },
              { icon: <FaRupeeSign size={11} className="text-green-500" />,    label: "Salary",       value: employee.salary != null ? `₹${parseFloat(employee.salary).toFixed(2)}` : "—" },
              { icon: <FaRupeeSign size={11} className="text-red-400" />,      label: "Deduction",    value: employee.deduction != null ? `₹${parseFloat(employee.deduction).toFixed(2)}` : "—" },
              { icon: <FaMapMarkerAlt size={11} className="text-orange-400" />,label: "City",         value: employee.city || "—" },
              { icon: <FaMapMarkerAlt size={11} className="text-orange-400" />,label: "State",        value: employee.state || "—" },
              { icon: <FaMapMarkerAlt size={11} className="text-orange-400" />,label: "Postal Code",  value: employee.postal_code || "—" },
            ].map(({ icon, label, value }) => (
              <div key={label}>
                <p className="text-xs text-gray-400 flex items-center gap-1 mb-0.5">
                  {icon} <span className="uppercase tracking-wide">{label}</span>
                </p>
                <p className="font-semibold text-gray-800 break-all text-sm">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-t flex">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition border-b-2 ${
                activeTab === tab.key
                  ? "border-blue-600 text-blue-600 bg-blue-50"
                  : "border-transparent text-gray-500 hover:text-blue-600 hover:bg-gray-50"
              }`}
            >
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-2xl shadow-md overflow-hidden">

        {/* ── Attendance ── */}
        {activeTab === "attendance" && (
          <div className="p-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h3 className="text-base font-bold text-gray-800">Attendance</h3>
              <div className="flex items-center gap-2 text-sm">
                <button
                  onClick={() => changeMonth(-1)}
                  className="w-8 h-8 rounded border border-gray-300 hover:bg-gray-100 font-bold flex items-center justify-center"
                >‹</button>
                <span className="font-semibold text-gray-700 min-w-[130px] text-center">
                  {MONTHS[attMonth.month - 1]} {attMonth.year}
                </span>
                <button
                  onClick={() => changeMonth(+1)}
                  className="w-8 h-8 rounded border border-gray-300 hover:bg-gray-100 font-bold flex items-center justify-center"
                >›</button>
              </div>
            </div>

            {attLoading ? (
              <p className="text-center text-gray-400 py-8">Loading attendance...</p>
            ) : attError ? (
              <p className="text-center text-red-500 py-8 text-sm">{attError}</p>
            ) : (
              <>
                <DataTable
                  columns={[
                    {
                      name: "Date",
                      selector: (r) => r.date,
                      cell: (r) => new Date(r.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
                      sortable: true,
                      grow: 1,
                    },
                    {
                      name: "Clock In",
                      selector: (r) => r.clock_in ?? "—",
                      cell: (r) => <span className="text-green-700 font-semibold">{r.clock_in ?? "—"}</span>,
                      sortable: true,
                      grow: 1,
                    },
                    {
                      name: "Clock Out",
                      selector: (r) => r.clock_out ?? "—",
                      cell: (r) => <span className="text-red-600 font-semibold">{r.clock_out ?? "—"}</span>,
                      sortable: true,
                      grow: 1,
                    },
                    {
                      name: "Hours Worked",
                      selector: (r) => r.hours,
                      cell: (r) => <span className="text-blue-700 font-bold">{r.hours > 0 ? `${r.hours}h` : "—"}</span>,
                      sortable: true,
                      grow: 1,
                    },
                  ]}
                  data={attendance}
                  customStyles={tableCustomStyles}
                  pagination
                  paginationRowsPerPageOptions={[10, 25, 31]}
                  noDataComponent={<div className="text-center py-6 text-gray-400">No attendance records for this month.</div>}
                />
                <p className="text-right mt-2 text-sm font-semibold text-gray-600">
                  Total this month: <span className="text-blue-700 text-base">{totalHours}h</span>
                </p>
              </>
            )}
          </div>
        )}

        {/* ── Payrolls ── */}
        {activeTab === "payrolls" && (
          <div className="p-5">
            <h3 className="text-base font-bold text-gray-800 mb-4">Published Payrolls</h3>
            {payrollLoading ? (
              <p className="text-center text-gray-400 py-8">Loading payrolls...</p>
            ) : payrollError ? (
              <p className="text-center text-red-500 py-8 text-sm">{payrollError}</p>
            ) : (
              <DataTable
                columns={[
                  {
                    name: "Sr.No",
                    cell: (_, i) => i + 1,
                    width: "65px",
                  },
                  {
                    name: "Month",
                    selector: (r) => r.pay_month,
                    sortFunction: (a, b) => {
                      const toKey = (s) => {
                        const [m, y] = (s || "").split(" ");
                        const mi = ["January","February","March","April","May","June","July","August","September","October","November","December"].indexOf(m);
                        return (parseInt(y, 10) || 0) * 100 + (mi >= 0 ? mi : 0);
                      };
                      return toKey(a.pay_month) - toKey(b.pay_month);
                    },
                    sortable: true,
                    grow: 1,
                  },
                  {
                    name: "Amount",
                    selector: (r) => parseFloat(r.payroll_amount) || 0,
                    cell: (r) => `₹${parseFloat(r.payroll_amount || 0).toFixed(2)}`,
                    sortable: true,
                    grow: 1,
                  },
                  {
                    name: "Payroll Date",
                    selector: (r) => r.payroll_date,
                    cell: (r) => new Date(r.payroll_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
                    sortable: true,
                    grow: 1,
                  },
                  {
                    name: "Payment Mode",
                    selector: (r) => r.mode_of_payment,
                    sortFunction: (a, b) => (a.mode_of_payment || "").toLowerCase().localeCompare((b.mode_of_payment || "").toLowerCase()),
                    sortable: true,
                    grow: 1,
                  },
                ]}
                data={payrolls}
                customStyles={tableCustomStyles}
                pagination
                paginationRowsPerPageOptions={[5, 10, 25]}
                noDataComponent={<div className="text-center py-6 text-gray-400">No published payrolls found.</div>}
              />
            )}
          </div>
        )}

        {/* ── Leaves ── */}
        {activeTab === "leaves" && (
          <div className="p-5">
            <h3 className="text-base font-bold text-gray-800 mb-4">Leave Requests</h3>
            {leaveLoading ? (
              <p className="text-center text-gray-400 py-8">Loading leaves...</p>
            ) : leaveError ? (
              <p className="text-center text-red-500 py-8 text-sm">{leaveError}</p>
            ) : (
              <DataTable
                columns={[
                  {
                    name: "#",
                    cell: (_, i) => i + 1,
                    width: "55px",
                  },
                  {
                    name: "Date Range",
                    selector: (r) => r.from_date,
                    cell: (r) => `${new Date(r.from_date).toLocaleDateString("en-IN")} – ${new Date(r.to_date).toLocaleDateString("en-IN")}`,
                    sortable: true,
                    grow: 2,
                  },
                  {
                    name: "Days",
                    selector: (r) => r.number_of_days,
                    sortable: true,
                    width: "70px",
                  },
                  {
                    name: "Description",
                    selector: (r) => r.description,
                    grow: 2,
                  },
                  {
                    name: "Status",
                    selector: (r) => (r.status_text || "").toLowerCase(),
                    cell: (r) => {
                      const s = (r.status_text || "").toLowerCase();
                      return (
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusStyles[s] || "bg-gray-100 text-gray-700"}`}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </span>
                      );
                    },
                    sortable: true,
                    grow: 1,
                  },
                ]}
                data={leaves}
                customStyles={tableCustomStyles}
                pagination
                paginationRowsPerPageOptions={[5, 10, 25]}
                noDataComponent={<div className="text-center py-6 text-gray-400">No leave requests found.</div>}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
