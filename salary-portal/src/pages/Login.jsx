import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import logo from "../assets/weisetechLogo.png";
import { ClimbingBoxLoader } from "react-spinners";
import { toast } from "react-toastify";
import API_BASE from "../config";

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const validateEmail = (val) => {
    if (!val.trim()) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return "Invalid email address";
    return "";
  };

  const validatePassword = (val) => {
    if (!val) return "Password is required";
    if (val.length < 8) return "Password must be at least 8 characters";
    if (val.length > 20) return "Password must be at most 20 characters";
    if (!/[A-Z]/.test(val)) return "Password must contain at least one uppercase letter";
    if (!/[a-z]/.test(val)) return "Password must contain at least one lowercase letter";
    if (!/[0-9]/.test(val)) return "Password must contain at least one number";
    if (!/[!@#$%^&*()\-_=+\[\]{};':"\\|,.<>/?`~]/.test(val))
      return "Password must contain at least one special character";
    return "";
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setEmailError("");
    setPasswordError("");

    // Sequential: validate email first
    const eErr = validateEmail(email);
    if (eErr) {
      setEmailError(eErr);
      return;
    }

    // Then validate password
    const pErr = validatePassword(password);
    if (pErr) {
      setPasswordError(pErr);
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/api/login`, { email, password });
      localStorage.setItem("email", res.data.user.email_address);
      localStorage.setItem("role", res.data.role);
      const employeeId = res.data?.employee?.id ?? res.data?.user?.fk_employee_id;
      const employeeName = res.data?.employee
        ? `${res.data.employee.first_name || ""} ${res.data.employee.last_name || ""}`.trim()
        : "";
      const userName = (res.data?.user?.first_name || res.data?.user?.last_name)
        ? `${res.data.user.first_name || ""} ${res.data.user.last_name || ""}`.trim()
        : "";
      const fallbackName =
        employeeName || userName || res.data?.user?.username || res.data?.user?.email_address || "";
      if (employeeId) localStorage.setItem("id", String(employeeId));
      if (fallbackName) localStorage.setItem("name", fallbackName);
      const designation = res.data?.employee?.designation || res.data?.user?.designation || "";
      if (designation) localStorage.setItem("designation", designation);
      toast.success("Login successful! Welcome back.");
      setTimeout(() => {
        if (res.data.role === "admin" || res.data.role === "hr") navigate("/welcome");
        else navigate("/home");
      }, 300);
    } catch (err) {
      toast.error("Invalid email or password");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br px-4">
      <img
        src={logo}
        alt="Weisetech Logo"
        className="w-64 sm:w-80 h-auto object-contain mb-6 drop-shadow-md"
      />
      {loading ? (
        <div className="flex justify-center items-center h-80">
          <ClimbingBoxLoader color="#2563eb" size={18} />
        </div>
      ) : (
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-gray-200 relative flex flex-col items-center">
          <h2 className="text-3xl font-bold text-blue-600 mb-6 text-center">Sign In</h2>

          <form onSubmit={handleSignIn} className="w-full">
            {/* Email */}
            <div className="mb-4">
              <label className="block mb-1 text-gray-700 font-medium">Email</label>
              <input
                type="email"
                name="email"
                autoComplete="email"
                placeholder="Enter your email address"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {emailError && (
                <p className="text-red-500 text-sm mt-1">{emailError}</p>
              )}
            </div>

            {/* Password */}
            <div className="mb-6 relative">
              <label className="block mb-1 text-gray-700 font-medium">Password</label>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-10 text-gray-500 cursor-pointer"
              >
                {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
              </span>
              {passwordError && (
                <p className="text-red-500 text-sm mt-1">{passwordError}</p>
              )}
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full text-white font-semibold py-2 rounded-lg shadow-md transition-all duration-300 ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700"
              }`}
            >
              Sign In
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
