import {
  ChevronDown,
  LogOut,
  Menu,
  Settings as SettingsIcon,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { Outlet } from "react-router";
import { Link, useLocation } from "react-router";
import useClickOutside from "../../hooks/useClickOutside";
import Settings from "../../components/Settings";

const Layout = ({ menuItems = [] }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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

  const activeTab =
    menuItems.find((item) => item.link === location.pathname)?.name ||
    "Dashboard";

  return (
    <div className="min-h-screen flex">
      {/* sidebar */}
      <aside
        className={`absolute left-0 top-0 inset-y-0 z-50 lg:sticky h-screen bg-surface-a20 overflow-y-auto transition-all duration-300 ${
          isSidebarOpen
            ? "translate-x-0 w-64 fixed"
            : "-translate-x-full w-0 lg:translate-x-0 lg:w-64"
        }`}
      >
        <div className="border-b border-surface-a30 px-4 py-3">
          <div>
            <h2 className="text-primary-a20 text-xl font-bold">WBAN</h2>
            <p className="text-sm text-dark-a0/50">Patient Monitoring System</p>
          </div>
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
      </aside>

      {/* main window */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* header */}
        <header className="sticky top-0 z-30 bg-primary-a0/10 backdrop-blur-md flex items-center justify-between p-4.5">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              className="cursor-pointer"
            >
              {" "}
              <Menu className="size-6 lg:hidden" />
            </button>
            <h2 className="font-bold text-sm text-primary-a20 flex flex-col">
              Mzuzu Central Hospital
              <span className="text-xs font-normal">{dateTime}</span>
            </h2>
          </div>

          {/* dropdown profile */}
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <span className="flex items-center justify-center text-sm text-white bg-primary-a20 p-2 rounded-full">
                VM
              </span>
              <div className="text-left">
                <span className="text-sm font-bold">Vitumbiko Mhango</span>
              </div>
              <ChevronDown className="size-4 text-dark-a0/50" />
            </button>

            {/* logout and settings */}
            <div
              className={`absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg overflow-hidden transform transition-all duration-200 ${
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

              <button className="flex items-center gap-2 px-4 py-2 w-full text-left hover:bg-dark-a0/10 transition-colors cursor-pointer">
                <LogOut className="size-4" />
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* main content */}
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
          {isSettingsOpen && (
            <Settings closeForm={() => setIsSettingsOpen(false)} />
          )}
        </main>
      </div>

      {/* mobile sidebar overlay */}
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
