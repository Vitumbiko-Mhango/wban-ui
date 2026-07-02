/**
 * src/components/common/Layout.jsx  (REPLACE YOUR EXISTING FILE)
 *
 * Fixes:
 *  1. Username and initials are read from AuthContext (useAuth) — no longer hardcoded
 *  2. Logout button calls useAuth().logout() and redirects to /
 */

import {
  ChevronDown,
  LogOut,
  Menu,
  Moon,
  Settings as SettingsIcon,
  Sun,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router";
import useClickOutside from "../../hooks/useClickOutside";
import Settings from "../../components/Settings";
import AlertAlarmMonitor from "../../components/AlertAlarmMonitor";
import useOnlineStatus from "../../hooks/useOnlineStatus";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

const Layout = ({ menuItems = [] }) => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const isOnline = useOnlineStatus();

  useClickOutside(dropdownRef, () => setIsDropdownOpen(false), isDropdownOpen);

  const [dateTime, setDateTime] = useState(
    new Date().toLocaleString("en-US", {
      dateStyle: "long",
      timeStyle: "short",
    }),
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(
        new Date().toLocaleString("en-US", {
          dateStyle: "long",
          timeStyle: "short",
        }),
      );
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // ── Derive display name and initials from the logged-in user ────────────────
  const firstName =
    user?.first_name || user?.firstname || user?.username || "User";
  const lastName = user?.last_name || user?.lastname || "";
  const fullName = lastName ? `${firstName} ${lastName}` : firstName;
  const initials = (firstName[0] + (lastName[0] || "")).toUpperCase();

  // ── Logout ───────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    setIsDropdownOpen(false);
    await logout();
    navigate("/", { replace: true });
  };

  const activeTab =
    menuItems.find((item) => item.link === location.pathname)?.name ||
    "Dashboard";

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside
        className={`absolute left-0 top-0 inset-y-0 z-50 lg:sticky h-screen bg-surface-a20 overflow-y-auto transition-all duration-300 ${
          isSidebarOpen
            ? "translate-x-0 w-64 fixed"
            : "-translate-x-full w-0 lg:translate-x-0 lg:w-64"
        }`}
      >
        <div className="border-b border-surface-a30 px-4 py-3">
          <h2 className="text-primary-a20 text-xl font-bold">WBAN</h2>
          <p className="text-sm text-dark-a0/50">Patient Monitoring System</p>
        </div>

        <nav className="p-4 mt-2 space-y-2">
          {menuItems.map((item, index) => (
            <div key={index}>
              <Link
                onClick={() => setIsSidebarOpen(false)}
                to={item.link}
                className={`flex items-center gap-2 p-2 rounded-lg transition-all duration-300 ${
                  activeTab === item.name
                    ? "text-primary-a20 font-medium bg-primary-a20/10"
                    : "hover:text-primary-a20 hover:bg-surface-a30"
                }`}
              >
                <item.icon className="size-5" /> {item.name}
              </Link>
            </div>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 w-full text-sm p-4 border-t border-surface-a30 flex items-center gap-2">
          <div
            className={`size-2 rounded-full ${isOnline ? "bg-success-a10 animate-pulse" : "bg-danger-a10"}`}
          />
          {isOnline ? "Online" : "Offline"}
        </div>
      </aside>

      {/* Main window */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-primary-a0/10 backdrop-blur-md flex items-center justify-between p-4.5">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              className="cursor-pointer"
            >
              <Menu className="size-6 lg:hidden" />
            </button>
            <h2 className="font-bold text-sm text-primary-a20 flex flex-col">
              Mzuzu Central Hospital
              <span className="text-xs font-normal">{dateTime}</span>
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              className="inline-flex size-9 items-center justify-center rounded-md border border-surface-a30 bg-surface-a0 text-dark-a0/70 transition-colors hover:bg-surface-a20 hover:text-primary-a20 focus:outline-none focus:ring-2 focus:ring-primary-a20/30 cursor-pointer"
            >
              {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>

          {/* Profile dropdown */}
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 cursor-pointer"
            >
              {/* Avatar circle with dynamic initials */}
              <span className="flex items-center justify-center text-sm text-white bg-primary-a20 p-2 rounded-full size-9 font-semibold">
                {initials}
              </span>
              <div className="text-left hidden sm:block">
                <span className="text-sm font-bold">{fullName}</span>
                {user?.role && (
                  <span className="block text-xs text-dark-a0/50 capitalize">
                    {user.role}
                  </span>
                )}
              </div>
              <ChevronDown className="size-4 text-dark-a0/50" />
            </button>

            {/* Dropdown menu */}
            <div
              className={`absolute right-0 mt-2 w-48 bg-surface-a0 rounded-md shadow-lg overflow-hidden transform transition-all duration-200 ${
                isDropdownOpen
                  ? "opacity-100 scale-100"
                  : "opacity-0 scale-95 pointer-events-none"
              }`}
            >
              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                  setIsSettingsOpen((prev) => !prev);
                }}
                className="flex items-center gap-2 px-4 py-2 w-full text-left hover:bg-dark-a0/10 transition-colors cursor-pointer"
              >
                <SettingsIcon className="size-4" />
                Settings
              </button>

              {/* ✅ Logout now actually logs out */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 w-full text-left hover:bg-dark-a0/10 transition-colors cursor-pointer text-danger-a0"
              >
                <LogOut className="size-4" />
                Logout
              </button>
            </div>
          </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 p-4 md:p-6">
          <AlertAlarmMonitor />
          <Outlet />
          {isSettingsOpen && (
            <Settings closeForm={() => setIsSettingsOpen(false)} />
          )}
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-dark-a0/50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;
