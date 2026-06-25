/**
 * src/context/AuthContext.jsx
 *
 * Global auth state. Wrap your app in <AuthProvider> (already done in main.jsx below).
 * Any component can call useAuth() to get { user, login, logout, isAuthenticated }.
 */

import React, { createContext, useContext, useState, useCallback } from "react";
import client from "../api/client";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  });

  // POST /api/auth/login/  →  { access, refresh, user: { id, username, role, ward } }
  const login = useCallback(async (username, password) => {
    const { data } = await client.post("/auth/login/", { username, password });

    localStorage.setItem("access_token", data.access);
    localStorage.setItem("refresh_token", data.refresh);

    // The backend LoginView returns user details inside the response
    const userData = data.user ?? { username, role: data.role ?? "staff" };
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);

    return userData;
  }, []);

  // POST /api/auth/logout/  →  blacklists the refresh token
  const logout = useCallback(async () => {
    try {
      const refresh = localStorage.getItem("refresh_token");
      await client.post("/auth/logout/", { refresh });
    } finally {
      localStorage.clear();
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, login, logout, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
};
