import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";

export default function NotificationCenter({
  employeeId,
  onClose,
  embedded = false,
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchNotifications = useCallback(async () => {
    if (!employeeId) return;
    setError("");
    setLoading(true);
    try {
      const [leaveRes, wfhRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/leave-requests/employee/${employeeId}`),
        axios.get(`http://localhost:5000/api/work-from-home/employee/${employeeId}`),
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
    } catch (e) {
      setError("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

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

    if (items.length === 0) {
      return (
        <div className="text-gray-600 text-center py-8">
          No notifications yet.
        </div>
      );
    }

    return (
      <div className="max-h-[60vh] overflow-auto">
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
    );
  };

  if (embedded) {
    return (
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
    );
  }

  return (
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
  );
}

