/**
 * src/components/ProtectedRoute.jsx
 *
 * Wrap any layout route to redirect unauthenticated users to /login.
 * Also enforces role: <ProtectedRoute role="admin"> redirects staff users.
 *
 * Usage in App.jsx:
 *   <Route element={<ProtectedRoute role="staff" />}>
 *     <Route path="/staff" element={<StaffLayout />}>
 *       ...
 *     </Route>
 *   </Route>
 */

import React from "react";
import { Navigate, Outlet } from "react-router";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ role }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) return <Navigate to="/" replace />;

  if (role && user?.role !== role) {
    // Staff trying to reach admin → send to staff dashboard
    // Admin trying to reach staff → send to admin dashboard
    return (
      <Navigate
        to={user.role === "admin" ? "/admin/dashboard" : "/staff/dashboard"}
        replace
      />
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
