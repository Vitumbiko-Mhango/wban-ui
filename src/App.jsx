import React from "react";
import { BrowserRouter, Route, Routes } from "react-router";
import StaffLayout from "./pages/staff/StaffLayout";
import Login from "./pages/auth/Login";
import StaffDashboard from "./pages/staff/StaffDashboard";
import Alerts from "./pages/staff/Alerts";
import Patients from "./pages/staff/Patients";
import NotFound from "./components/NotFound";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        {/* staff routes */}
        <Route path="/staff" element={<StaffLayout />}>
          <Route path="dashboard" element={<StaffDashboard />} />
          <Route path="patients" element={<Patients />} />
          <Route path="alerts" element={<Alerts />} />
        </Route>

        {/* not found route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
