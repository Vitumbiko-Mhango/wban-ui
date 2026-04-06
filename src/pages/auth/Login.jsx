import { Eye, EyeOff } from "lucide-react";
import React, { useState } from "react";
import { useNavigate } from "react-router";

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();

    navigate("/staff/dashboard");
  };
  return (
    <div className="h-screen flex items-center justify-center bg-surface-a0">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <div className="mb-6 text-center">
          <h1 className="text-3xl text-primary-a0 font-bold">WBAN</h1>
          <p className="text-gray-600">Patient Monitoring System</p>
        </div>
        <div>
          <form className="space-y-4">
            <div>
              <label htmlFor="username" className="block font-medium">
                Username
              </label>
              <input
                type="text"
                id="username"
                placeholder="Enter your username"
                className="mt-1 block w-full px-2 py-2 border border-gray-300 rounded-md shadow-sm placeholder:text-sm focus:outline-none focus:ring-primary-a0 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="password" className="block font-medium">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder="••••••••"
                  className="mt-1 block w-full pl-3 pr-10 py-2  border border-gray-300 rounded-md shadow-sm placeholder:text-sm focus:outline-none focus:ring-primary-a0 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-600 hover:text-gray-800 focus:outline-none cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              onClick={handleLogin}
              type="submit"
              className="w-full mt-2 py-2 px-4 bg-primary-a0 text-white font-semibold rounded-md hover:bg-primary-a1 focus:outline-none focus:ring-2 focus:ring-primary-a0 cursor-pointer opacity-90 hover:opacity-100 transition-opacity duration-300"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
