import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import API_BASE from "../config";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

export default function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [employee, setEmployee]     = useState(null);
  const [empLoading, setEmpLoading] = useState(true);

  const [attendance, setAttendance] = useState([]);
  const [totalHours, setTotalHours] = useState(0);
  const [attLoading, setAttLoading] = useState(true);
  const [attError, setAttError] = useState("");

  const now = new Date();
  const [attMonth, setAttMonth] = useState({ month: now.getMonth() + 1, year: now.getFullYear() });

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

  const fmtJoining = (val) => {
    if (!val) return "—";
    const d = new Date(val);
    return isNaN(d) ? val : d.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile Sidebar Drawer */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsSidebarOpen(false)} />
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
            <Sidebar onSelect={() => setIsSidebarOpen(false)} className="shadow-none" />
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
            <div className="hidden sm:flex sm:items-center sm:justify-between sm:gap-3">
              <h1 className="text-xl sm:text-2xl font-bold text-blue-700 truncate">Employee Details</h1>
              <button
                onClick={() => navigate("/welcome?view=employees")}
                className="bg-primary-600 text-white px-3 py-2 rounded hover:bg-primary-700 whitespace-nowrap"
              >
                Back
              </button>
            </div>
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
                  <h1 className="text-lg font-bold text-blue-700 truncate">Employee Details</h1>
                </div>
                <button
                  onClick={() => navigate("/welcome?view=employees")}
                  className="bg-primary-600 text-white px-3 py-2 text-sm rounded hover:bg-primary-700 whitespace-nowrap shrink-0"
                >
                  Back
                </button>
              </div>
            </div>
          </header>

          {empLoading ? (
            <div className="text-center py-20 text-gray-400 text-lg">Loading employee...</div>
          ) : !employee ? (
            <div className="text-center py-20 text-red-500">Employee not found.</div>
          ) : (
            <>
              {/* Profile Card */}
              <div className="bg-white rounded-lg shadow p-5 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-600 shrink-0">
                    {employee.first_name?.[0]}{employee.last_name?.[0]}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900">
                      {employee.first_name} {employee.last_name}
                    </h2>
                    <p className="text-sm text-gray-500">{employee.designation || "—"}</p>
                  </div>
                  <span className={`self-start sm:self-center text-xs font-semibold px-3 py-1 rounded-full ${employee.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                    {employee.is_active ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4 mt-5 text-sm">
                  {[
                    { label: "Employee ID",  value: employee.employee_id },
                    { label: "Email",        value: employee.email_address },
                    { label: "Joining Date", value: fmtJoining(employee.joining_date) },
                    { label: "City",         value: employee.city || "—" },
                    { label: "State",        value: employee.state || "—" },
                    { label: "Postal Code",  value: employee.postal_code || "—" },
                    { label: "Salary",       value: employee.salary != null ? `₹${parseFloat(employee.salary).toFixed(2)}` : "—" },
                    { label: "Deduction",    value: employee.deduction != null ? `₹${parseFloat(employee.deduction).toFixed(2)}` : "—" },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
                      <p className="font-semibold text-gray-800 break-all">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 mt-5 flex-wrap">
                  <button
                    onClick={() => navigate(`/edit-employee/${employee.employee_id}`)}
                    className="bg-primary-600 text-white px-4 py-2 rounded text-sm font-semibold hover:bg-primary-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => navigate(`/employee/${employee.employee_id}/payrolls`)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded text-sm font-semibold hover:bg-indigo-700"
                  >
                    View Payrolls
                  </button>
                  <button
                    onClick={() => navigate(`/employee/${employee.employee_id}/leaves`)}
                    className="bg-green-600 text-white px-4 py-2 rounded text-sm font-semibold hover:bg-green-700"
                  >
                    View Leaves
                  </button>
                </div>
              </div>

              {/* Attendance Card */}
              <div className="bg-white rounded-lg shadow p-5">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                  <h2 className="text-lg font-bold text-gray-800">Attendance</h2>
                  <div className="flex items-center gap-2 text-sm">
                    <button
                      onClick={() => changeMonth(-1)}
                      className="w-8 h-8 rounded border border-gray-300 hover:bg-gray-100 font-bold flex items-center justify-center"
                    >
                      ‹
                    </button>
                    <span className="font-semibold text-gray-700 min-w-[130px] text-center">
                      {MONTHS[attMonth.month - 1]} {attMonth.year}
                    </span>
                    <button
                      onClick={() => changeMonth(+1)}
                      className="w-8 h-8 rounded border border-gray-300 hover:bg-gray-100 font-bold flex items-center justify-center"
                    >
                      ›
                    </button>
                  </div>
                </div>

                {attLoading ? (
                  <p className="text-center text-gray-400 py-6">Loading attendance...</p>
                ) : attError ? (
                  <p className="text-center text-red-500 py-6 text-sm">{attError}</p>
                ) : attendance.length === 0 ? (
                  <p className="text-center text-gray-400 py-6">No attendance records for this month.</p>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead className="bg-blue-100 text-gray-700">
                          <tr>
                            <th className="px-4 py-3 text-left">Date</th>
                            <th className="px-4 py-3 text-center">Clock In</th>
                            <th className="px-4 py-3 text-center">Clock Out</th>
                            <th className="px-4 py-3 text-center">Hours Worked</th>
                          </tr>
                        </thead>
                        <tbody className="text-gray-800">
                          {attendance.map((r) => (
                            <tr key={r.date} className="border-t hover:bg-gray-50">
                              <td className="px-4 py-3 font-medium">
                                {new Date(r.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                              </td>
                              <td className="px-4 py-3 text-center text-green-700 font-semibold">{r.clock_in ?? "—"}</td>
                              <td className="px-4 py-3 text-center text-red-600 font-semibold">{r.clock_out ?? "—"}</td>
                              <td className="px-4 py-3 text-center text-indigo-700 font-bold">{r.hours > 0 ? `${r.hours}h` : "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-right mt-3 text-sm font-semibold text-gray-600">
                      Total this month: <span className="text-indigo-700 text-base">{totalHours}h</span>
                    </p>
                  </>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
