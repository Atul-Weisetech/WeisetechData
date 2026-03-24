import { useState, useRef, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import CustomConfirmDialog from "../components/CustomConfirmDialog";
import logo from "../assets/weisetechLogo.png";

export default function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen]     = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [dropdownOpen, setDropdownOpen]           = useState(false);
  const dropdownRef                               = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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


              {/* User Avatar Dropdown */}
              <div
                className="relative"
                ref={dropdownRef}
                onMouseEnter={() => setDropdownOpen(true)}
                onMouseLeave={() => setDropdownOpen(false)}
              >
                <button
                  type="button"
                  className="flex items-center gap-2 px-1 py-1 rounded-xl bg-white hover:bg-slate-50 transition-all"
                >
                  {/* Avatar with user icon overlay */}
                  <div className="relative w-9 h-9 shrink-0">
                    <div className="w-9 h-9 rounded-full bg-primary-600 text-white flex items-center justify-center text-sm font-bold">
                      {name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
                    </div>
                    {/* small user icon badge */}
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5 text-primary-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                      </svg>
                    </div>
                  </div>
                  
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-0 w-56 bg-white rounded-xl shadow-lg border border-slate-100 z-50 overflow-hidden">
                    {/* User info */}
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
                      <div className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
                        {name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{name}</p>
                        {designation && <p className="text-xs text-gray-500 truncate">{designation}</p>}
                        <span className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${roleBadgeClass}`}>
                          {roleLabel}
                        </span>
                      </div>
                    </div>
                    {/* Notifications — employee only */}
                    {!isHR && (
                      <button
                        type="button"
                        onClick={() => { setDropdownOpen(false); navigate(`/home?section=notifications&_t=${Date.now()}`); }}
                        className="w-full flex items-center justify-between gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-slate-50 transition-colors font-medium border-b border-slate-100"
                      >
                        <div className="flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                          </svg>
                          Notifications
                        </div>
                        {notificationCount > 0 && (
                          <span className="min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                            {notificationCount > 99 ? "99+" : notificationCount}
                          </span>
                        )}
                      </button>
                    )}

                    {/* Logout */}
                    <button
                      type="button"
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
