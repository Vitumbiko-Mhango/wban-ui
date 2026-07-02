/**
 * src/App.jsx  (REPLACE YOUR EXISTING FILE)
 *
 * Changes from original:
 *  - Wraps everything in <AuthProvider>
 *  - Adds <ProtectedRoute> guards so unauthenticated users can't access staff/admin pages
 *  - Role-based guard: /admin routes require role="admin"
 */

import React from "react";
import { BrowserRouter, Route, Routes } from "react-router";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AutoLock from "./components/AutoLock";

import Login from "./pages/auth/Login";
import StaffLayout from "./pages/staff/StaffLayout";
import StaffDashboard from "./pages/staff/StaffDashboard";
import Alerts from "./pages/staff/Alerts";
import Patients from "./pages/staff/Patients";
import LiveMonitoring from "./pages/staff/LiveMonitoring";
import Analytics from "./pages/staff/Analytics";
import Wards from "./components/Wards";
import ShiftHandover from "./pages/staff/ShiftHandover";
import WardTransfer from "./pages/staff/WardTransfer";

import AlertThresholds from "./pages/staff/AlertThresholds";

import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Users from "./pages/admin/Users";
import Devices from "./pages/admin/Devices";
import Thresholds from "./pages/admin/Thresholds";
import AuditLogs from "./pages/admin/AuditLogs";

import NotFound from "./components/NotFound";

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AutoLock />
          <Routes>
            {/* Public */}
            <Route path="/" element={<Login />} />

          {/* Staff routes — any authenticated user */}
          <Route element={<ProtectedRoute />}>
            <Route path="/staff" element={<StaffLayout />}>
              <Route path="dashboard" element={<StaffDashboard />} />
              <Route path="patients" element={<Patients />} />
              <Route path="live-monitoring" element={<LiveMonitoring />} />
              <Route path="alerts" element={<Alerts />} />
              <Route path="wards" element={<Wards />} />
              <Route path="handover" element={<ShiftHandover />} />
              <Route path="ward-transfer" element={<WardTransfer />} />
              <Route path="thresholds" element={<AlertThresholds />} />
              <Route path="analytics" element={<Analytics />} />
            </Route>
          </Route>

          {/* Admin routes — admin role only */}
          <Route element={<ProtectedRoute role="admin" />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="patients" element={<Patients />} />
              <Route path="devices" element={<Devices />} />
              <Route path="thresholds" element={<Thresholds />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="users" element={<Users />} />
              <Route path="audit-logs" element={<AuditLogs />} />
            </Route>
          </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
