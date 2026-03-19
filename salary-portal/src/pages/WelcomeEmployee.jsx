import React, { useState, useEffect, useMemo, useCallback } from "react";
import Navbar from "../components/Navbar";
import LeaveRequest from "../components/LeaveRequest";
import EmployeeTimeTracker from "../components/EmployeeTimeTracker";
import WorkFromHomeRequest from "../components/WorkFromHomeRequest";
import NotificationCenter from "../components/NotificationCenter";
import axios from "axios";
import { ClimbingBoxLoader } from "react-spinners";
import jsPDF from "jspdf";
import "jspdf-autotable";
import API_BASE from "../config";

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
  const [reviewedUpdatesCount, setReviewedUpdatesCount] = useState(0);
  const [lastSeenReviewedCount, setLastSeenReviewedCount] = useState(0);
  const [unreadAppNotificationsCount, setUnreadAppNotificationsCount] = useState(0);

  const employeeId = localStorage.getItem("id");

  const lastSeenStorageKey = useMemo(
    () => (employeeId ? `notifications_last_seen_${employeeId}` : null),
    [employeeId]
  );

  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isTimeTrackerOpen, setIsTimeTrackerOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
          const joinDate =
            normalizeDateValue(employeeData.joining_date) ||
            new Date().toISOString().split("T")[0];
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

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return (
          <div className="p-8 ">
            {/* Welcome Header */}
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-none">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                  Welcome back, {employeeName}!
                </h1>
                <p className="text-lg text-gray-600">
                  Here's your overview for today
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                {/* <button
                  onClick={() => setActiveSection("notifications")}
                  className="px-5 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
                >
                  View Notifications
                </button> */}
                {/* <button
                  onClick={() => setIsLeaveModalOpen(true)}
                  className="px-5 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold shadow-md transition-colors"
                >
                  Apply for Leave
                </button> */}
                <button
                  onClick={() => setIsTimeTrackerOpen(true)}
                  className="px-5 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold shadow-md transition-colors"
                >
                  Open Time Tracker
                </button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Leave Balance Card */}
              <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-700">
                    Leave Balance
                  </h3>
                  {/* <span className="text-2xl">🏖️</span> */}
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-3xl font-bold text-indigo-600">
                      {remainingLeaves}
                    </p>
                    <p className="text-sm text-gray-500">Remaining Leaves</p>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total: {totalLeaves}</span>
                    <span className="text-gray-600">Used: {leaveUsed}</span>
                    <span className="text-orange-600">
                      Pending: {pendingLeaves}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(0, (remainingLeaves / totalLeaves) * 100)
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Quick Stats Card 1 */}
              <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-700">
                    Payslips
                  </h3>
                  {/* <span className="text-2xl">💰</span> */}
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-purple-600">
                    {payrolls.length}
                  </p>
                  <p className="text-sm text-gray-500">Available Payslips</p>
                </div>
              </div>

              {/* Quick Stats Card 2 */}
              <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-700">
                    This Month
                  </h3>
                  {/* <span className="text-2xl">📅</span> */}
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-cyan-600">
                    {new Date().getDate()}
                  </p>
                  <p className="text-sm text-gray-500">Days Completed</p>
                </div>
              </div>
            </div>

            {/* Recent Payslips Section */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">
                  Recent Payslips
                </h3>
                <button
                  onClick={() => setActiveSection("payrolls")}
                  className="text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  View All →
                </button>
              </div>
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <ClimbingBoxLoader color="#6366F1" size={20} />
                </div>
              ) : payrolls.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <p className="text-lg">No payslips available yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {payrolls.slice(0, 4).map((payslipData) => {
                    const netPay =
                      (parseFloat(payslipData.payroll_amount) || 0) -
                      (parseFloat(payslipData.deduction) || 0);

                    return (
                      <div
                        key={payslipData.id}
                        className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition-all duration-300 hover:border-indigo-200"
                      >
                        <h4 className="font-semibold text-gray-800 mb-2">
                          {payslipData.pay_month}
                        </h4>
                        <p className="text-sm text-gray-600 mb-1">
                          Employee ID: {payslipData.fk_employee_id}
                        </p>
                        <p className="text-lg font-bold text-green-600 mb-3">
                          ₹{netPay.toLocaleString()}
                        </p>
                        <button
                          onClick={() => handleDownload(payslipData)}
                          className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 px-3 rounded-lg transition-colors text-sm font-medium"
                        >
                          Download Payslip
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );

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
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {payrolls.map((payslipData) => {
                  const netPay =
                    (parseFloat(payslipData.payroll_amount) || 0) -
                    (parseFloat(payslipData.deduction) || 0);

                  return (
                    <div
                      key={payslipData.id}
                      className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-indigo-100 p-6"
                    >
                      <div className="w-full h-2 rounded-t-xl bg-gradient-to-r from-indigo-400 to-purple-400 mb-4" />
                      <h3 className="text-lg font-bold text-slate-800 text-center mb-4">
                        {payslipData.pay_month}
                      </h3>
                      <div className="space-y-3 text-sm">
                        <p>
                          <span className="font-semibold">Employee ID:</span>{" "}
                          {payslipData.fk_employee_id}
                        </p>
                        <p>
                          <span className="font-semibold">Payment Mode:</span>{" "}
                          {payslipData.mode_of_payment}
                        </p>
                        <p>
                          <span className="font-semibold">Gross Salary:</span> ₹
                          {parseFloat(
                            payslipData.payroll_amount
                          ).toLocaleString()}
                        </p>
                        <p>
                          <span className="font-semibold">Deductions:</span> ₹
                          {(
                            parseFloat(payslipData.deduction) || 0
                          ).toLocaleString()}
                        </p>
                        <p className="font-bold text-slate-900 text-lg">
                          Net Pay: ₹{netPay.toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDownload(payslipData)}
                        className="w-full mt-4 bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg"
                      >
                        Download Payslip
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
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
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {myLeaves.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <p className="text-lg">No leave requests found.</p>
                </div>
              ) : filteredLeaves.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <p>No {leaveFilter} leave requests.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                      <tr>
                        <th className="px-4 py-3 text-left">#</th>
                        <th className="px-4 py-3 text-left">From</th>
                        <th className="px-4 py-3 text-left">To</th>
                        <th className="px-4 py-3 text-left">Days</th>
                        <th className="px-4 py-3 text-left">Reason</th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3 text-left">Applied On</th>
                        <th className="px-4 py-3 text-left">Reviewed By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredLeaves.map((req, idx) => (
                        <tr key={req.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{req.from_date ? new Date(req.from_date).toLocaleDateString() : "—"}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{req.to_date ? new Date(req.to_date).toLocaleDateString() : "—"}</td>
                          <td className="px-4 py-3">{req.number_of_days}</td>
                          <td className="px-4 py-3 max-w-[180px] truncate" title={req.description}>{req.description || "—"}</td>
                          <td className="px-4 py-3">{getStatusBadge(req.status_text || req.status)}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{req.applied_date ? new Date(req.applied_date).toLocaleDateString() : "—"}</td>
                          <td className="px-4 py-3">{req.reviewed_by || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );
      }

      case "work-from-home":
        return (
          <div className="p-4 sm:p-8">
            <div className="mb-6">
              <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-2">Work From Home</h1>
              <p className="text-base sm:text-lg text-gray-600">Request and view your work from home days</p>
            </div>
            <div className="mb-8">
              <WorkFromHomeRequest embedded={true} onSuccess={() => fetchEmployeeData({ showLoader: false })} />
            </div>
            
          </div>
        );

      default:
        return (
          <div className="p-8">
            <h1 className="text-4xl font-bold text-gray-900">Dashboard</h1>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Navbar
        onMenuClick={() => setIsSidebarOpen(true)}
        notificationCount={unreadAppNotificationsCount + Math.max(0, reviewedUpdatesCount - lastSeenReviewedCount)}
        onNotificationClick={() => setActiveSection("notifications")}
      />

      {/* Mobile Sidebar Drawer */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-80 bg-white shadow-2xl overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-gray-900 truncate">
                  {employeeName}
                </h1>
                <p className="text-sm text-gray-600 mt-1 truncate">
                  {designation}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Employee ID: {employeeId}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSidebarOpen(false)}
                className="w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
                aria-label="Close menu"
              >
                ×
              </button>
            </div>

            <nav className="p-6 border-none">
              <ul className="space-y-3 border-none">
                {[
                  { id: "dashboard", label: "Dashboard", icon: "" },
                  { id: "payrolls", label: "Payrolls", icon: "" },
                  { id: "notifications", label: "Notifications", icon: "", showUpdateBadge: true },
                  { id: "leave-requests", label: "Leave Requests", icon: "" },
                  { id: "work-from-home", label: "Work From Home Requests", icon: "" },
                ].map((item) => {
                  const hasUnseen = item.showUpdateBadge && (reviewedUpdatesCount > lastSeenReviewedCount || unreadAppNotificationsCount > 0);
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => {
                          setActiveSection(item.id);
                          setIsSidebarOpen(false);
                        }}
                        className={`relative w-full text-left px-6 py-4 rounded-2xl transition-all duration-300 flex items-center space-x-4 ${
                          activeSection === item.id
                            ? "bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg transform scale-[1.02]"
                            : "text-gray-700 hover:bg-white hover:shadow-md "
                        }`}
                      >
                        <span className="text-xl">{item.icon}</span>
                        <span className="font-semibold">{item.label}</span>
                        {hasUnseen && (
                          <>
                            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-orange-500 rounded-full animate-ping opacity-75" aria-hidden />
                          </>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Logout in mobile drawer */}
            <div className="px-6 pb-6">
              <button
                onClick={() => {
                  setIsSidebarOpen(false);
                  localStorage.removeItem("user");
                  localStorage.removeItem("id");
                  localStorage.removeItem("name");
                  localStorage.removeItem("designation");
                  window.location.href = "/";
                }}
                className="w-full px-6 py-4 rounded-2xl bg-gradient-to-r from-red-500 to-red-700 text-white font-semibold text-left flex items-center space-x-4 hover:from-red-600 hover:to-red-800 transition-all duration-300 shadow-md"
              >
                <span className="text-xl">🚪</span>
                <span>Logout</span>
              </button>
            </div>
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

      <div className="flex">
        {/* Sidebar */}
        <div className="hidden lg:block w-80 bg-white/80 backdrop-blur-lg shadow-xl border-r border-slate-200 min-h-screen">
          <div className="p-8 border-b border-slate-200">
            <h1 className="text-2xl font-bold text-gray-900">{employeeName}</h1>
            <p className="text-sm text-gray-600 mt-1">{designation}</p>
            <p className="text-xs text-gray-500 mt-2">
              Employee ID: {employeeId}
            </p>
          </div>

          <nav className="p-6 border-none">
            <ul className="space-y-3 border-none">
              {[
                { id: "dashboard", label: "Dashboard", icon: "" },
                { id: "payrolls", label: "Payrolls", icon: "" },
                { id: "notifications", label: "Notifications", icon: "", showUpdateBadge: true },
                { id: "leave-requests", label: "Leave Requests", icon: "" },
                { id: "work-from-home", label: "Work From Home Requests", icon: "" },
              ].map((item) => {
                const hasUnseen = item.showUpdateBadge && (reviewedUpdatesCount > lastSeenReviewedCount || unreadAppNotificationsCount > 0);
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => setActiveSection(item.id)}
                      className={`relative w-full text-left px-6 py-4 rounded-2xl transition-all duration-300 flex items-center space-x-4 ${
                        activeSection === item.id
                          ? "bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg transform scale-105"
                          : "text-gray-700 hover:bg-white hover:shadow-md "
                      }`}
                    >
                      <span className="text-xl">{item.icon}</span>
                      <span className="font-semibold">{item.label}</span>
                      {hasUnseen && (
                        <>
                          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-orange-500 rounded-full animate-ping opacity-75" aria-hidden />
                        </>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0 overflow-auto">
          {/* Reduce padding on small screens */}
          <div className="p-4 sm:p-6 lg:p-0">{renderContent()}</div>
        </div>
      </div>
    </div>
  );
}

export default WelcomeEmployee;
