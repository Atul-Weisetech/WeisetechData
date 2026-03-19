import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import API_BASE from "../config";

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
      const leavePayload = Array.isArray(leaveRes.data)
        ? leaveRes.data
        : leaveRes.data?.data || [];
      const wfhPayload = Array.isArray(wfhRes.data)
        ? wfhRes.data
        : wfhRes.data?.data || [];
      const leaveItems = leavePayload.map((item) => ({ ...item, type: "leave" }));
      const wfhItems = wfhPayload.map((item) => ({ ...item, type: "wfh" }));
      const combined = [...leaveItems, ...wfhItems].sort((a, b) => {
        const dateA = new Date(a.reviewed_at || a.applied_date || a.created_date || 0).getTime();
        const dateB = new Date(b.reviewed_at || b.applied_date || b.created_date || 0).getTime();
        return dateB - dateA;
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
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusInfo = (statusText) => {
    const status = (statusText || "").toLowerCase();
    if (status === "approved") {
      return {
        label: "Approved",
        className: "text-green-700 bg-green-100 border-green-200",
      };
    }
    if (status === "declined") {
      return {
        label: "Declined",
        className: "text-red-700 bg-red-100 border-red-200",
      };
    }
    return {
      label: "Pending",
      className: "text-amber-700 bg-amber-100 border-amber-200",
    };
  };

  const handleOpenAppNotification = useCallback(
    async (notification) => {
      // Mark as read if unread
      if (!notification.is_read) {
        try {
          await axios.patch(`${API_BASE}/api/notifications/${notification.id}/read`);
          setAppNotifications((prev) =>
            prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
          );
          if (typeof onUnreadCountChange === "function") {
            const unread = appNotifications.filter((n) => !n.is_read && n.id !== notification.id).length;
            onUnreadCountChange(unread);
          }
        } catch (e) {
          // ignore
        }
      }
      // Open full detail modal for performance warnings
      if (notification.type === "performance_warning" && notification.reference_id) {
        setLoadingDetail(true);
        setDetailWarning(null);
        try {
          const res = await axios.get(`${API_BASE}/api/performance-warnings/${notification.reference_id}`);
          const data = res.data?.data || res.data;
          setDetailWarning(data);
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
      return (
        <div className="mb-4 text-red-700 bg-red-100 border border-red-200 rounded px-3 py-2">
          {error}
        </div>
      );
    }

    if (loading) {
      return (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    const hasLeaveWfh = items.length > 0;
    const hasAppNotifications = appNotifications.length > 0;

    if (!hasLeaveWfh && !hasAppNotifications) {
      return (
        <div className="text-gray-600 text-center py-8">
          No notifications yet.
        </div>
      );
    }

    return (
      <div className="max-h-[60vh] overflow-auto space-y-6">
        {/* App notifications (payroll, performance warnings, etc.) */}
        {hasAppNotifications && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Alerts &amp; Notifications</h3>
            <ul className="space-y-2">
              {appNotifications.map((n) => {
                const isPayroll = n.type === "payroll";
                const unreadClass = isPayroll
                  ? "bg-green-50 border-green-200 text-gray-900 font-medium"
                  : "bg-amber-50 border-amber-200 text-gray-900 font-medium";
                const dotClass = isPayroll ? "bg-green-500" : "bg-amber-500";
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => handleOpenAppNotification(n)}
                      className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                        n.is_read ? "bg-gray-50 border-gray-200 text-gray-700" : unreadClass
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            {isPayroll && (
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">
                                💰 Payroll
                              </span>
                            )}
                            {n.type === "performance_warning" && (
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                                ⚠️ Warning
                              </span>
                            )}
                          </div>
                          <span className="block font-semibold text-gray-900">{n.title}</span>
                          <span className="block text-sm mt-1 text-gray-600 whitespace-pre-wrap">{n.message}</span>
                          <span className="block text-xs text-gray-500 mt-1">{formatDate(n.created_at)}</span>
                          {n.type === "performance_warning" && n.reference_id && (
                            <span className="inline-block text-xs font-medium text-primary-600 mt-2">
                              Tap to view full details →
                            </span>
                          )}
                        </div>
                        {!n.is_read && (
                          <span className={`flex-shrink-0 w-2 h-2 rounded-full ${dotClass}`} aria-label="Unread" />
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Leave & WFH */}
        {hasLeaveWfh && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Leave &amp; Work From Home</h3>
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-left">Date Range</th>
                  <th className="px-4 py-2 text-left">Days</th>
                  <th className="px-4 py-2 text-left">Description</th>
                  <th className="px-4 py-2 text-left">Reviewed By</th>
                  <th className="px-4 py-2 text-left">Reviewed At</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const statusInfo = getStatusInfo(item.status_text || item.status);
                  const typeLabel = item.type === "wfh" ? "WFH" : "Leave";
                  const typeClass = item.type === "wfh"
                    ? "bg-sky-100 text-sky-800 border-sky-200"
                    : "bg-slate-100 text-slate-800 border-slate-200";
                  return (
                    <tr key={`${item.type}-${item.id}`} className="border-t">
                      <td className="px-4 py-2">
                        <span
                          className={`px-3 py-1 rounded-full border ${statusInfo.className}`}
                        >
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded border text-xs font-medium ${typeClass}`}>
                          {typeLabel}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        {item.from_date} → {item.to_date}
                      </td>
                      <td className="px-4 py-2">{item.number_of_days}</td>
                      <td className="px-4 py-2">{item.description}</td>
                      <td className="px-4 py-2">{item.reviewed_by || "—"}</td>
                      <td className="px-4 py-2">{formatDate(item.reviewed_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">Performance Warning – Full Details</h3>
            <button
              type="button"
              onClick={() => setDetailWarning(null)}
              className="text-gray-500 hover:text-gray-800 text-2xl leading-none"
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <div className="p-4 overflow-y-auto flex-1">
            {loadingDetail ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
              </div>
            ) : isError ? (
              <p className="text-red-600">{detailWarning.error}</p>
            ) : warning ? (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Employee</h4>
                  <p className="text-gray-900">{warning.employee?.name || warning.employee_name || "—"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Warning types</h4>
                  <ul className="space-y-2">
                    {(warning.warning_types || []).map((wt, idx) => (
                      <li key={idx} className="border border-gray-200 rounded-lg p-3">
                        <span className="font-medium text-gray-900">
                          {typeof wt === "string" ? wt : wt.warning_type}
                        </span>
                        {(typeof wt === "object" && wt.description) && (
                          <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{wt.description}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-amber-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Overall note</h4>
                  <p className="text-gray-900 whitespace-pre-wrap">
                    {warning.overall_note || warning.overall_notes || "—"}
                  </p>
                </div>
                <div className="flex gap-4 text-sm text-gray-500">
                  <span>Created by: {warning.created_by || "—"}</span>
                  <span>{formatDate(warning.created_at)}</span>
                </div>
              </div>
            ) : null}
          </div>
          <div className="p-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setDetailWarning(null)}
              className="w-full py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg"
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
          <div className="flex flex-wrap items-center justify-between mb-4 gap-3">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Notification Center
              </h2>
              <p className="text-sm text-gray-500">
                Track approval status of your leave and work from home requests
              </p>
            </div>
            <button
              type="button"
              onClick={fetchNotifications}
              className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Refresh
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
        <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl relative">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
              aria-label="Close notifications"
            >
              ✖
            </button>
          )}
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Notification Center
            </h2>
            <p className="text-sm text-gray-500">
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

