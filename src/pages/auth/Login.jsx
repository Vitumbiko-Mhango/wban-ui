import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import React, { useState } from "react";
import { useNavigate } from "react-router";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const validate = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (formData.username.trim().length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    return newErrors;
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));

    // Clear error on change
    if (errors[id]) {
      setErrors((prev) => ({ ...prev, [id]: "" }));
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    try {
      await new Promise((res) => setTimeout(res, 1000));
      navigate("/staff/dashboard");
      // alert("Login successful! (navigation disabled in preview)");
    } catch (err) {
      setErrors({ general: "Invalid username or password. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <div className="mb-6 text-center">
          <h1 className="text-3xl text-primary-a20 font-bold">WBAN</h1>
          <p className="text-dark-a0/60">Patient Monitoring System</p>
        </div>

        <form className="space-y-4" onSubmit={handleLogin} noValidate>
          {/* General error */}
          {errors.general && (
            <div className="px-3 py-2 rounded-md bg-red-50 border border-red-200 text-sm text-danger-a0">
              {errors.general}
            </div>
          )}

          {/* Username */}
          <div>
            <label
              htmlFor="username"
              className="block font-medium text-dark-a0/80"
            >
              Username
            </label>
            <input
              type="text"
              id="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter your username"
              autoComplete="username"
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm placeholder:text-sm focus:outline-none focus:ring-2 focus:ring-primary-a20 focus:border-primary-a20 transition-colors ${
                errors.username
                  ? "border-danger-a0 bg-danger-a0/10"
                  : "border-surface-a30"
              }`}
            />
            {errors.username && (
              <p className="mt-1 text-xs text-danger-a0">{errors.username}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block font-medium text-dark-a0/80"
            >
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                autoComplete="current-password"
                className={`mt-1 block w-full pl-3 pr-10 py-2 border rounded-md shadow-sm placeholder:text-sm focus:outline-none focus:ring-2 focus:ring-primary-a20 focus:border-primary-a20 transition-colors ${
                  errors.password
                    ? "border-danger-a0 bg-danger-a0/10"
                    : "border-surface-a30"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-dark-a0/60 hover:text-primary-a20 focus:outline-none cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-danger-a0">{errors.password}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-2 px-4 bg-primary-a20 text-light-a0 font-semibold rounded-md hover:bg-primary-a30 focus:outline-none focus:ring-2 focus:ring-primary-a20 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer transition-all duration-300"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <LoaderCircle className="animate-spin size-4 text-light-a0" />
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
