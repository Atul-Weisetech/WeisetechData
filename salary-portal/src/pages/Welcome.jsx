import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import AddPayrollBreakdown from "./AddPayrollBreakdown";
import AddPayrollMetaTypes from "./AddPayrollMetaTypes";
import ViewBreakdownPopup from "./ViewBreakdownPopup";
import ManageLeaveRequests from "../components/ManageLeaveRequests";
import ManageWorkFromHome from "../components/ManageWorkFromHome";
import PerformanceWarning from "../components/PerformanceWarning";
import DownloadPayrollPDF from "../components/DownloadPayrollPDF";
import CustomConfirmDialog from "../components/CustomConfirmDialog";

export default function Welcome() {
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast({ ...toast, show: false });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const [employees, setEmployees] = useState([]);
  const [payrolls, setPayrolls] = useState([]);
  const [search, setSearch] = useState("");
  const [searchParams] = useSearchParams();
  const initialView = searchParams.get("view") || "employees";
  const [view, setView] = useState(initialView);
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
        .get("http://localhost:5000/api/payrolls/published")
        .then((res) => setPreviouspayrollsList(res.data || []))
        .catch(() => setPreviouspayrollsList([]));
    }
  }, [view]);

  const fetchEmployees = () => {
    axios
      .get("http://localhost:5000/api/employees")
      .then((res) => {
        console.log("Employees fetched:", res.data);
        setEmployees(res.data || []);
      })
      .catch((err) => {
        console.error("Error fetching employees:", err);
        setToast({
          show: true,
          type: "error",
          message:
            "Failed to fetch employees: " +
            (err.response?.data?.error || err.message),
        });
        setEmployees([]);
      });
  };

  const fetchPayrolls = () => {
    axios
      .get("http://localhost:5000/api/payrolls")
      .then((res) => {
        console.log("Payrolls fetched:", res.data);
        setPayrolls(res.data || []);
      })
      .catch((err) => {
        console.error("Error fetching payrolls:", err);
        setToast({
          show: true,
          type: "error",
          message:
            "Failed to fetch payrolls: " +
            (err.response?.data?.error || err.message),
        });
        setPayrolls([]);
      });
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/", { replace: true });
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
        `http://localhost:5000/api/employees/${selectedId}/deactivate`
      );
      fetchEmployees();
      setShowModal(false);
      setToast({
        show: true,
        message: "Employee deactivated successfully!",
        type: "success",
      });
    } catch (err) {
      setToast({
        show: true,
        message: "Failed to deactivate employee",
        type: "error",
      });
    }
  };
  const handleDeletePayroll = async () => {
    try {
      await axios.delete(`http://localhost:5000/api/payrolls/${selectedId}`);
      fetchPayrolls();
      setShowModal(false);
    } catch (err) {
      alert("Failed to delete payroll");
    }
  };

  const publishPayroll = async (id) => {
    try {
      const res = await axios.post(
        `http://localhost:5000/api/payrolls/publish/${id}`
      );
      setToast({
        show: true,
        message: "Payroll Published successfully!",
        type: "success",
      });
      fetchPayrolls();
    } catch (err) {
      setToast({
        show: true,
        message: "Failed to publish payroll",
        type: "error",
      });
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
  setVisibleSalaries((prev) => ({
    // If clicking the same ID that's already visible, hide it
    // Otherwise, show only the new ID
    [id]: prev[id] ? false : true
  }));
};
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
      alert("All payrolls are already published.");
      return;
    }

    try {
      for (const rec of unpublished) {
        await axios.post(
          `http://localhost:5000/api/payrolls/publish/${rec.id}`
        );
      }
      alert(
        `Published ${unpublished.length} payroll(s) for ${formatMonth(
          monthKey
        )}.`
      );
      fetchPayrolls();
    } catch (err) {
      alert("Error occurred while publishing payrolls.");
    }
  };

  const handleViewBreakdown = (payroll) => {
    const pyrId = payroll.id;
    setSelectedPayroll(payroll);
    axios
      .get("http://localhost:5000/api/payrolls/employee/breakdown", {
        params: { payrollId: pyrId },
      })
      .then((res) => {
        setBreakdownData(res.data);
        setIsViewBreakdownOpen(true);
      })
      .catch((err) => {
        console.error(err);
        alert("Failed to fetch breakdown");
      });
  };

  const refreshBreakdown = async () => {
    if (!selectedPayroll?.id) return;
    try {
      const res = await axios.get(
        "http://localhost:5000/api/payrolls/employee/breakdown",
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
      setToast({
        show: true,
        type: "error",
        message: "Select month, date and payment mode",
      });
      return;
    }
    try {
      const empRes = await axios.get("http://localhost:5000/api/employees");
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
        setToast({
          show: true,
          type: "error",
          message: "No employees with valid salary found",
        });
        return;
      }

      let created = [];
      try {
        const res = await axios.post(
          "http://localhost:5000/api/payrolls/bulk",
          { items: bulkPayload }
        );
        created = Array.isArray(res.data) ? res.data : [];
      } catch {
        const results = await Promise.all(
          bulkPayload.map((p) =>
            axios.post("http://localhost:5000/api/payrolls", p)
          )
        );
        created = results.map((r) => r.data);
      }

      setToast({
        show: true,
        type: "success",
        message: `Generated ${created.length} payrolls successfully`,
      });
      setIsGenerateAllOpen(false);
      fetchPayrolls();
    } catch (e) {
      console.error(e);
      setToast({
        show: true,
        type: "error",
        message: "Bulk generation failed",
      });
    }
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
              onSelect={(v) => {
                setView(v);
                setIsSidebarOpen(false);
              }}
              className="shadow-none"
            />
          </div>
        </div>
      )}

      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-56 shrink-0 sticky top-0 h-screen">
          <Sidebar onSelect={(v) => setView(v)} className="h-screen" />
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0 p-4 sm:p-6">
          {/* Header */}
          <header className="mb-6">
            {/* Desktop: Single row with everything */}
            <div className="hidden sm:flex sm:items-center sm:justify-between sm:gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-blue-700 truncate">
                  HR Portal
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
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 whitespace-nowrap"
                >
                  Logout
                </button>
              </div>
            </div>

            {/* Mobile: Multi-line layout */}
            <div className="sm:hidden space-y-3">
              {/* First line: Menu, HR Portal, Search Icon, Actions Menu */}
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
                  <h1 className="text-xl font-bold text-blue-700 truncate">
                    HR Portal
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
                        <button
                          onClick={() => {
                            setIsActionsMenuOpen(false);
                            setShowLogoutConfirm(true);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          Logout
                        </button>
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


      {toast.show && (
        <div className="flex justify-center mb-4">
          <div
            className={`max-w-2xl w-full px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm font-medium
              ${
                toast.type === "success"
                  ? "bg-green-50 text-green-800 border border-green-300"
                  : "bg-red-50 text-red-800 border border-red-300"
              }`}
          >
            {toast.type === "success" ? (
              <span className="text-green-600 text-lg">✅</span>
            ) : (
              <span className="text-red-600 text-lg">❌</span>
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {view === "LeaveRequest" && <ManageLeaveRequests />}
      {view === "WorkFromHome" && <ManageWorkFromHome />}
      {view === "performance" && <PerformanceWarning />}

      {/* Employee Table */}
      {view === "employees" ? (
        <div className="bg-white rounded shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
            <thead className="bg-blue-100 text-gray-700">
              <tr>
                <th className="px-2 sm:px-4 py-3">Serial No</th>
                <th className="px-2 sm:px-4 py-3">Name</th>
                <th className="px-2 sm:px-4 py-3">Role</th>
                <th className="px-2 sm:px-4 py-3">Email</th>
                <th className="px-2 sm:px-4 py-3">Salary</th>
                <th className="px-2 sm:px-4 py-3">Deductions</th>
                <th className="px-2 sm:px-4 py-3">Joining Date</th>
                <th className="px-2 sm:px-4 py-3 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-800">
              {search.trim().length > 0 && filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    className="text-center py-10 text-gray-500 text-lg"
                  >
                    No matching employees found.
                  </td>
                </tr>
              ) : (
                filtered.map((emp, index) => (
                  <tr
                    key={emp.employee_id}
                    className="border-t hover:bg-gray-50"
                  >
                    <td className="px-2 sm:px-4 py-2">{index + 1}</td>
                    <td className="px-2 sm:px-4 py-2 whitespace-nowrap">
                      <button
                        onClick={() => navigate(`/employee/${emp.employee_id}`)}
                        className="text-blue-600 hover:underline font-medium text-left"
                      >
                        {emp.first_name} {emp.last_name}
                      </button>
                    </td>
                    <td className="px-2 sm:px-4 py-2">
                      {["admin", "0", 0].includes(emp.role) ? (
                        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                          Admin
                        </span>
                      ) : ["hr", "1", 1].includes(emp.role) ? (
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                          HR
                        </span>
                      ) : (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                          Employee
                        </span>
                      )}
                    </td>
                    <td className="px-2 sm:px-4 py-2 whitespace-nowrap">{emp.email_address || "-"}</td>
                    <td className="px-2 sm:px-4 py-2 whitespace-nowrap">
                      {emp.salary != null && emp.salary !== "" ? (
                        canRevealSalary ? (
                          <button
                            type="button"
                            onClick={() =>
                              toggleSalaryVisibility(emp.employee_id)
                            }
                            className="text-blue-600 hover:underline"
                          >
                            {visibleSalaries[emp.employee_id]
                              ? `₹${parseFloat(emp.salary).toFixed(2)}`
                              : "*****"}
                          </button>
                        ) : (
                          "*****"
                        )
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-2 sm:px-4 py-2 whitespace-nowrap">
                      {emp.deduction != null && emp.deduction !== ""
                        ? `₹${parseFloat(emp.deduction).toFixed(2)}`
                        : "-"}
                    </td>
                    <td className="px-2 sm:px-4 py-2 whitespace-nowrap">
                      {emp.joining_date
                        ? new Date(emp.joining_date * 1000).toLocaleDateString(
                            "en-IN",
                            { day: "2-digit", month: "long", year: "numeric" }
                          )
                        : "-"}
                    </td>
                   <td className="px-2 py-2">
  {["admin", "hr"].includes(role) && (
    <div className="flex items-center gap-1.5 flex-nowrap">
      <button
        onClick={() => navigate(`/edit-employee/${emp.employee_id}`)}
        className="bg-primary-600 text-white px-2 py-1 text-xs rounded hover:bg-primary-700 whitespace-nowrap shrink-0"
      >
        Edit
      </button>

      <button
        onClick={() => confirmDeactivate(emp.employee_id)}
        className="bg-[#00142A] text-white px-2 py-1 text-xs rounded whitespace-nowrap shrink-0"
      >
        Deactivate
      </button>

      <button
        onClick={() =>
          navigate(`/employee/${emp.employee_id}/payrolls`)
        }
        className="bg-primary-600 text-white px-2 py-1 text-xs rounded hover:bg-primary-700 whitespace-nowrap shrink-0"
      >
        View Payroll
      </button>

      <button
        onClick={() => navigate(`/employee/${emp.employee_id}/leaves`)}
        className="bg-primary-600 text-white px-2 py-1 text-xs rounded hover:bg-primary-700 whitespace-nowrap shrink-0"
      >
        View Leaves
      </button>
    </div>
  )}
</td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
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
      ) : (
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
        </main>
      </div>

      <CustomConfirmDialog
        show={showLogoutConfirm}
        message="Are you sure you want to logout?"
        confirmText="Logout"
        cancelText="Cancel"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  );
}
