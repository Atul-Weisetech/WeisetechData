import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import API_BASE from "../config";
import {
  FaUsers,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaHome,
  FaExclamationTriangle,
} from "react-icons/fa";

export default function Sidebar({ onSelect, className = "" }) {
  const navigate = useNavigate();
  const location = useLocation();

  const role = localStorage.getItem("role");
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingWfhCount, setPendingWfhCount] = useState(0);
  const [employeeNotifCount, setEmployeeNotifCount] = useState(0);
  const employeeId = localStorage.getItem("id");

  // Active state — also highlights correct tab for sub-pages
  const { pathname, search } = location;
  const isEmployeeActive =
    search.includes("view=employees") ||
    (pathname === "/welcome" && !search.includes("view=")) ||
    pathname.startsWith("/employee/") ||
    pathname.startsWith("/edit-employee") ||
    pathname.startsWith("/add-employee") ||
    pathname.startsWith("/add-hr");

  const isPayrollActive =
    search.includes("view=payroll") ||
    pathname.startsWith("/add-payroll") ||
    pathname.startsWith("/edit-payroll");

  const isLeaveRequestActive = search.includes("view=LeaveRequest");
  const isWorkFromHomeActive = search.includes("view=WorkFromHome");
  const isPerformanceActive = search.includes("view=performance");

  useEffect(() => {
    let interval;
    const loadCounts = async () => {
      try {
        if (role === "admin" || role === "hr") {
          const res = await axios.get(
            `${API_BASE}/api/leave-requests/pending-count`
          );
          const count = res.data?.data?.pending_leave_requests ?? 0;
          setPendingCount(count);
          const wfhRes = await axios.get(
            `${API_BASE}/api/work-from-home/pending-count`
          );
          setPendingWfhCount(
            wfhRes.data?.data?.pending_work_from_home_requests ?? 0
          );
        }
        if (employeeId) {
          const resEmp = await axios.get(
            `${API_BASE}/api/leave-requests/employee/${employeeId}`
          );
          const items = resEmp.data?.data || [];
          const reviewed = items.filter(
            (i) => i.status_text === "approved" || i.status_text === "declined"
          ).length;
          setEmployeeNotifCount(reviewed);
        }
      } catch (e) {
        // fail silently
      }
    };
    loadCounts();
    interval = setInterval(loadCounts, 15000);
    return () => clearInterval(interval);
  }, [role, employeeId]);

  const itemBase =
    "cursor-pointer px-4 py-3.5 rounded-md transition-all duration-150 flex items-center gap-3";
  const activeClass = "bg-primary-600 text-white font-semibold shadow";
  const inactiveClass = "hover:bg-gray-100 text-gray-700";

  return (
    <div
      className={`w-80 h-full bg-white text-black flex flex-col shadow-xl overflow-x-hidden ${className}`}
    >
      {/* Nav items */}
      <ul className="flex-1 space-y-3 text-base font-medium px-2 py-8 overflow-y-auto overflow-x-hidden">
        {/* Employee Details */}
        <li
          title="Employee Details"
          className={`${itemBase} ${isEmployeeActive ? activeClass : inactiveClass}`}
          onClick={() =>
            onSelect?.("employees") || navigate("/welcome?view=employees")
          }
        >
          <FaUsers size={20} className="shrink-0" />
          <span>Employee Details</span>
          {employeeNotifCount > 0 && role !== "admin" && role !== "hr" && (
            <span className="ml-auto inline-flex items-center justify-center text-xs px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
              {employeeNotifCount}
            </span>
          )}
        </li>

        {/* Manage Payroll */}
        <li
          title="Manage Payroll"
          className={`${itemBase} ${isPayrollActive ? activeClass : inactiveClass}`}
          onClick={() =>
            onSelect?.("payroll") || navigate("/welcome?view=payroll")
          }
        >
          <FaMoneyBillWave size={20} className="shrink-0" />
          <span>Manage Payroll</span>
        </li>

        {/* Manage Leave Request */}
        <li
          title="Manage Leave Request"
          className={`relative ${itemBase} ${isLeaveRequestActive ? activeClass : inactiveClass}`}
          onClick={() =>
            onSelect?.("LeaveRequest") || navigate("/welcome?view=LeaveRequest")
          }
        >
          <FaCalendarAlt size={20} className="shrink-0" />
          <span>Manage Leave Request</span>
          {pendingCount > 0 && (role === "admin" || role === "hr") && (
            <>
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping opacity-75"></span>
              <span className="ml-auto flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold rounded-full bg-red-500 text-white border border-white">
                {pendingCount}
              </span>
            </>
          )}
        </li>

        {/* Manage Work From Home */}
        <li
          title="Manage Work From Home"
          className={`relative ${itemBase} ${isWorkFromHomeActive ? activeClass : inactiveClass}`}
          onClick={() =>
            onSelect?.("WorkFromHome") || navigate("/welcome?view=WorkFromHome")
          }
        >
          <FaHome size={20} className="shrink-0" />
          <span>Manage Work From Home</span>
          {pendingWfhCount > 0 && (role === "admin" || role === "hr") && (
            <>
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full animate-ping opacity-75"></span>
              <span className="ml-auto flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold rounded-full bg-amber-500 text-white border border-white">
                {pendingWfhCount}
              </span>
            </>
          )}
        </li>

        {/* Performance Warning */}
        <li
          title="Performance Warning"
          className={`${itemBase} ${isPerformanceActive ? activeClass : inactiveClass}`}
          onClick={() =>
            onSelect?.("performance") || navigate("/welcome?view=performance")
          }
        >
          <FaExclamationTriangle size={20} className="shrink-0" />
          <span>Performance Warning</span>
        </li>
      </ul>
    </div>
  );
}
