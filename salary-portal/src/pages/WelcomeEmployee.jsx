import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useOutletContext, useSearchParams } from "react-router-dom";
import {
  FaTachometerAlt,
  FaMoneyBillWave,
  FaBell,
  FaCalendarAlt,
  FaHome,
  FaDownload,
  FaClock,
  FaCalendarPlus,
  FaBuilding,
  FaUserTie,
  FaArrowRight,
  FaFileInvoiceDollar,
} from "react-icons/fa";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import LeaveRequest from "../components/LeaveRequest";
import EmployeeTimeTracker from "../components/EmployeeTimeTracker";
import WorkFromHomeRequest from "../components/WorkFromHomeRequest";
import NotificationCenter from "../components/NotificationCenter";
import axios from "axios";
import { ClimbingBoxLoader } from "react-spinners";
import jsPDF from "jspdf";
import "jspdf-autotable";
import DataTable from "react-data-table-component";
import API_BASE from "../config";

const getGreeting = () => {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Good Morning";
  if (h >= 12 && h < 17) return "Good Afternoon";
  if (h >= 17 && h < 21) return "Good Evening";
  return "Good Night";
};

function WelcomeEmployee() {
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employeeName, setEmployeeName] = useState("");
  const [designation, setDesignation] = useState("");
  const [activeSection, setActiveSection] = useState("dashboard");
  const [remainingLeaves, setRemainingLeaves] = useState(0);
  const [totalLeaves, setTotalLeaves] = useState(14);
  const [leaveUsed, setLeaveUsed] = useState(0);
  const [joiningDate, setJoiningDate] = useState("");
  const [pendingLeaves, setPendingLeaves] = useState(0);
  const [wfhRequests, setWfhRequests] = useState([]);
  const [leaveList, setLeaveList] = useState([]);
  const [leaveFilter, setLeaveFilter] = useState("all");
  const [wfhFilter, setWfhFilter] = useState("all");
  const [payrollPage, setPayrollPage] = useState(1);
  const PAYROLLS_PER_PAGE = 8;
  const [reviewedUpdatesCount, setReviewedUpdatesCount] = useState(0);
  const [lastSeenReviewedCount, setLastSeenReviewedCount] = useState(0);
  const [unreadAppNotificationsCount, setUnreadAppNotificationsCount] = useState(0);

  // Must be declared before any useEffect that references these values
  const outletCtx = useOutletContext() || {};
  const { isSidebarOpen = false, setIsSidebarOpen = () => {}, setNotificationCount = () => {} } = outletCtx;

  const employeeId = localStorage.getItem("id");

  const [searchParams] = useSearchParams();

  useEffect(() => {
    const section = searchParams.get("section");
    if (section) setActiveSection(section);
  }, [searchParams]);

  const lastSeenStorageKey = useMemo(
    () => (employeeId ? `notifications_last_seen_${employeeId}` : null),
    [employeeId]
  );

  useEffect(() => {
    setNotificationCount(unreadAppNotificationsCount + Math.max(0, reviewedUpdatesCount - lastSeenReviewedCount));
  }, [unreadAppNotificationsCount, reviewedUpdatesCount, lastSeenReviewedCount, setNotificationCount]);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isWFHModalOpen, setIsWFHModalOpen] = useState(false);
  const [isTimeTrackerOpen, setIsTimeTrackerOpen] = useState(false);
  const [department, setDepartment] = useState("");
  const [timerState, setTimerState] = useState({
    isTracking: false, elapsedTime: 0, startTime: "",
    activityLogs: [], currentActivityType: "Working time",
  });

  const handleTimerUpdate = useCallback((s) => setTimerState(s), []);

  const formatTimerDisplay = (sec) => {
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    const p = (n) => String(n).padStart(2, "0");
    return `${p(h)}:${p(m)}:${p(s)}`;
  };

  useEffect(() => {
    if (!timerState.isTracking || isTimeTrackerOpen) return;
    const iv = setInterval(() => setTimerState((prev) => ({ ...prev, elapsedTime: prev.elapsedTime + 1 })), 1000);
    return () => clearInterval(iv);
  }, [timerState.isTracking, isTimeTrackerOpen]);

  const normalizeDateValue = (value) => {
    if (!value) return null;
    if (typeof value === "number") {
      const str = value.toString().padStart(8, "0");
      return `${str.slice(0, 4)}-${str.slice(4, 6)}-${str.slice(6, 8)}`;
    }
    if (typeof value === "string" && /^\d{8}$/.test(value)) {
      return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
    }
    return value;
  };

  // Function to calculate days between two dates
  const calculateLeaveDays = (fromDate, toDate) => {
    const start = new Date(normalizeDateValue(fromDate) || fromDate);
    const end = new Date(normalizeDateValue(toDate) || toDate);
    const timeDiff = end.getTime() - start.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // +1 to include both start and end dates
    return daysDiff;
  };

  const fetchEmployeeData = useCallback(
    async ({ showLoader = true } = {}) => {
      if (!employeeId) return;
      if (showLoader) setLoading(true);
      try {
        const payrollRes = await axios.get(
          `${API_BASE}/api/payrolls/employee/${employeeId}`
        );
        setPayrolls(payrollRes.data || []);

        const employeeRes = await axios.get(
          `${API_BASE}/api/employees/${employeeId}`
        );
        const employeeData = Array.isArray(employeeRes.data)
          ? employeeRes.data[0]
          : employeeRes.data;

        if (employeeData) {
          const joinDate = normalizeDateValue(employeeData.joining_date) || "";
          setJoiningDate(joinDate);

          const leaveRes = await axios.get(
            `${API_BASE}/api/leave-requests/employee/${employeeId}`
          );
          const leaveRequests = Array.isArray(leaveRes.data)
            ? leaveRes.data
            : leaveRes.data?.data || [];

          const approvedLeaves = leaveRequests
            .filter((leave) => {
              const status = (
                leave.status_text ||
                leave.status ||
                ""
              ).toLowerCase();
              return status === "approved";
            })
            .reduce(
              (total, leave) =>
                total + calculateLeaveDays(leave.from_date, leave.to_date),
              0
            );

          const pendingCount = leaveRequests
            .filter((leave) => {
              const status = (
                leave.status_text ||
                leave.status ||
                ""
              ).toLowerCase();
              return status === "requested" || status === "pending";
            })
            .reduce(
              (total, leave) =>
                total + calculateLeaveDays(leave.from_date, leave.to_date),
              0
            );

          setLeaveList(leaveRequests);
          setLeaveUsed(approvedLeaves);
          setPendingLeaves(pendingCount);

          setRemainingLeaves(Math.max(0, totalLeaves - approvedLeaves));

          const wfhRes = await axios.get(
            `${API_BASE}/api/work-from-home/employee/${employeeId}`
          );
          const wfhList = Array.isArray(wfhRes.data) ? wfhRes.data : wfhRes.data?.data || [];
          setWfhRequests(wfhList);
        }
      } catch (error) {
        console.error("Error fetching employee data:", error);
      } finally {
        if (showLoader) setLoading(false);
      }
    },
    [employeeId]
  );

  useEffect(() => {
    if (!employeeId) return;
    const storedName = localStorage.getItem("name");
    if (storedName) setEmployeeName(storedName);
    const storedDesignation = localStorage.getItem("designation");
    if (storedDesignation) setDesignation(storedDesignation);
    const storedDept = localStorage.getItem("department");
    if (storedDept) setDepartment(storedDept);

    fetchEmployeeData();

    const fetchReviewedCount = async () => {
      try {
        const [leaveRes, wfhRes] = await Promise.all([
          axios.get(`${API_BASE}/api/leave-requests/employee/${employeeId}`),
          axios.get(`${API_BASE}/api/work-from-home/employee/${employeeId}`),
        ]);
        const leaveItems = leaveRes.data?.data ?? (Array.isArray(leaveRes.data) ? leaveRes.data : []);
        const wfhItems = wfhRes.data?.data ?? (Array.isArray(wfhRes.data) ? wfhRes.data : []);
        const statusOk = (s) => (String(s || "").toLowerCase() === "approved" || String(s || "").toLowerCase() === "declined");
        const count = [...leaveItems, ...wfhItems].filter(
          (i) => statusOk(i.status_text) || statusOk(i.status)
        ).length;
        setReviewedUpdatesCount(count);
      } catch (e) {
        // ignore
      }
    };
    fetchReviewedCount();

    const fetchUnreadAppNotifications = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/notifications/employee/${employeeId}/unread-count`);
        setUnreadAppNotificationsCount(res.data?.count ?? 0);
      } catch (e) {
        // ignore
      }
    };
    fetchUnreadAppNotifications();
    const notifInterval = setInterval(fetchReviewedCount, 15000);
    const unreadInterval = setInterval(fetchUnreadAppNotifications, 15000);

    return () => {
      clearInterval(notifInterval);
      clearInterval(unreadInterval);
    };
  }, [employeeId, fetchEmployeeData]);

  useEffect(() => {
    if (!lastSeenStorageKey) return;
    try {
      const v = localStorage.getItem(lastSeenStorageKey);
      setLastSeenReviewedCount(v != null ? parseInt(v, 10) || 0 : 0);
    } catch {
      setLastSeenReviewedCount(0);
    }
  }, [lastSeenStorageKey]);

  useEffect(() => {
    if (activeSection !== "notifications" || !lastSeenStorageKey) return;
    setLastSeenReviewedCount((prev) => {
      const next = reviewedUpdatesCount;
      if (next === prev) return prev;
      try {
        localStorage.setItem(lastSeenStorageKey, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, [activeSection, lastSeenStorageKey, reviewedUpdatesCount]);

  useEffect(() => {
    if (!employeeId) return;
    const refresh = setInterval(() => {
      fetchEmployeeData({ showLoader: false });
    }, 60000);
    return () => clearInterval(refresh);
  }, [employeeId, fetchEmployeeData]);

  const handleDownload = async (payslipData) => {
    try {
      const breakdownRes = await axios.get(
        `${API_BASE}/api/payrolls/employee/breakdown`,
        { params: { payrollId: payslipData.id } }
      );
      const breakdown = Array.isArray(breakdownRes.data)
        ? breakdownRes.data
        : [];

      const netPay =
        (parseFloat(payslipData.payroll_amount) || 0) -
        (parseFloat(payslipData.deduction) || 0);

      const doc = new jsPDF();
      let y = 15;

      doc.setFontSize(16);
      doc.setTextColor(40);
      doc.text("Weisetech - Employee Payslip", 105, y, { align: "center" });
      y += 10;

      doc.setFontSize(11);
      doc.text(`Name: ${employeeName || "-"}`, 14, y);
      doc.text(`Employee ID: ${payslipData.fk_employee_id}`, 110, y);
      y += 7;
      doc.text(`Designation: ${designation || "-"}`, 14, y);
      doc.text(`Pay Month: ${payslipData.pay_month || "-"}`, 110, y);
      y += 7;
      doc.text(`Payment Mode: ${payslipData.mode_of_payment || "-"}`, 14, y);
      const payrollDate = payslipData.payroll_date
        ? new Date(payslipData.payroll_date).toLocaleDateString("en-IN")
        : "-";
      doc.text(`Date: ${payrollDate}`, 110, y);
      y += 10;

      doc.setFontSize(12);
      doc.text("Salary Summary", 14, y);
      y += 6;
      doc.setFontSize(11);
      doc.text(
        `Gross Salary: ₹${(
          parseFloat(payslipData.payroll_amount) || 0
        ).toLocaleString()}`,
        14,
        y
      );
      y += 6;
      doc.text(
        `Deductions: ₹${(
          parseFloat(payslipData.deduction) || 0
        ).toLocaleString()}`,
        14,
        y
      );
      y += 6;
      doc.setFontSize(12);
      doc.setTextColor(0, 128, 0);
      doc.text(`Net Pay: ₹${netPay.toLocaleString()}`, 14, y);
      doc.setTextColor(0);
      y += 10;

      doc.setFontSize(12);
      doc.text("Breakdown", 14, y);
      y += 4;
      const tableBody = breakdown.map((b, idx) => [
        String(idx + 1),
        b.type || b["type"] || "-",
        b.is_earning ? "Earning" : "Deduction",
        `₹${(parseFloat(b.amount) || 0).toLocaleString()}`,
      ]);

      doc.autoTable({
        startY: y,
        head: [["#", "Type", "Category", "Amount"]],
        body: tableBody,
        styles: { fontSize: 10 },
        theme: "grid",
        headStyles: { fillColor: [99, 102, 241] },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 90 },
          2: { cellWidth: 30 },
          3: { cellWidth: 40, halign: "right" },
        },
      });

      const fileName = `Payslip_${(payslipData.pay_month || "").replace(
        /\s+/g,
        "_"
      )}_${payslipData.fk_employee_id}.pdf`;
      doc.save(fileName);
    } catch (err) {
      console.error("Failed to download payslip:", err);
      alert("Failed to generate PDF");
    }
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: <FaTachometerAlt size={20} /> },
    { id: "payrolls", label: "Payrolls", icon: <FaMoneyBillWave size={20} /> },
    { id: "notifications", label: "Notifications", icon: <FaBell size={20} />},
    { id: "leave-requests", label: "Leave Requests", icon: <FaCalendarAlt size={20} /> },
    { id: "work-from-home", label: "Work From Home", icon: <FaHome size={20} /> },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard": {
        const leaveChartData = [
          { name: "Used", value: leaveUsed, color: "#ef4444" },
          { name: "Remaining", value: remainingLeaves, color: "#22c55e" },
          { name: "Pending", value: pendingLeaves, color: "#f97316" },
        ].filter((d) => d.value > 0);
        const recentPayrolls = [...payrolls].sort((a, b) => b.id - a.id).slice(0, 4);
        const todayHrs = Math.floor(timerState.elapsedTime / 3600);
        const todayMins = Math.floor((timerState.elapsedTime % 3600) / 60);

        return (
          <div className="p-6 lg:p-8 space-y-6">

            {/* Header: Greeting + Quick Actions */}
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                  {getGreeting()}, {employeeName.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ")}! 👋
                </h1>
                <p className="text-gray-500 mt-1 text-sm lg:text-base">
                  Hope you have a productive day ahead ✨
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setIsLeaveModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-primary-200 bg-primary-50 hover:bg-primary-100 text-primary-700 text-sm font-semibold transition-colors shadow-sm"
                >
                  <FaCalendarPlus size={14} /> Apply Leave
                </button>
                <button
                  onClick={() => setIsWFHModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-700 text-sm font-semibold transition-colors shadow-sm"
                >
                  <FaHome size={14} /> Request WFH
                </button>
                <button
                  onClick={() => setIsTimeTrackerOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold transition-colors shadow-md"
                >
                  <FaClock size={14} />
                  {timerState.isTracking
                    ? `${String(todayHrs).padStart(2,"0")}:${String(todayMins).padStart(2,"0")} Tracking`
                    : "Open Time Tracker"}
                </button>
              </div>
            </div>

            {/* Profile Summary Card */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-400 rounded-2xl p-5 text-white flex flex-wrap items-center gap-6">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <FaUserTie size={24} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-primary-100 text-xs font-medium uppercase tracking-wider">Employee Profile</p>
                <h2 className="text-xl font-bold mt-0.5">{employeeName ? employeeName.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ") : "—"}</h2>
              </div>
              <div className="flex flex-wrap gap-6 text-sm">
                <div>
                  <p className="text-primary-200 text-xs uppercase tracking-wider">Designation</p>
                  <p className="font-semibold mt-0.5 flex items-center gap-1.5">
                    <FaUserTie size={11} className="text-primary-200" />
                    {designation || "—"}
                  </p>
                </div>
                {/* <div>
                  <p className="text-primary-200 text-xs uppercase tracking-wider">Department</p>
                  <p className="font-semibold mt-0.5 flex items-center gap-1.5">
                    <FaBuilding size={11} className="text-primary-200" />
                    {department || "—"}
                  </p>
                </div> */}
                <div>
                  <p className="text-primary-200 text-xs uppercase tracking-wider">Joining Date</p>
                  <p className="font-semibold mt-0.5 flex items-center gap-1.5">
                    <FaCalendarAlt size={11} className="text-primary-200" />
                    {joiningDate
                      ? new Date(joiningDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                      : "—"}
                  </p>
                </div>
              </div>
            </div>
            

            {/* Stats Row — 3 equal cards spanning full width */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Leave Balance */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 lg:p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] lg:text-xs font-semibold text-gray-500 uppercase tracking-wider">Leave Balance</span>
                  <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                    <FaCalendarAlt size={13} className="text-green-600 lg:hidden" />
                    <FaCalendarAlt size={16} className="text-green-600 hidden lg:block" />
                  </div>
                </div>
                <p className="text-2xl lg:text-3xl 2xl:text-4xl font-bold text-green-600">{remainingLeaves}</p>
                <p className="text-[11px] lg:text-xs text-gray-400 mt-0.5">days remaining</p>
                <div className="w-full bg-gray-100 rounded-full h-1.5 mt-3">
                  <div
                    className="bg-green-500 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, (remainingLeaves / totalLeaves) * 100))}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] lg:text-xs text-gray-400 mt-1.5">
                  <span>Used: {leaveUsed}</span>
                  <span className="text-orange-500">Pending: {pendingLeaves}</span>
                </div>
              </div>

              {/* Payslips */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 lg:p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] lg:text-xs font-semibold text-gray-500 uppercase tracking-wider">Payslips</span>
                  <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                    <FaMoneyBillWave size={13} className="text-purple-600 lg:hidden" />
                    <FaMoneyBillWave size={16} className="text-purple-600 hidden lg:block" />
                  </div>
                </div>
                <p className="text-2xl lg:text-3xl 2xl:text-4xl font-bold text-purple-600">{payrolls.length}</p>
                <p className="text-[11px] lg:text-xs text-gray-400 mt-0.5">available payslips</p>
                <button
                  onClick={() => setActiveSection("payrolls")}
                  className="mt-3 flex items-center gap-1 text-[11px] lg:text-xs text-primary-600 font-medium hover:text-primary-700"
                >
                  View all <FaArrowRight size={9} />
                </button>
              </div>

              {/* Days This Month */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 lg:p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] lg:text-xs font-semibold text-gray-500 uppercase tracking-wider">This Month</span>
                  <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl bg-cyan-100 flex items-center justify-center shrink-0">
                    <FaFileInvoiceDollar size={13} className="text-cyan-600 lg:hidden" />
                    <FaFileInvoiceDollar size={16} className="text-cyan-600 hidden lg:block" />
                  </div>
                </div>
                <p className="text-2xl lg:text-3xl 2xl:text-4xl font-bold text-cyan-600">{new Date().getDate()}</p>
                <p className="text-[11px] lg:text-xs text-gray-400 mt-0.5">days completed</p>
                <p className="text-[11px] lg:text-xs text-gray-400 mt-3">
                  {new Date().toLocaleString("en-IN", { month: "long", year: "numeric" })}
                </p>
              </div>
            </div>

            {/* Analytics Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Leave Usage Chart */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Leave Usage</h3>
                {leaveChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={leaveChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {leaveChartData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v, n) => [`${v} days`, n]} />
                      <Legend iconType="circle" iconSize={8} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
                    No leave data available
                  </div>
                )}
                <div className="flex justify-around mt-1 text-xs text-center text-gray-500">
                  <div><p className="font-bold text-red-500 text-base">{leaveUsed}</p><p>Used</p></div>
                  <div><p className="font-bold text-green-500 text-base">{remainingLeaves}</p><p>Remaining</p></div>
                  <div><p className="font-bold text-orange-500 text-base">{pendingLeaves}</p><p>Pending</p></div>
                </div>
              </div>

              {/* Working Hours Today */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Today's Working Hours</h3>
                <div className="flex flex-col items-center justify-center h-44">
                  <div className={`w-32 h-32 rounded-full border-8 flex items-center justify-center ${
                    timerState.isTracking ? "border-green-400" : "border-gray-200"
                  }`}>
                    <div className="text-center">
                      <FaClock size={20} className={timerState.isTracking ? "text-green-500 mx-auto mb-1" : "text-gray-400 mx-auto mb-1"} />
                      <p className="text-xl font-bold font-mono text-gray-800">
                        {String(todayHrs).padStart(2,"0")}:{String(todayMins).padStart(2,"0")}
                      </p>
                    </div>
                  </div>
                  <p className={`mt-4 text-sm font-medium ${timerState.isTracking ? "text-green-600" : "text-gray-400"}`}>
                    {timerState.isTracking ? "Session in progress" : "No active session"}
                  </p>
                  {timerState.activityLogs.length > 0 && (
                    <p className="text-xs text-gray-400 mt-1">
                      {timerState.activityLogs.length} activit{timerState.activityLogs.length === 1 ? "y" : "ies"} logged
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setIsTimeTrackerOpen(true)}
                  className="w-48 mx-auto mt-2 flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 rounded-xl text-sm transition-colors"
                >
                  <FaClock size={13} />
                  {timerState.isTracking ? "View Tracker" : "Start Tracking"}
                </button>
              </div>
            </div>

            {/* Recent Payslips */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Recent Payslips</h3>
                <button
                  onClick={() => setActiveSection("payrolls")}
                  className="flex items-center gap-1 text-xs text-primary-600 font-medium hover:text-primary-700"
                >
                  View All <FaArrowRight size={10} />
                </button>
              </div>
              {loading ? (
                <div className="flex justify-center h-28 items-center">
                  <ClimbingBoxLoader color="#CC0D49" size={15} />
                </div>
              ) : recentPayrolls.length === 0 ? (
                <div className="text-center text-gray-400 py-8 text-sm">No payslips available yet</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {recentPayrolls.map((p) => {
                    const net = (parseFloat(p.payroll_amount) || 0) - (parseFloat(p.deduction) || 0);
                    return (
                      <div key={p.id} className="rounded-xl border border-primary-100 overflow-hidden hover:shadow-md transition-shadow">
                        <div className="bg-gradient-to-r from-primary-600 to-primary-400 px-4 py-3 flex items-center justify-between">
                          <div>
                            <p className="text-[10px] text-primary-100 uppercase tracking-wider">Payslip</p>
                            <h4 className="text-sm font-bold text-white mt-0.5">{p.pay_month}</h4>
                          </div>
                          <FaMoneyBillWave size={14} className="text-white/70" />
                        </div>
                        <div className="px-4 py-3 space-y-1.5 text-xs bg-white">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Mode</span>
                            <span className="font-medium text-gray-700">{p.mode_of_payment || "—"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Gross</span>
                            <span className="font-medium text-gray-700">₹{parseFloat(p.payroll_amount).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Deductions</span>
                            <span className="font-medium text-red-500">₹{(parseFloat(p.deduction) || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between pt-1.5 border-t border-gray-100">
                            <span className="font-semibold text-gray-600">Net Pay</span>
                            <span className="font-bold text-primary-700">₹{net.toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100">
                          <button
                            onClick={() => handleDownload(p)}
                            className="w-full flex items-center justify-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-medium py-2 rounded-lg transition-colors"
                          >
                            <FaDownload size={11} /> Download
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      }

      case "payrolls":
        return (
          <div className="p-8">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Payrolls
              </h1>
              <p className="text-lg text-gray-600">
                Your salary slips and payment history
              </p>
            </div>
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <ClimbingBoxLoader color="#6366F1" size={20} />
              </div>
            ) : payrolls.length === 0 ? (
              <div className="text-center text-gray-500 py-16">
                <p className="text-xl">No payslips available yet</p>
              </div>
            ) : (() => {
                const sortedPayrolls = [...payrolls].sort((a, b) => b.id - a.id);
                const totalPages = Math.ceil(sortedPayrolls.length / PAYROLLS_PER_PAGE);
                const paginated = sortedPayrolls.slice(
                  (payrollPage - 1) * PAYROLLS_PER_PAGE,
                  payrollPage * PAYROLLS_PER_PAGE
                );
                return (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 lg:gap-5 2xl:gap-6">
                      {paginated.map((payslipData) => {
                        const netPay =
                          (parseFloat(payslipData.payroll_amount) || 0) -
                          (parseFloat(payslipData.deduction) || 0);
                        return (
                          <div
                            key={payslipData.id}
                            className="rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-primary-100 overflow-hidden"
                          >
                            {/* Themed gradient header */}
                            <div className="bg-gradient-to-r from-primary-600 to-primary-400 px-4 lg:px-5 py-3 lg:py-4 flex items-center justify-between">
                              <div>
                                <p className="text-[10px] lg:text-xs font-medium text-primary-100 uppercase tracking-wider">Payslip</p>
                                <h3 className="text-sm lg:text-base font-bold text-white mt-0.5 leading-tight">
                                  {payslipData.pay_month}
                                </h3>
                              </div>
                              <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                                <FaMoneyBillWave className="text-white" size={14} />
                              </div>
                            </div>

                            {/* Card body */}
                            <div className="bg-white px-4 lg:px-5 py-3 lg:py-4 space-y-2 lg:space-y-2.5">
                              <div className="flex justify-between items-center gap-2">
                                <span className="text-[11px] lg:text-xs text-gray-500 shrink-0">Payment Mode</span>
                                <span className="text-[11px] lg:text-xs font-medium text-gray-800 text-right">{payslipData.mode_of_payment || "—"}</span>
                              </div>
                              <div className="flex justify-between items-center gap-2">
                                <span className="text-[11px] lg:text-xs text-gray-500 shrink-0">Gross Salary</span>
                                <span className="text-[11px] lg:text-xs font-medium text-gray-800">₹{parseFloat(payslipData.payroll_amount).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between items-center gap-2">
                                <span className="text-[11px] lg:text-xs text-gray-500 shrink-0">Deductions</span>
                                <span className="text-[11px] lg:text-xs font-medium text-red-500">₹{(parseFloat(payslipData.deduction) || 0).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between items-center gap-2 pt-2 border-t border-gray-100">
                                <span className="text-xs lg:text-sm font-semibold text-gray-700 shrink-0">Net Pay</span>
                                <span className="text-sm lg:text-base font-bold text-primary-700">₹{netPay.toLocaleString()}</span>
                              </div>
                            </div>

                            {/* Download button */}
                            <div className="bg-gray-50 px-4 lg:px-5 py-2.5 lg:py-3 border-t border-gray-100">
                              <button
                                onClick={() => handleDownload(payslipData)}
                                className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 lg:py-2.5 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md text-xs lg:text-sm"
                              >
                                <FaDownload size={12} />
                                Download Payslip
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 mt-8">
                        <button
                          onClick={() => setPayrollPage((p) => Math.max(1, p - 1))}
                          disabled={payrollPage === 1}
                          className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          Previous
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => setPayrollPage(page)}
                            className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                              page === payrollPage
                                ? "bg-primary-600 text-white shadow-sm"
                                : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                        <button
                          onClick={() => setPayrollPage((p) => Math.min(totalPages, p + 1))}
                          disabled={payrollPage === totalPages}
                          className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                );
              })()}
          </div>
        );

      case "notifications":
        return (
          <div className="p-8">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Notifications
              </h1>
              <p className="text-lg text-gray-600">
                Stay updated with important alerts
              </p>
            </div>
            <NotificationCenter
              employeeId={employeeId}
              embedded={true}
              onUnreadCountChange={setUnreadAppNotificationsCount}
            />
          </div>
        );

      case "leave-requests": {
        const filterOptions = ["all", "approved", "pending", "declined"];

        // Only show leaves belonging to the logged-in employee
        const myLeaves = leaveList.filter(
          (l) => String(l.employee_id) === String(employeeId)
        );

        const filteredLeaves = leaveFilter === "all"
          ? myLeaves
          : myLeaves.filter((l) => {
              const s = (l.status_text || l.status || "").toLowerCase();
              if (leaveFilter === "pending") return s === "pending" || s === "requested";
              return s === leaveFilter;
            });

        const getStatusBadge = (statusText) => {
          const s = (statusText || "").toLowerCase();
          const styles = {
            approved: "bg-green-100 text-green-800 border-green-200",
            declined: "bg-red-100 text-red-800 border-red-200",
            requested: "bg-yellow-100 text-yellow-800 border-yellow-200",
            pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
          };
          return (
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[s] || "bg-gray-100 text-gray-700 border-gray-200"}`}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </span>
          );
        };

        return (
          <div className="p-4 sm:p-8 space-y-8">
            {/* Header */}
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Leave Requests</h1>
              <p className="text-gray-600">Apply for leave and view your leave history</p>
            </div>

            {/* Apply Form */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Apply for Leave</h2>
              <LeaveRequest
                embedded={true}
                remainingLeaves={remainingLeaves}
                onSuccess={() => fetchEmployeeData({ showLoader: false })}
              />
            </div>

            {/* Leave History */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <h2 className="text-xl font-semibold text-gray-800">My Leave History</h2>
                <div className="flex gap-2 flex-wrap">
                  {filterOptions.map((f) => (
                    <button
                      key={f}
                      onClick={() => setLeaveFilter(f)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        leaveFilter === f
                          ? "bg-blue-700 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <DataTable
                columns={[
                  { name: "Sr.No", cell: (_, i) => i + 1, width: "75px" },
                  {
                    name: "From",
                    selector: (r) => r.from_date,
                    cell: (r) => r.from_date ? new Date(r.from_date).toLocaleDateString() : "—",
                    sortable: true,
                    grow: 1,
                  },
                  {
                    name: "To",
                    selector: (r) => r.to_date,
                    cell: (r) => r.to_date ? new Date(r.to_date).toLocaleDateString() : "—",
                    sortable: true,
                    grow: 1,
                  },
                  { name: "Days", selector: (r) => r.number_of_days, sortable: true, width: "85px" },
                  {
                    name: "Reason",
                    selector: (r) => r.description,
                    cell: (r) => (
                      <span title={r.description} className="text-sm text-gray-700">
                        {r.description || "—"}
                      </span>
                    ),
                    grow: 1,
                  },
                  {
                    name: "Status",
                    selector: (r) => (r.status_text || r.status || "").toLowerCase(),
                    cell: (r) => getStatusBadge(r.status_text || r.status),
                    sortable: true,
                    grow: 2,
                  },
                  {
                    name: "Applied On",
                    selector: (r) => r.applied_date,
                    cell: (r) => r.applied_date ? new Date(r.applied_date).toLocaleDateString() : "—",
                    sortable: true,
                    grow: 2,
                  },
                  { name: "Reviewed By", selector: (r) => (r.reviewed_by || "").toLowerCase(),
                     cell: (r) => r.reviewed_by || "—", sortable: true, grow: 2 },
                ]}
                data={filteredLeaves}
                pagination
                paginationRowsPerPageOptions={[5, 10, 25]}
                customStyles={{
                  headRow: { style: { backgroundColor: "#eff6ff", borderBottom: "2px solid #bfdbfe" } },
                  headCells: { style: { color: "#374151", fontWeight: "600", fontSize: "13px" } },
                  rows: { style: { "&:hover": { backgroundColor: "#f0f9ff" }, alignItems: "flex-start" } },
                  cells: { style: { whiteSpace: "normal", wordBreak: "break-word", paddingTop: "10px", paddingBottom: "10px" } },
                  pagination: { style: { borderTop: "1px solid #e2e8f0", backgroundColor: "#f8fafc" } },
                }}
                noDataComponent={
                  <div className="text-center py-10 text-gray-500">
                    No {leaveFilter === "all" ? "" : leaveFilter} leave requests found.
                  </div>
                }
              />
            </div>
          </div>
        );
      }

      case "work-from-home": {
        const wfhFilterOptions = ["all", "approved", "pending", "declined"];
        const myWfh = wfhRequests.filter((r) => String(r.employee_id) === String(employeeId));
        const filteredWfh = wfhFilter === "all"
          ? myWfh
          : myWfh.filter((r) => {
              const s = (r.status_text || r.status || "").toLowerCase();
              if (wfhFilter === "pending") return s === "pending" || s === "requested";
              return s === wfhFilter;
            });

        const getWfhStatusBadge = (statusText) => {
          const s = (statusText || "").toLowerCase();
          const styles = {
            approved: "bg-green-100 text-green-800 border-green-200",
            declined: "bg-red-100 text-red-800 border-red-200",
            requested: "bg-yellow-100 text-yellow-800 border-yellow-200",
            pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
          };
          return (
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[s] || "bg-gray-100 text-gray-700 border-gray-200"}`}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </span>
          );
        };

        return (
          <div className="p-4 sm:p-8 space-y-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Work From Home</h1>
              <p className="text-base sm:text-lg text-gray-600">Request and view your work from home days</p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Apply for Work From Home</h2>
              <WorkFromHomeRequest embedded={true} onSuccess={() => fetchEmployeeData({ showLoader: false })} />
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <h2 className="text-xl font-semibold text-gray-800">My WFH History</h2>
                <div className="flex gap-2 flex-wrap">
                  {wfhFilterOptions.map((f) => (
                    <button
                      key={f}
                      onClick={() => setWfhFilter(f)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        wfhFilter === f
                          ? "bg-blue-700 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <DataTable
                columns={[
                  { name: "Sr.No", cell: (_, i) => i + 1, width: "75px" },
                  {
                    name: "From",
                    selector: (r) => r.from_date,
                    cell: (r) => r.from_date ? new Date(r.from_date).toLocaleDateString() : "—",
                    sortable: true,
                    grow: 0.5,
                  },
                  {
                    name: "To",
                    selector: (r) => r.to_date,
                    cell: (r) => r.to_date ? new Date(r.to_date).toLocaleDateString() : "—",
                    sortable: true,
                    grow: 0.5,
                  },
                  { name: "Days", selector: (r) => r.number_of_days, sortable: true, width: "85px" },
                  {
                    name: "Reason",
                    selector: (r) => (r.description || "").toLowerCase(),
                    cell: (r) => (
                      <span title={r.description} className="text-sm text-gray-700">
                        {r.description || "—"}
                      </span>
                    ),
                    grow: 1,
                  },
                  {
                    name: "Status",
                    selector: (r) => (r.status_text || r.status || "").toLowerCase(),
                    cell: (r) => getWfhStatusBadge(r.status_text || r.status),
                    sortable: true,
                    grow: 1.2,
                  },
                  {
                    name: "Applied On",
                    selector: (r) => r.applied_date,
                    cell: (r) => r.applied_date ? new Date(r.applied_date).toLocaleDateString() : "—",
                    sortable: true,
                    grow: 1.5,
                  },
                  {
                    name: "Reviewed By",
                    selector: (r) => (r.reviewed_by || "").toLowerCase(),
                    cell: (r) => r.reviewed_by || "Pending",
                    sortable: true,
                    grow: 1.5,
                  },
                ]}
                data={filteredWfh}
                pagination
                paginationRowsPerPageOptions={[5, 10, 25]}
                customStyles={{
                  headRow: { style: { backgroundColor: "#eff6ff", borderBottom: "2px solid #bfdbfe" } },
                  headCells: { style: { color: "#374151", fontWeight: "600", fontSize: "13px" } },
                  rows: { style: { "&:hover": { backgroundColor: "#f0f9ff" }, alignItems: "flex-start" } },
                  cells: { style: { whiteSpace: "normal", wordBreak: "break-word", paddingTop: "10px", paddingBottom: "10px" } },
                  pagination: { style: { borderTop: "1px solid #e2e8f0", backgroundColor: "#f8fafc" } },
                }}
                noDataComponent={
                  <div className="text-center py-10 text-gray-500">
                    No {wfhFilter === "all" ? "" : wfhFilter} WFH requests found.
                  </div>
                }
              />
            </div>
          </div>
        );
      }

      default:
        return (
          <div className="p-8">
            <h1 className="text-4xl font-bold text-gray-900">Dashboard</h1>
          </div>
        );
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Mobile Sidebar Drawer */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-80 bg-white shadow-2xl flex flex-col">
            {/* Mobile drawer header: close */}
            <div className="px-4 pt-4 pb-3 border-b border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsSidebarOpen(false)}
                className="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-lg"
                aria-label="Close menu"
              >
                ×
              </button>
            </div>

            {/* Nav items */}
            <nav className="flex-1 px-2 py-4 overflow-y-auto">
              <ul className="space-y-3">
                {navItems.map((item) => {
                  const hasUnseen = item.showUpdateBadge && (reviewedUpdatesCount > lastSeenReviewedCount || unreadAppNotificationsCount > 0);
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => {
                          setActiveSection(item.id);
                          setIsSidebarOpen(false);
                        }}
                        className={`relative w-full text-left px-4 py-3.5 rounded-md transition-all duration-150 flex items-center gap-3 text-base font-medium ${
                          activeSection === item.id
                            ? "bg-primary-600 text-white shadow"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <span className="shrink-0">{item.icon}</span>
                        <span>{item.label}</span>
                        {hasUnseen && (
                          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-orange-500 rounded-full animate-ping opacity-75" aria-hidden />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>

          </div>
        </div>
      )}

      {isTimeTrackerOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setIsTimeTrackerOpen(false)}
        >
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <EmployeeTimeTracker
              onClose={() => setIsTimeTrackerOpen(false)}
              initialTimerState={timerState}
              onTimerUpdate={handleTimerUpdate}
            />
          </div>
        </div>
      )}

      {timerState.isTracking && !isTimeTrackerOpen && (
        <button
          onClick={() => setIsTimeTrackerOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-full shadow-2xl transition-all"
        >
          <span className="w-2 h-2 bg-white rounded-full animate-ping" />
          <span className="font-mono font-bold text-sm">{formatTimerDisplay(timerState.elapsedTime)}</span>
          <span className="text-sm font-medium">Tracking</span>
        </button>
      )}

      {isLeaveModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative">
            <LeaveRequest
              onClose={() => setIsLeaveModalOpen(false)}
              remainingLeaves={remainingLeaves}
              onSuccess={() => fetchEmployeeData({ showLoader: false })}
            />
          </div>
        </div>
      )}

      {isWFHModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative">
            <WorkFromHomeRequest
              onClose={() => setIsWFHModalOpen(false)}
              onSuccess={() => fetchEmployeeData({ showLoader: false })}
            />
          </div>
        </div>
      )}

      <div className="hidden lg:flex flex-col w-72 bg-white shadow-xl border-r border-slate-200 h-full overflow-y-auto overflow-x-hidden shrink-0">
          {/* Nav items */}
          <nav className="flex-1 px-2 py-4 overflow-y-auto overflow-x-hidden">
            <ul className="space-y-3">
              {navItems.map((item) => {
                const hasUnseen = item.showUpdateBadge && (reviewedUpdatesCount > lastSeenReviewedCount || unreadAppNotificationsCount > 0);
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => setActiveSection(item.id)}
                      className={`relative w-full text-left px-4 py-3.5 rounded-md transition-all duration-150 flex items-center gap-3 text-base font-medium ${
                        activeSection === item.id
                          ? "bg-primary-600 text-white shadow"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <span className="shrink-0">{item.icon}</span>
                      <span>{item.label}</span>
                      {hasUnseen && (
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-orange-500 rounded-full animate-ping opacity-75" aria-hidden />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0 h-full overflow-y-auto overflow-x-hidden">
          <div className="p-4 sm:p-6 lg:p-0">{renderContent()}</div>
        </div>

    </div>
  );
}

export default WelcomeEmployee;
