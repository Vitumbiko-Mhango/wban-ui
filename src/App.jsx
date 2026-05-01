import React from "react";
import { BrowserRouter, Route, Routes } from "react-router";
import StaffLayout from "./pages/staff/StaffLayout";
import Login from "./pages/auth/Login";
import StaffDashboard from "./pages/staff/StaffDashboard";
import Alerts from "./pages/staff/Alerts";
import Patients from "./pages/staff/Patients";
import NotFound from "./components/NotFound";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Users from "./pages/admin/Users";
import Devices from "./pages/admin/Devices";
import Configurations from "./pages/admin/Configurations";
import Thresholds from "./pages/admin/Thresholds";
import LiveMonitoring from "./pages/staff/LiveMonitoring";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        {/* staff routes */}
        <Route path="/staff" element={<StaffLayout />}>
          <Route path="dashboard" element={<StaffDashboard />} />
          <Route path="patients" element={<Patients />} />
          <Route path="live-monitoring" element={<LiveMonitoring />} />
          <Route path="alerts" element={<Alerts />} />
        </Route>

        {/* admin routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="patients" element={<Patients />} />
          <Route path="devices" element={<Devices />} />
          <Route path="thresholds" element={<Thresholds />} />
          <Route path="users" element={<Users />} />
          <Route path="configurations" element={<Configurations />} />
        </Route>

        {/* not found route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
