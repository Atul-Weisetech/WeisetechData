import React from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/weisetechLogo.png";

export default function Navbar({
  onShowLeaveRequest,
  onShowTimeTracker,
  timerState,
  onMenuClick,
}) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("id");
    localStorage.removeItem("name");
    localStorage.removeItem("designation");
    navigate("/");
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
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
            {/* <span>⏱️</span> */}
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

        {/* Apply for Leave Button */}
        {/* <button
          onClick={onShowLeaveRequest}
          className="flex items-center gap-3 py-2 px-4 rounded-xl font-semibold bg-purple-600 hover:bg-purple-700 text-white transition-all duration-300 shadow-md hover:shadow-lg"
        >
          <span>🏖️</span>
          <span className="text-sm">Apply for Leave</span>
        </button> */}

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="bg-gradient-to-r from-red-500 to-red-700 text-white px-4 sm:px-5 py-2 rounded-xl font-semibold hover:from-red-600 hover:to-red-800 transition-all duration-300 shadow-md hover:shadow-lg"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}