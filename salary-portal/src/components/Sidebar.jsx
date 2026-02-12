import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import weisetechLogo from "../assets/weisetechLogo.png";

export default function Sidebar({ onSelect, className = "" }) {
  const navigate = useNavigate();
  const location = useLocation();

  const role = localStorage.getItem("role");
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingWfhCount, setPendingWfhCount] = useState(0);
  const [employeeNotifCount, setEmployeeNotifCount] = useState(0);
  const employeeId = localStorage.getItem("id");

  // Active state
  const isEmployeeActive = location.search.includes("employees");
  const isPayrollActive = location.search.includes("payroll");
  const isPreviousPayrollsActive = location.search.includes("previous");
  const isLeaveRequestActive = location.search.includes("LeaveRequest");
  const isWorkFromHomeActive = location.search.includes("WorkFromHome");
  const isPerformanceActive = location.search.includes("performance");

  useEffect(() => {
    let interval;
    const loadCounts = async () => {
      try {
        if (role === "admin" || role === "hr") {
          const res = await axios.get(
            "http://localhost:5000/api/leave-requests/pending-count"
          );
          const count = res.data?.data?.pending_leave_requests ?? 0;
          setPendingCount(count);
          const wfhRes = await axios.get(
            "http://localhost:5000/api/work-from-home/pending-count"
          );
          setPendingWfhCount(wfhRes.data?.data?.pending_work_from_home_requests ?? 0);
        }
        if (employeeId) {
          const resEmp = await axios.get(
            `http://localhost:5000/api/leave-requests/employee/${employeeId}`
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

  return (
    <div
      className={`w-56 h-full bg-white text-black p-2 shadow-xl ${className}`}
    >
      <img
        src={weisetechLogo}
        alt="logo"
        className="mb-6 w-40 mx-auto pt-4 object-contain"
      />

      <ul className="space-y-4 text-base font-medium pl-[10px]">
        {/* Employee Details */}
        <li
          className={`cursor-pointer px-1 py-2 rounded-md transition transform whitespace-nowrap ${
            isEmployeeActive
              ? "bg-primary-600 text-white font-semibold shadow"
              : "hover:bg-gray-100 hover:-translate-y-1"
          }`}
          onClick={() =>
            onSelect?.("employees") || navigate("/welcome?view=employees")
          }
        >
          Employee Details
          {employeeNotifCount > 0 && role !== "admin" && role !== "hr" && (
            <span className="ml-2 inline-flex items-center justify-center text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
              {employeeNotifCount}
            </span>
          )}
        </li>

        {/* Manage Payroll */}
        <li
          className={`cursor-pointer px-1 py-2 rounded-md transition transform whitespace-nowrap ${
            isPayrollActive
              ? "bg-primary-600 text-white font-semibold shadow"
              : "hover:bg-gray-100 hover:-translate-y-1"
          }`}
          onClick={() =>
            onSelect?.("payroll") || navigate("/welcome?view=payroll")
          }
        >
          Manage Payroll
        </li>
        <li
          className={`cursor-pointer px-1 py-2 rounded-md transition transform whitespace-nowrap ${
            isPreviousPayrollsActive
              ? "bg-primary-600 text-white font-semibold shadow"
              : "hover:bg-gray-100 hover:-translate-y-1"
          }`}
          onClick={() =>
            onSelect?.("previous") || navigate("/welcome?view=previous")
          }
        >
          Previous Payrolls
        </li>
        <li
          className={`relative cursor-pointer px-1 py-2 rounded-md transition-transform whitespace-nowrap flex items-center justify-between group ${
            isLeaveRequestActive
              ? "bg-primary-600 text-white font-semibold shadow"
              : "hover:bg-gray-100 hover:-translate-y-1"
          }`}
          onClick={() =>
            onSelect?.("LeaveRequest") || navigate("/welcome?view=LeaveRequest")
          }
        >
          <span className="flex items-center">Manage Leave Request</span>

          {pendingCount > 0 && (role === "admin" || role === "hr") && (
            <>
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping opacity-75"></span>
              <span className="relative flex items-center justify-center min-w-[24px] h-6 px-2 -mt-4 -mr-1 text-xs font-bold rounded-full bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg transform -translate-y-1 border-2 border-white group-hover:scale-110 group-hover:-translate-y-2 transition-all duration-200">
                {pendingCount}
                <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-red-600"></span>
              </span>
            </>
          )}
        </li>
        <li
          className={`relative cursor-pointer px-1 py-2 rounded-md transition-transform whitespace-nowrap flex items-center justify-between group ${
            isWorkFromHomeActive
              ? "bg-primary-600 text-white font-semibold shadow"
              : "hover:bg-gray-100 hover:-translate-y-1"
          }`}
          onClick={() =>
            onSelect?.("WorkFromHome") || navigate("/welcome?view=WorkFromHome")
          }
        >
          <span className="flex items-center">Manage Work From Home</span>
          {pendingWfhCount > 0 && (role === "admin" || role === "hr") && (
            <>
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full animate-ping opacity-75"></span>
              <span className="relative flex items-center justify-center min-w-[24px] h-6 px-2 -mt-4 -mr-1 text-xs font-bold rounded-full bg-amber-500 text-white shadow-lg transform -translate-y-1 border-2 border-white">
                {pendingWfhCount}
              </span>
            </>
          )}
        </li>
        <li
          className={`cursor-pointer px-1 py-2 rounded-md transition transform whitespace-nowrap ${
            isPerformanceActive
              ? "bg-primary-600 text-white font-semibold shadow"
              : "hover:bg-gray-100 hover:-translate-y-1"
          }`}
          onClick={() =>
            onSelect?.("performance") || navigate("/welcome?view=performance")
          }
        >
          Performance Warning
        </li>
      </ul>
    </div>
  );
}
