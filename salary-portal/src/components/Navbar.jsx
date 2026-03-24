import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/weisetechLogo.png";
import CustomConfirmDialog from "./CustomConfirmDialog";

export default function Navbar({
  onShowLeaveRequest,
  onShowTimeTracker,
  timerState,
  onMenuClick,
  notificationCount = 0,
  onNotificationClick,
}) {
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [dropdownOpen, setDropdownOpen]           = useState(false);
  const dropdownRef                               = useRef(null);

  const userName    = localStorage.getItem("name") || "User";
  const designation = localStorage.getItem("designation") || "";
  const role        = localStorage.getItem("role") || "";
  const initials    = userName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("id");
    localStorage.removeItem("name");
    localStorage.removeItem("designation");
    navigate("/");
  };

  const formatTime = (seconds) => {
    const hrs  = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <>
    <nav className="flex flex-wrap justify-between items-center gap-3 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 bg-white/90 backdrop-blur-lg shadow-lg rounded-b-2xl border-b border-slate-200">
      <div className="flex items-center gap-3 min-w-0">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 shadow-sm"
            aria-label="Open menu"
          >
            ☰
          </button>
        )}
        <img
          src={logo}
          alt="Weisetech Logo"
          className="h-8 w-auto max-w-[180px] object-contain"
        />
      </div>

      <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-end">
        {/* Time Tracker Button */}
        {timerState && (
          <button
            onClick={onShowTimeTracker}
            className={`flex items-center gap-3 py-2 px-3 sm:px-4 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg ${
              timerState.isTracking
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            <div className="flex flex-col items-start">
              <span className="text-sm">Time Tracker</span>
              {timerState.isTracking && (
                <span className="text-xs font-mono font-bold">
                  {formatTime(timerState.elapsedTime)}
                </span>
              )}
            </div>
            {timerState.isTracking && (
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            )}
          </button>
        )}

        {/* Notification Bell */}
        {onNotificationClick && (
          <button
            type="button"
            onClick={onNotificationClick}
            className="relative inline-flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 shadow-sm transition-all"
            aria-label="Notifications"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {notificationCount > 99 ? "99+" : notificationCount}
              </span>
            )}
          </button>
        )}

        {/* User Avatar Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 shadow-sm transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
              {initials}
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-100 z-50 overflow-hidden">
              {/* User info section */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{userName}</p>
                  {designation && <p className="text-xs text-gray-500 truncate">{designation}</p>}
                  {role && (
                    <span className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 capitalize">
                      {role}
                    </span>
                  )}
                </div>
              </div>

              {/* Logout */}
              <button
                onClick={() => { setDropdownOpen(false); setShowLogoutConfirm(true); }}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
                </svg>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>

    <CustomConfirmDialog
      show={showLogoutConfirm}
      message="Are you sure you want to logout?"
      confirmText="Logout"
      cancelText="Cancel"
      onConfirm={handleLogout}
      onCancel={() => setShowLogoutConfirm(false)}
    />
    </>
  );
}
