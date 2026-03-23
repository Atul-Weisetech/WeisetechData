import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import DataTable from "react-data-table-component";
import { FaEdit, FaUserSlash, FaMoneyBillWave, FaCalendarAlt, FaEllipsisV } from "react-icons/fa";
import { toast } from "react-toastify";
import AddPayrollBreakdown from "./AddPayrollBreakdown";
import AddPayrollMetaTypes from "./AddPayrollMetaTypes";
import ViewBreakdownPopup from "./ViewBreakdownPopup";
import ManageLeaveRequests from "../components/ManageLeaveRequests";
import ManageWorkFromHome from "../components/ManageWorkFromHome";
import PerformanceWarning from "../components/PerformanceWarning";
import DownloadPayrollPDF from "../components/DownloadPayrollPDF";
import API_BASE from "../config";

export default function Welcome() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);

  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const [payrolls, setPayrolls] = useState([]);
  const [search, setSearch] = useState("");
  const [searchParams] = useSearchParams();
  const [view, setView] = useState(searchParams.get("view") || "employees");

  const viewTitleMap = {
    employees: "Employee Details",
    payroll: "Manage Payroll",
    previous: "Previous Payrolls",
    LeaveRequest: "Manage Leave Request",
    WorkFromHome: "Manage Work From Home",
    performance: "Performance Warning",
  };
  const pageTitle = viewTitleMap[view] || "Employee Details";

  useEffect(() => {
    setView(searchParams.get("view") || "employees");
  }, [searchParams]);
  const [showModal, setShowModal] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const navigate = useNavigate();
  const role = localStorage.getItem("role");
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);
  const [isMetaTypeOpen, setIsMetaTypeOpen] = useState(false);
  const [isViewBreakdownOpen, setIsViewBreakdownOpen] = useState(false);
  const [breakdownData, setBreakdownData] = useState([]);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [previouspayrollsList, setPreviouspayrollsList] = useState([]);
  const [isGenerateAllOpen, setIsGenerateAllOpen] = useState(false);
  const [bulkForm, setBulkForm] = useState({
    monthRaw: "",
    date: "",
    mode: "",
  });
  const [visibleSalaries, setVisibleSalaries] = useState({});
  const [visibleDeductions, setVisibleDeductions] = useState({});
  const [actionDropdown, setActionDropdown] = useState({ id: null, rect: null });

  useEffect(() => {
    const email = localStorage.getItem("email");
    if (!email || !role) navigate("/", { replace: true });
    fetchEmployees();
    window.history.pushState(null, null, window.location);
    window.onpopstate = () => window.history.go(1);
  }, []);

  useEffect(() => {
    if (view === "payroll") fetchPayrolls();
  }, [view]);

  useEffect(() => {
    if (view === "previous") {
      axios
        .get(`${API_BASE}/api/payrolls/published`)
        .then((res) => setPreviouspayrollsList(res.data || []))
        .catch(() => setPreviouspayrollsList([]));
    }
  }, [view]);

  const fetchEmployees = () => {
    setEmployeesLoading(true);
    axios
      .get(`${API_BASE}/api/employees`)
      .then((res) => {
        setEmployees(res.data || []);
      })
      .catch((err) => {
        toast.error("Failed to fetch employees: " + (err.response?.data?.error || err.message));
        setEmployees([]);
      })
      .finally(() => setEmployeesLoading(false));
  };

  const fetchPayrolls = () => {
    axios
      .get(`${API_BASE}/api/payrolls`)
      .then((res) => {
        console.log("Payrolls fetched:", res.data);
        setPayrolls(res.data || []);
      })
      .catch((err) => {
        console.error("Error fetching payrolls:", err);
        toast.error("Failed to fetch payrolls: " + (err.response?.data?.error || err.message));
        setPayrolls([]);
      });
  };

  const confirmDeactivate = (id) => {
    setSelectedId(id);
    setShowModal(true);
  };

  // Add missing confirmDelete for payroll records
  const confirmDelete = (id) => {
    setSelectedId(id);
    setShowModal(true);
  };

  const handleDeactivateConfirmed = async () => {
    try {
      await axios.patch(
        `${API_BASE}/api/employees/${selectedId}/deactivate`
      );
      fetchEmployees();
      setShowModal(false);
      toast.success("Employee deactivated successfully!");
    } catch (err) {
      toast.error("Failed to deactivate employee");
    }
  };
  const handleDeletePayroll = async () => {
    try {
      await axios.delete(`${API_BASE}/api/payrolls/${selectedId}`);
      fetchPayrolls();
      setShowModal(false);
    } catch (err) {
      toast.error("Failed to delete payroll");
    }
  };

  const publishPayroll = async (id) => {
    try {
      await axios.post(`${API_BASE}/api/payrolls/publish/${id}`);
      toast.success("Payroll Published successfully!");
      fetchPayrolls();
    } catch (err) {
      toast.error("Failed to publish payroll");
    }
  };

  const filtered = employees.filter((e) =>
    `${e.first_name} ${e.last_name} ${e.email_address} ${e.salary}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const canRevealSalary = ["admin", "hr"].includes(role);

  const toggleSalaryVisibility = (id) => {
    if (!canRevealSalary) return;
    setVisibleSalaries((prev) => ({ [id]: !prev[id] }));
  };

  const toggleDeductionVisibility = (id) => {
    if (!canRevealSalary) return;
    setVisibleDeductions((prev) => ({ [id]: !prev[id] }));
  };

  const capitalize = (s) =>
    s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";

  const tableCustomStyles = {
    headRow: { style: { backgroundColor: "#eff6ff", borderBottom: "2px solid #bfdbfe" } },
    headCells: { style: { color: "#374151", fontWeight: "600", fontSize: "13px" } },
    rows: { style: { "&:hover": { backgroundColor: "#f0f9ff" } } },
    pagination: { style: { borderTop: "1px solid #e2e8f0", backgroundColor: "#f8fafc" } },
  };

  const employeeColumns = [
    {
      name: "Sr.No",
      cell: (_, i) => i + 1,
      width: "70px",
    },
    {
      name: "Name",
      selector: (row) => `${row.first_name || ""} ${row.last_name || ""}`.trim().toLowerCase(),
      cell: (row) => (
        <button
          onClick={() => navigate(`/employee/${row.employee_id}`)}
          className="text-blue-700 hover:underline font-semibold text-left"
        >
          {capitalize(row.first_name)} {capitalize(row.last_name)}
        </button>
      ),
      sortable: true,
      minWidth: "150px",
      width:"200px",
    },
    {
      name: "Email",
      selector: (row) => row.email_address,
      cell: (row) => row.email_address || "—",
      sortable: true,
      minWidth: "180px",
      width:"200px",
    },
    {
      name: "Designation",
      selector: (row) => row.designation,
      cell: (row) => row.designation || "—",
      sortable: true,
      minWidth: "140px",
    },
    {
      name: "Salary",
      selector: (row) => parseFloat(row.salary) || 0,
      cell: (row) =>
        row.salary != null && row.salary !== "" ? (
          canRevealSalary ? (
            <button
              type="button"
              onClick={() => toggleSalaryVisibility(row.employee_id)}
              className="text-blue-700 hover:underline font-medium"
            >
              {visibleSalaries[row.employee_id]
                ? `₹${parseFloat(row.salary).toFixed(2)}`
                : "*****"}
            </button>
          ) : (
            "*****"
          )
        ) : (
          "—"
        ),
      sortable: true,
      width: "120px",
    },
    {
      name: "Deductions",
      selector: (row) => parseFloat(row.deduction) || 0,
      cell: (row) =>
        row.deduction != null && row.deduction !== "" ? (
          canRevealSalary ? (
            <button
              type="button"
              onClick={() => toggleDeductionVisibility(row.employee_id)}
              className="text-blue-700 hover:underline font-medium"
            >
              {visibleDeductions[row.employee_id]
                ? `₹${parseFloat(row.deduction).toFixed(2)}`
                : "*****"}
            </button>
          ) : (
            "*****"
          )
        ) : (
          "—"
        ),
      sortable: true,
      width: "120px",
    },
    {
      name: "Joining Date",
      selector: (row) => row.joining_date,
      cell: (row) =>
        row.joining_date
          ? new Date(row.joining_date * 1000).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })
          : "—",
      sortable: true,
      minWidth: "150px",
      width:"200px",
    },
    {
      name: "Actions",
      cell: (row) =>
        ["admin", "hr"].includes(role) ? (
          <button
            title="Actions"
            onClick={(e) => {
              e.stopPropagation();
              const r = e.currentTarget.getBoundingClientRect();
              setActionDropdown((prev) =>
                prev.id === row.employee_id
                  ? { id: null, rect: null }
                  : { id: row.employee_id, rect: { top: r.top, bottom: r.bottom, left: r.left, right: r.right } }
              );
            }}
            className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-300 bg-white hover:bg-gray-100 text-gray-600 transition-colors"
          >
            <FaEllipsisV size={14} />
          </button>
        ) : null,
      ignoreRowClick: true,
      width: "120px",
    },
  ];

  const groupedPayrolls = payrolls.reduce((acc, p) => {
    const month = p.pay_month;
    if (!acc[month]) acc[month] = [];
    acc[month].push(p);
    return acc;
  }, {});

  const formatMonth = (monthKey) => {
    if (!monthKey || typeof monthKey !== "string") return "Invalid Month";

    const [monthName, year] = monthKey.split(" "); // e.g. "January 2025"
    if (!monthName || !year) return "Invalid Month";

    const date = new Date(`${monthName} 1, ${year}`);
    if (isNaN(date)) return "Invalid Month";

    return `${date.toLocaleString("en-IN", { month: "long" })} ${year}`;
  };

  const publishAllForMonth = async (monthKey) => {
    const records = groupedPayrolls[monthKey];
    if (!records) return;

    const unpublished = records.filter((r) => !r.is_published);
    if (unpublished.length === 0) {
      toast.warning("All payrolls are already published.");
      return;
    }

    try {
      for (const rec of unpublished) {
        await axios.post(`${API_BASE}/api/payrolls/publish/${rec.id}`);
      }
      toast.success(`Published ${unpublished.length} payroll(s) for ${formatMonth(monthKey)}.`);
      fetchPayrolls();
    } catch (err) {
      toast.error("Error occurred while publishing payrolls.");
    }
  };

  const handleViewBreakdown = (payroll) => {
    const pyrId = payroll.id;
    setSelectedPayroll(payroll);
    axios
      .get(`${API_BASE}/api/payrolls/employee/breakdown`, {
        params: { payrollId: pyrId },
      })
      .then((res) => {
        setBreakdownData(res.data);
        setIsViewBreakdownOpen(true);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to fetch breakdown");
      });
  };

  const refreshBreakdown = async () => {
    if (!selectedPayroll?.id) return;
    try {
      const res = await axios.get(
        `${API_BASE}/api/payrolls/employee/breakdown`,
        { params: { payrollId: selectedPayroll.id } }
      );
      setBreakdownData(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const getEmployeeName = (id) => {
    const emp = employees.find((e) => e.employee_id === id);
    return emp ? `${emp.first_name} ${emp.last_name}` : id;
  };

  const monthsList = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const formatDateLocal = (dateStr) => {
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleGenerateAllBulk = async () => {
    const { monthRaw, date, mode } = bulkForm;
    if (!monthRaw || !date || !mode) {
      toast.warning("Select month, date and payment mode");
      return;
    }
    try {
      const empRes = await axios.get(`${API_BASE}/api/employees`);
      const list = empRes.data || [];
      const payMonth = `${monthRaw} ${new Date(date).getFullYear()}`;

      const bulkPayload = list
        .filter((e) => e.salary && Number(e.salary) > 0)
        .map((e) => ({
          fk_employee_id: Number(e.employee_id),
          payroll_amount: Number(e.salary),
          payroll_date: formatDateLocal(date),
          pay_month: payMonth,
          mode_of_payment: mode,
          is_published: false,
        }));

      if (!bulkPayload.length) {
        toast.warning("No employees with valid salary found");
        return;
      }

      let created = [];
      try {
        const res = await axios.post(
          `${API_BASE}/api/payrolls/bulk`,
          { items: bulkPayload }
        );
        created = Array.isArray(res.data) ? res.data : [];
      } catch {
        const results = await Promise.all(
          bulkPayload.map((p) =>
            axios.post(`${API_BASE}/api/payrolls`, p)
          )
        );
        created = results.map((r) => r.data);
      }

      toast.success(`Generated ${created.length} payrolls successfully`);
      setIsGenerateAllOpen(false);
      fetchPayrolls();
    } catch (e) {
      console.error(e);
      toast.error("Bulk generation failed");
    }
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <header className="mb-6">
        {/* Desktop: Single row with everything */}
            <div className="hidden sm:flex sm:items-center sm:justify-between sm:gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-blue-700 truncate">
                  {pageTitle}
                </h1>
              </div>

              <div className="flex items-center gap-3">
                {view === "employees" && (
                  <>
                    <input
                      type="text"
                      placeholder="Search employee..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="border px-3 py-2 rounded w-64"
                    />
                    {role === "admin" && (
                      <button
                        onClick={() => navigate("/add-hr")}
                        className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 whitespace-nowrap"
                      >
                        + Add HR
                      </button>
                    )}
                    {["admin", "hr"].includes(role) && (
                      <button
                        onClick={() => navigate("/add-employee")}
                        className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 whitespace-nowrap"
                      >
                        + Add Employee
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Mobile: Multi-line layout */}
            <div className="sm:hidden space-y-3">
              {/* First line: Menu, {pageTitle}, Search Icon, Actions Menu */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <h1 className="text-xl font-bold text-blue-700 truncate">
                    {pageTitle}
                  </h1>
                </div>
                 {/* Search Icon - Mobile Only */}
                 {view === "employees" && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsSearchOpen(!isSearchOpen);
                        setIsActionsMenuOpen(false);
                      }}
                      className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 shadow-sm shrink-0"
                      aria-label="Toggle search"
                    >
                      🔍
                    </button>
                  )}
                
                {/* Actions Menu Button - Mobile Only */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setIsActionsMenuOpen(!isActionsMenuOpen);
                      setIsSearchOpen(false);
                    }}
                    className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 shadow-sm shrink-0"
                    aria-label="Actions menu"
                  >
                    ⋮
                  </button>
                  
                  {/* Actions Menu Dropdown */}
                  {isActionsMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsActionsMenuOpen(false)}
                      ></div>
                      <div className="absolute right-0 top-12 z-50 bg-white rounded-lg shadow-lg border border-slate-200 min-w-[200px] py-2">
                        {view === "employees" && (
                          <>
                            {role === "admin" && (
                              <button
                                onClick={() => {
                                  navigate("/add-hr");
                                  setIsActionsMenuOpen(false);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                 Add HR
                              </button>
                            )}
                            {["admin", "hr"].includes(role) && (
                              <button
                                onClick={() => {
                                  navigate("/add-employee");
                                  setIsActionsMenuOpen(false);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                 Add Employee
                              </button>
                            )}
                            <div className="border-t border-slate-200 my-1"></div>
                          </>
                        )}
                        {view === "payroll" && (
                          <>
                            <button
                              onClick={() => {
                                navigate("/add-payroll");
                                setIsActionsMenuOpen(false);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                               Generate Payroll
                            </button>
                            <button
                              onClick={() => {
                                setIsGenerateAllOpen(true);
                                setIsActionsMenuOpen(false);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              Generate All Payrolls
                            </button>
                            <button
                              onClick={() => {
                                setIsMetaTypeOpen(true);
                                setIsActionsMenuOpen(false);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                               Add Payroll Meta Types
                            </button>
                            <div className="border-t border-slate-200 my-1"></div>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Search Bar - Mobile only when toggled */}
              {view === "employees" && (
                <div className={isSearchOpen ? 'block' : 'hidden'}>
                  <input
                    type="text"
                    placeholder="Search employee..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="border px-3 py-2 rounded w-full"
                  />
                </div>
              )}
            </div>

            {/* Payroll and Previous View Actions */}
            {view === "payroll" && (
              <div className="hidden sm:flex items-center gap-1.5 sm:gap-3 mt-4 overflow-x-auto">
                <button
                  onClick={() => navigate("/add-payroll")}
                  className="bg-primary-600 text-white px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded hover:bg-primary-700 whitespace-nowrap shrink-0"
                >
                   Generate Payroll
                </button>
                <button
                  onClick={() => setIsGenerateAllOpen(true)}
                  className="bg-primary-600 text-white px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded hover:bg-primary-700 whitespace-nowrap shrink-0"
                >
                  Generate All Payrolls
                </button>
                <button
                  onClick={() => setIsMetaTypeOpen(true)}
                  className="bg-primary-600 text-white px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded hover:bg-primary-700 whitespace-nowrap shrink-0"
                >
                   Add Payroll Meta Types
                </button>
              </div>
            )}

          </header>

          {/* Modal */}
          {/* Removed AddPayrollBreakdown trigger from header */}
          <AddPayrollBreakdown
            isOpen={isBreakdownOpen}
            onClose={() => setIsBreakdownOpen(false)}
          />
          <AddPayrollMetaTypes
            isOpen={isMetaTypeOpen}
            onClose={() => setIsMetaTypeOpen(false)}
          />
          <ViewBreakdownPopup
            isOpen={isViewBreakdownOpen}
            onClose={() => setIsViewBreakdownOpen(false)}
            breakdownData={breakdownData}
            onRefresh={refreshBreakdown}
            payrollId={selectedPayroll?.id}
            employeeId={selectedPayroll?.fk_employee_id}
          />

          {isGenerateAllOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex justify-center items-center z-50">
              <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md relative">
                <button
                  onClick={() => setIsGenerateAllOpen(false)}
                  className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
                >
                  ✖
                </button>
                <h2 className="text-xl font-bold text-center text-blue-700 mb-4">
                  Generate All Payrolls
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block mb-1 font-medium">Month</label>
                    <select
                      value={bulkForm.monthRaw}
                      onChange={(e) =>
                        setBulkForm((f) => ({ ...f, monthRaw: e.target.value }))
                      }
                      className="w-full border px-3 py-2 rounded"
                    >
                      <option value="">Select</option>
                      {monthsList.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">
                      Payment Mode
                    </label>
                    <input
                      value={bulkForm.mode}
                      onChange={(e) =>
                        setBulkForm((f) => ({ ...f, mode: e.target.value }))
                      }
                      className="w-full border px-3 py-2 rounded"
                      placeholder="e.g. Bank Transfer"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Date</label>
                    <input
                      type="date"
                      value={bulkForm.date}
                      onChange={(e) =>
                        setBulkForm((f) => ({ ...f, date: e.target.value }))
                      }
                      className="w-full border px-3 py-2 rounded"
                    />
                  </div>
                  <button
                    onClick={handleGenerateAllBulk}
                    className="w-full bg-primary-600 text-white py-2 rounded hover:bg-primary-700"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          )}


      {view === "LeaveRequest" && <ManageLeaveRequests />}
      {view === "WorkFromHome" && <ManageWorkFromHome />}
      {view === "performance" && <PerformanceWarning />}

      {/* Employee Table */}
      {view === "employees" ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <DataTable
            columns={employeeColumns}
            data={filtered}
            progressPending={employeesLoading}
            pagination
            paginationRowsPerPageOptions={[5, 10, 25, 50]}
            customStyles={tableCustomStyles}
            noDataComponent={
              <div className="text-center py-12 text-gray-400">No matching employees found.</div>
            }
          />
        </div>
      ) : view === "payroll" ? (
        <div className="space-y-8">
          {Object.entries(groupedPayrolls)
            .sort((a, b) => {
              const toKey = (key) => {
                if (!key) return 0;
                const [m, y] = String(key).split(" ");
                const months = [
                  "January",
                  "February",
                  "March",
                  "April",
                  "May",
                  "June",
                  "July",
                  "August",
                  "September",
                  "October",
                  "November",
                  "December",
                ];
                const mi = months.indexOf(m);
                const yi = parseInt(y, 10) || 0;
                return yi * 100 + (mi >= 0 ? mi : 0);
              };
              return toKey(a[0]) - toKey(b[0]);
            })
            .map(([month, data]) => (
              <div
                key={month}
                className="bg-white rounded-lg shadow-md p-3 sm:p-6 border overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0 mb-4 border-b pb-2">
                  <h2 className="text-lg sm:text-2xl font-semibold text-indigo-700">
                    {formatMonth(month)}
                  </h2>
                  <button
                    disabled={groupedPayrolls[month]?.every(
                      (p) => p.is_published
                    )}
                    onClick={() => publishAllForMonth(month)}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded transition text-white text-sm sm:text-base whitespace-nowrap ${
                      groupedPayrolls[month]?.every((p) => p.is_published)
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700"
                    }`}
                  >
                    Publish All
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-indigo-100 text-gray-700">
                      <tr>
                        <th className="px-2 sm:px-4 py-3">Serial No</th>
                        <th className="px-2 sm:px-4 py-3">Employee Name</th>
                        <th className="px-2 sm:px-4 py-3">Amount</th>
                        <th className="px-2 sm:px-4 py-3">Date</th>
                        <th className="px-2 sm:px-4 py-3">Payment Mode</th>
                        <th className="px-2 sm:px-4 py-3 whitespace-nowrap">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-800">
                      {data.map((p, index) => (
                        <tr
                          key={p.id}
                          className={`border-t ${
                            index % 2 === 0 ? "bg-gray-50" : "bg-white"
                          }`}
                        >
                          <td className="px-2 sm:px-4 py-2">{index + 1}</td>
                          <td className="px-2 sm:px-4 py-2 whitespace-nowrap">
                            {getEmployeeName(p.fk_employee_id)}
                          </td>

                          <td className="px-2 sm:px-4 py-2 whitespace-nowrap">
                            ₹{parseFloat(p.payroll_amount).toFixed(2)}
                          </td>
                          <td className="px-2 sm:px-4 py-2 whitespace-nowrap">
                            {new Date(p.payroll_date).toLocaleDateString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "long",
                                year: "numeric",
                              }
                            )}
                          </td>
                          <td className="px-2 sm:px-4 py-2 whitespace-nowrap">{p.mode_of_payment}</td>
                        <td className="px-2 py-2">
                          {["admin", "hr"].includes(role) && (
                           <div className="flex items-center gap-1 flex-nowrap">
                              <button
                                onClick={() =>
                                  navigate(`/edit-payroll/${p.id}`)
                                }
                                className="bg-primary-600 text-white px-1.5 sm:px-2 py-1 text-xs rounded hover:bg-primary-700 whitespace-nowrap shrink-0"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => confirmDelete(p.id)}
                                className="bg-primary-600 text-white px-1.5 sm:px-2 py-1 text-xs rounded hover:bg-primary-700 whitespace-nowrap shrink-0"
                              >
                                Delete
                              </button>
                              <button
                                disabled={p.is_published}
                                className={`px-1.5 sm:px-2 py-1 rounded text-white text-xs whitespace-nowrap shrink-0 ${
                                  p.is_published
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-primary-600 hover:bg-primary-700"
                                }`}
                                onClick={() => publishPayroll(p.id)}
                              >
                                {p.is_published ? "Published" : "Publish"}
                              </button>
                              <button
                                className="bg-primary-600 text-white px-1.5 sm:px-2 py-1 text-xs rounded hover:bg-primary-700 whitespace-nowrap shrink-0"
                                onClick={() => handleViewBreakdown(p)}
                              >
                                <span className="hidden sm:inline">Manage Breakdown</span>
                                <span className="sm:hidden">Breakdown</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            ))}
        </div>
      ) : view === "previous" ? (
        <div className="bg-white rounded shadow p-6">
          {previouspayrollsList.length === 0 ? (
            <div className="text-gray-500">No Previous payrolls</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-blue-100">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Month</th>
                  <th className="px-4 py-3">Payment Mode</th>
                  <th className="px-4 py-3">Download</th>{" "}
                  {/* Added Download column */}
                </tr>
              </thead>
              <tbody>
                {previouspayrollsList.map((p, idx) => {
                  // Prepare payrollData for the component
                  const payrollData = {
                    payroll_amount: p.payroll_amount,
                    pay_month: p.pay_month,
                    payroll_date: p.payroll_date, // Make sure this field exists
                    mode_of_payment: p.mode_of_payment,
                    breakdown: p.breakdown || [], // Assuming breakdown data exists
                  };

                  // Prepare employeeData for the component
                  const employeeData = {
                    name: `${p.first_name} ${p.last_name}`,
                    email_address: p.email || p.email_address || "", // Adjust field name as needed
                    designation: p.designation || p.role || "", // Adjust field name as needed
                  };

                  return (
                    <tr key={p.id} className="border-t">
                      <td className="px-4 py-2">{idx + 1}</td>
                      <td className="px-4 py-2">
                        {p.first_name} {p.last_name}
                      </td>
                      <td className="px-4 py-2">
                        ₹{parseFloat(p.payroll_amount).toFixed(2)}
                      </td>
                      <td className="px-4 py-2">{p.pay_month}</td>
                      <td className="px-4 py-2">{p.mode_of_payment}</td>
                      <td className="px-4 py-2">
                        {/* Add the DownloadPayrollPDF component */}
                        <DownloadPayrollPDF
                          payrollData={payrollData}
                          employeeData={employeeData}
                          className="text-sm px-3 py-1"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      ) : null}

      {/* Actions Dropdown */}
      {actionDropdown.id && actionDropdown.rect && (
        <>
          <div
            className="fixed inset-0"
            style={{ zIndex: 9998 }}
            onClick={() => setActionDropdown({ id: null, rect: null })}
          />
          <div
            style={{
              position: "fixed",
              top: actionDropdown.rect.bottom + 4,
              left: Math.min(actionDropdown.rect.left, window.innerWidth - 180),
              zIndex: 9999,
            }}
            className="bg-white border border-gray-200 rounded-lg shadow-xl py-1 w-44"
          >
            <button
              onClick={() => { navigate(`/edit-employee/${actionDropdown.id}`); setActionDropdown({ id: null, rect: null }); }}
              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 flex items-center gap-3"
            >
              <FaEdit size={13} className="text-blue-700" /> Edit
            </button>
            <button
              onClick={() => { confirmDeactivate(actionDropdown.id); setActionDropdown({ id: null, rect: null }); }}
              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 flex items-center gap-3"
            >
              <FaUserSlash size={13} className="text-slate-500" /> Deactivate
            </button>
            <button
              onClick={() => { navigate(`/employee/${actionDropdown.id}/payrolls`); setActionDropdown({ id: null, rect: null }); }}
              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 flex items-center gap-3"
            >
              <FaMoneyBillWave size={13} className="text-blue-700" /> View Payrolls
            </button>
            <button
              onClick={() => { navigate(`/employee/${actionDropdown.id}/leaves`); setActionDropdown({ id: null, rect: null }); }}
              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 flex items-center gap-3"
            >
              <FaCalendarAlt size={13} className="text-blue-700" /> View Leaves
            </button>
          </div>
        </>
      )}

      {/* Delete Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full text-center">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">
              {view === "payroll"
                ? "Are you sure you want to delete this payroll?"
                : "Are you sure you want to deactivate this employee?"}
            </h2>
            {/* <p className="text-sm text-gray-600 mb-6">
              The employee will be deactivated and won't appear in active lists,
              but their data will be preserved.
            </p> */}
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowModal(false)}
                className="bg-gray-300 text-gray-800 px-6 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  view === "payroll"
                    ? handleDeletePayroll()
                    : handleDeactivateConfirmed()
                }
                className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
              >
                {view === "payroll" ? "Delete" : "Deactivate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
