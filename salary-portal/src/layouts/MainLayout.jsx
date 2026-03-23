import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import CustomConfirmDialog from "../components/CustomConfirmDialog";
import logo from "../assets/weisetechLogo.png";

export default function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const navigate = useNavigate();

  const rawName     = localStorage.getItem("name")        || "";
  const name        = rawName
    ? rawName.replace(/\b\w/g, (c) => c.toUpperCase())
    : "User";
  const role        = localStorage.getItem("role")        || "";
  const designation = localStorage.getItem("designation") || "";

  const isHR = ["admin", "hr"].includes(role);

  const roleLabel = role === "admin" ? "Admin" : role === "hr" ? "HR" : "Employee";
  const roleBadgeClass =
    role === "admin"
      ? "bg-red-100 text-red-700 border-red-200"
      : role === "hr"
      ? "bg-blue-100 text-blue-700 border-blue-200"
      : "bg-green-100 text-green-700 border-green-200";

  const handleLogout = () => {
    localStorage.clear();
    navigate("/", { replace: true });
  };

  return (
    <>
      <div className="h-screen bg-gray-100 flex flex-col overflow-hidden">

        {/* ── GLOBAL HEADER ── */}
        <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm h-20 flex items-center px-4">
          <div className="flex items-center justify-between w-full">

            {/* Left: hamburger (mobile) + title */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50"
                aria-label="Open menu"
              >
                ☰
              </button>
              <img
                src={logo}
                alt="Weisetech Logo"
                className="h-11 w-auto max-w-[300px] object-contain hidden sm:block"
              />
            </div>

            {/* Right: notification bell (employee only) + user info + badge + logout */}
            <div className="flex items-center gap-2 sm:gap-3">

              {/* Notification bell — shown for employee role */}
              {!isHR && (
                <button
                  type="button"
                  onClick={() => navigate("/home?section=notifications")}
                  className="relative w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
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

              {/* User name + designation */}
              <div className="text-right leading-tight">
                <div className="text-sm font-semibold text-gray-800">{name}</div>
                {designation && <div className="text-xs text-gray-500 hidden sm:block">{designation}</div>}
              </div>

              {/* Role badge */}
              <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${roleBadgeClass}`}>
                {roleLabel}
              </span>

              {/* Logout button */}
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(true)}
                className="text-sm px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <div className="flex flex-1 min-h-0">

          {/* ── HR MOBILE SIDEBAR DRAWER ── */}
          {isHR && isSidebarOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-black/40" onClick={() => setIsSidebarOpen(false)} />
              <div className="absolute left-0 top-0 h-full w-80 bg-white shadow-2xl flex flex-col">
                <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50">
                  <div>
                    <div className="font-semibold text-gray-800 text-sm">{name}</div>
                    {designation && <div className="text-xs text-gray-500">{designation}</div>}
                    <span className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${roleBadgeClass}`}>
                      {roleLabel}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSidebarOpen(false)}
                    className="w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-lg"
                    aria-label="Close menu"
                  >
                    ×
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <Sidebar onSelect={() => setIsSidebarOpen(false)} className="shadow-none" />
                </div>
                <div className="px-4 py-3 border-t">
                  <button
                    type="button"
                    onClick={() => { setIsSidebarOpen(false); setShowLogoutConfirm(true); }}
                    className="w-full text-sm py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 font-medium transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── HR DESKTOP SIDEBAR ── */}
          {isHR && (
            <aside className="hidden lg:block w-80 shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto overflow-x-hidden border-r border-slate-200">
              <Sidebar className="h-full" />
            </aside>
          )}

          {/* ── PAGE CONTENT ── */}
          <main className="flex-1 min-w-0 overflow-y-auto">
            <Outlet context={{ isSidebarOpen, setIsSidebarOpen, setNotificationCount }} />
          </main>

        </div>

        {/* ── FOOTER ── */}
        <footer className="bg-white border-t border-slate-200 text-center text-md text-gray-500 py-3 shrink-0 sticky bottom-0 z-40">
          © {new Date().getFullYear()} Weisetech Developers. All rights reserved.
        </footer>

      </div>

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
