/**
 * src/pages/auth/Login.jsx  (REPLACE YOUR EXISTING FILE)
 *
 * Changes from original:
 *  - Calls useAuth().login() instead of the fake setTimeout
 *  - Redirects to /staff/dashboard or /admin/dashboard based on role
 *  - Shows the real server error message (locked out, wrong password, etc.)
 */

import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import React, { useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../../context/AuthContext";

const schema = z.object({
  username: z
    .string()
    .min(1, "Username is required")
    .min(3, "Username must be at least 3 characters"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [generalError, setGeneralError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  const handleLogin = async (data) => {
    setGeneralError("");
    try {
      const user = await login(data.username, data.password);
      // Redirect based on role returned by the backend
      navigate(
        user.role === "admin" ? "/admin/dashboard" : "/staff/dashboard",
        {
          replace: true,
        },
      );
    } catch (err) {
      // err.response.data may contain { detail: "..." } or { non_field_errors: [...] }
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.non_field_errors?.[0] ||
        "Invalid username or password. Please try again.";
      setGeneralError(detail);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100 m-4">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl text-primary-a20 font-bold">WBAN</h1>
          <p className="text-dark-a0/60">Patient Monitoring System</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit(handleLogin)}>
          {/* General error */}
          {generalError && (
            <div className="px-3 py-2 rounded-md bg-red-50 border border-red-200 text-sm text-danger-a0">
              {generalError}
            </div>
          )}

          {/* Username */}
          <div>
            <label className="block font-medium text-dark-a0/80">
              Username
            </label>
            <input
              type="text"
              placeholder="Enter your username"
              autoComplete="username"
              {...register("username")}
              className={`input ${errors.username ? "input-error" : ""}`}
            />
            {errors.username && (
              <p className="mt-1 text-xs error-text">
                {errors.username.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block font-medium text-dark-a0/80">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="current-password"
                {...register("password")}
                className={`input ${errors.password ? "input-error" : ""}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-dark-a0/60 hover:text-primary-a20"
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs error-text">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-2 px-4 bg-primary-a20 text-light-a0 font-semibold rounded-md hover:bg-primary-a30 focus:outline-none focus:ring-1 focus:ring-primary-a20 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 cursor-pointer"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <LoaderCircle className="animate-spin size-4" />
                Logging in...
              </span>
            ) : (
              "Login"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
