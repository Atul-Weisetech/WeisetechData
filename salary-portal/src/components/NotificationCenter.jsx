import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import DataTable from "react-data-table-component";
import { AlertTriangle, DollarSign, RefreshCw, X, User, Clock, FileText } from "lucide-react";
import API_BASE from "../config";

const tableCustomStyles = {
  headRow: { style: { backgroundColor: "#eff6ff", borderBottom: "2px solid #bfdbfe" } },
  headCells: { style: { color: "#374151", fontWeight: "600", fontSize: "13px" } },
  rows: { style: { "&:hover": { backgroundColor: "#f0f9ff" } } },
  cells: { style: { paddingTop: "10px", paddingBottom: "10px", paddingLeft: "12px", paddingRight: "12px" } },
  pagination: { style: { borderTop: "1px solid #e2e8f0", backgroundColor: "#f8fafc" } },
};

const capName = (str) =>
  (str || "").split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");

export default function NotificationCenter({
  employeeId,
  onClose,
  embedded = false,
  onUnreadCountChange,
}) {
  const [items, setItems] = useState([]);
  const [appNotifications, setAppNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detailWarning, setDetailWarning] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchAppNotifications = useCallback(async () => {
    if (!employeeId) return [];
    try {
      const res = await axios.get(`${API_BASE}/api/notifications/employee/${employeeId}`);
      const data = res.data?.data ?? [];
      setAppNotifications(Array.isArray(data) ? data : []);
      const unread = (Array.isArray(data) ? data : []).filter((n) => !n.is_read).length;
      if (typeof onUnreadCountChange === "function") onUnreadCountChange(unread);
      return data;
    } catch (e) {
      return [];
    }
  }, [employeeId, onUnreadCountChange]);

  const fetchNotifications = useCallback(async () => {
    if (!employeeId) return;
    setError("");
    setLoading(true);
    try {
      const [leaveRes, wfhRes] = await Promise.all([
        axios.get(`${API_BASE}/api/leave-requests/employee/${employeeId}`),
        axios.get(`${API_BASE}/api/work-from-home/employee/${employeeId}`),
      ]);
      const leavePayload = Array.isArray(leaveRes.data) ? leaveRes.data : leaveRes.data?.data || [];
      const wfhPayload = Array.isArray(wfhRes.data) ? wfhRes.data : wfhRes.data?.data || [];
      const combined = [
        ...leavePayload.map((item) => ({ ...item, type: "leave" })),
        ...wfhPayload.map((item) => ({ ...item, type: "wfh" })),
      ].sort((a, b) => {
        const dA = new Date(a.reviewed_at || a.applied_date || a.created_date || 0).getTime();
        const dB = new Date(b.reviewed_at || b.applied_date || b.created_date || 0).getTime();
        return dB - dA;
      });
      setItems(combined);
      await fetchAppNotifications();
    } catch (e) {
      setError("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [employeeId, fetchAppNotifications]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const formatDate = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const getStatusInfo = (statusText) => {
    const s = (statusText || "").toLowerCase();
    if (s === "approved") return { label: "Approved", className: "text-green-700 bg-green-100 border-green-200" };
    if (s === "declined") return { label: "Declined", className: "text-red-700 bg-red-100 border-red-200" };
    return { label: "Pending", className: "text-amber-700 bg-amber-100 border-amber-200" };
  };

  const handleOpenAppNotification = useCallback(
    async (notification) => {
      if (!notification.is_read) {
        try {
          await axios.patch(`${API_BASE}/api/notifications/${notification.id}/read`);
          setAppNotifications((prev) =>
            prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
          );
          if (typeof onUnreadCountChange === "function") {
            onUnreadCountChange(appNotifications.filter((n) => !n.is_read && n.id !== notification.id).length);
          }
        } catch (e) {}
      }
      if (notification.type === "performance_warning" && notification.reference_id) {
        setLoadingDetail(true);
        setDetailWarning(null);
        try {
          const res = await axios.get(`${API_BASE}/api/performance-warnings/${notification.reference_id}`);
          setDetailWarning(res.data?.data || res.data);
        } catch (e) {
          setDetailWarning({ error: "Failed to load warning details." });
        } finally {
          setLoadingDetail(false);
        }
      }
    },
    [appNotifications, onUnreadCountChange]
  );

  const renderContent = () => {
    if (error) {
      return <div className="mb-4 text-red-700 bg-red-100 border border-red-200 rounded px-3 py-2">{error}</div>;
    }
    if (loading) {
      return (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
        </div>
      );
    }

    const hasLeaveWfh = items.length > 0;
    const hasAppNotifications = appNotifications.length > 0;

    if (!hasLeaveWfh && !hasAppNotifications) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <FileText size={36} className="mb-3 opacity-40" />
          <p className="text-sm">No notifications yet.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* App notifications */}
        {hasAppNotifications && (
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Alerts &amp; Notifications
            </h3>
            <ul className="space-y-2">
              {appNotifications.map((n) => {
                const isPayroll = n.type === "payroll";
                const isWarning = n.type === "performance_warning";
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => handleOpenAppNotification(n)}
                      className={`w-full text-left rounded-xl border transition-all ${
                        n.is_read
                          ? "bg-white border-gray-200 hover:bg-gray-50"
                          : isPayroll
                          ? "bg-green-50 border-green-200 hover:bg-green-100"
                          : "bg-amber-50 border-amber-200 hover:bg-amber-100"
                      }`}
                    >
                      <div className="flex items-start gap-3 px-4 py-3">
                        {/* Icon */}
                        <div className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center mt-0.5 ${
                          isPayroll ? "bg-green-100" : isWarning ? "bg-amber-100" : "bg-gray-100"
                        }`}>
                          {isPayroll
                            ? <DollarSign size={16} className="text-green-600" />
                            : <AlertTriangle size={16} className="text-amber-600" />
                          }
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                              isPayroll
                                ? "bg-green-100 text-green-700 border-green-200"
                                : "bg-amber-100 text-amber-700 border-amber-200"
                            }`}>
                              {isPayroll ? "Payroll" : "Warning"}
                            </span>
                            {!n.is_read && (
                              <span className={`w-2 h-2 rounded-full ${isPayroll ? "bg-green-500" : "bg-amber-500"}`} />
                            )}
                          </div>
                          <p className="text-sm font-semibold text-gray-900 mt-1">{n.title}</p>
                          <p className="text-xs text-gray-600 mt-0.5 whitespace-pre-wrap">{n.message}</p>
                          <p className="text-xs text-gray-400 mt-1">{formatDate(n.created_at)}</p>
                          {isWarning && n.reference_id && (
                            <span className="inline-block text-xs font-medium text-primary-600 mt-1.5">
                              Tap to view full details →
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Leave & WFH Table */}
        {hasLeaveWfh && (
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Leave &amp; Work From Home
            </h3>
            <div className="rounded-xl overflow-hidden border border-gray-200">
              <DataTable
                columns={[
                  {
                    name: "Type",
                    cell: (row) => (
                      <span className={`px-2 py-0.5 rounded border text-xs font-medium whitespace-nowrap ${
                        row.type === "wfh"
                          ? "bg-sky-100 text-sky-800 border-sky-200"
                          : "bg-slate-100 text-slate-800 border-slate-200"
                      }`}>
                        {row.type === "wfh" ? "WFH" : "Leave"}
                      </span>
                    ),
                    width: "75px",
                  },
                  {
                    name: "Status",
                    cell: (row) => {
                      const info = getStatusInfo(row.status_text || row.status);
                      return (
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${info.className}`}>
                          {info.label}
                        </span>
                      );
                    },
                    sortable: true,
                    width: "95px",
                  },
                  {
                    name: "Date Range",
                    cell: (row) => (
                      <span className="text-xs text-gray-700 whitespace-nowrap">
                        {row.from_date ? new Date(row.from_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                        {" – "}
                        {row.to_date ? new Date(row.to_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                      </span>
                    ),
                    grow: 2,
                    minWidth: "180px",
                  },
                  {
                    name: "Days",
                    selector: (row) => row.number_of_days,
                    cell: (row) => <span className="text-xs text-gray-700">{row.number_of_days || "—"}</span>,
                    sortable: true,
                    
                  },
                  {
                    name: "Description",
                    cell: (row) => (
                      <span title={row.description} className="text-xs text-gray-600 line-clamp-2">
                        {row.description || "—"}
                      </span>
                    ),
                    grow: 2,
                    minWidth: "120px",
                  },
                  {
                    name: "Reviewed By",
                    cell: (row) => <span className="text-xs text-gray-700">{row.reviewed_by ? capName(row.reviewed_by) : "—"}</span>,
                    grow: 1,
                    minWidth: "110px",
                  },
                  {
                    name: "Reviewed At",
                    cell: (row) => <span className="text-xs text-gray-500">{formatDate(row.reviewed_at)}</span>,
                    grow: 2,
                    minWidth: "140px",
                  },
                ]}
                data={items}
                keyField={(row) => `${row.type}-${row.id}`}
                customStyles={tableCustomStyles}
                pagination
                paginationRowsPerPageOptions={[5, 10, 25]}
                noDataComponent={<div className="text-center py-8 text-gray-400">No leave or WFH requests found.</div>}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderDetailModal = () => {
    if (!detailWarning) return null;
    const isError = detailWarning.error;
    const warning = isError ? null : detailWarning;
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Modal header */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <AlertTriangle size={18} className="text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Performance Warning</h3>
                <p className="text-xs text-gray-500">Full warning details</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDetailWarning(null)}
              className="text-gray-400 hover:text-red-600 transition-colors"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6 overflow-y-auto flex-1 space-y-4">
            {loadingDetail ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
              </div>
            ) : isError ? (
              <p className="text-red-600">{detailWarning.error}</p>
            ) : warning ? (
              <>
                {/* Employee section */}
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                    <User size={16} className="text-primary-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">Employee</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {capName(warning.employee?.name || warning.employee_name || "—")}
                    </p>
                    {warning.employee?.designation && (
                      <p className="text-xs text-gray-500">{warning.employee.designation}</p>
                    )}
                  </div>
                </div>

                {/* Warning types */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Warning Types</h4>
                  <ul className="space-y-2">
                    {(warning.warning_types || []).map((wt, idx) => (
                      <li key={idx} className="border border-gray-200 rounded-xl p-3 bg-white">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-semibold">
                          <AlertTriangle size={11} />
                          {typeof wt === "string" ? wt : wt.warning_type}
                        </span>
                        {typeof wt === "object" && wt.description && (
                          <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap break-all" style={{ overflowWrap: "anywhere" }}>
                            {wt.description}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Overall note */}
                {(warning.overall_note || warning.overall_notes) && (
                  <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Overall Note</h4>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">
                      {warning.overall_note || warning.overall_notes}
                    </p>
                  </div>
                )}

                {/* Meta */}
                <div className="flex items-center gap-4 text-xs text-gray-400 pt-1">
                  <span className="flex items-center gap-1"><User size={11} /> {warning.created_by || "—"}</span>
                  <span className="flex items-center gap-1"><Clock size={11} /> {formatDate(warning.created_at)}</span>
                </div>
              </>
            ) : null}
          </div>

          <div className="px-6 py-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setDetailWarning(null)}
              className="w-full py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg text-sm transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (embedded) {
    return (
      <>
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <div className="flex flex-wrap items-center justify-between mb-5 gap-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Notification Center</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Track approval status of your leave and work from home requests
              </p>
            </div>
            <button
              type="button"
              onClick={fetchNotifications}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
          {renderContent()}
        </div>
        {renderDetailModal()}
      </>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50 px-4">
        <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-red-600 transition-colors"
              aria-label="Close notifications"
            >
              <X size={18} />
            </button>
          )}
          <div className="mb-5">
            <h2 className="text-xl font-bold text-gray-900">Notification Center</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Track approval status of your leave and work from home requests
            </p>
          </div>
          {renderContent()}
        </div>
      </div>
      {renderDetailModal()}
    </>
  );
}
