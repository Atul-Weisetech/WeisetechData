import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import logo from "../assets/weisetechLogo.png";
import { ClimbingBoxLoader } from "react-spinners";
import AlertBox from "../components/AlertBox";

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [showAlert, setShowAlert] = useState(false);

  const formik = useFormik({
    initialValues: { email: "", password: "" },
    validationSchema: Yup.object({
      email: Yup.string().email(" Invalid email").required("Email is required"),
      password: Yup.string().required(" Password is required"),
    }),
    onSubmit: async (values, { setFieldError }) => {
      setLoading(true);
      try {
        const res = await axios.post("http://localhost:5000/api/login", values);
        console.log(res.data);
        localStorage.setItem("email", res.data.user.email_address);
        localStorage.setItem("role", res.data.role);
        // Prefer explicit employee data from backend join; fallback to previous field if present
        const employeeId = res.data?.employee?.id ?? res.data?.user?.fk_employee_id;
        const employeeName = res.data?.employee
          ? `${res.data.employee.first_name || ""} ${res.data.employee.last_name || ""}`.trim()
          : "";
        const fallbackName =
          employeeName ||
          res.data?.user?.username ||
          res.data?.user?.email_address ||
          "";
        if (employeeId) localStorage.setItem("id", String(employeeId));
        if (fallbackName) localStorage.setItem("name", fallbackName);
        const designation = res.data?.employee?.designation || res.data?.user?.designation || "";
        if (designation) localStorage.setItem("designation", designation);
        if (res.data.role === "admin" || res.data.role === "hr")
          navigate("/welcome");
        else navigate("/home");
      } catch (err) {
        setAlertMessage("Invalid email or password");
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 5000);
      }
      setLoading(false);
    },
  });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br px-4">
      <img
        src={logo}
        alt="Weisetech Logo"
        className="w-64 sm:w-80 h-auto object-contain mb-6 drop-shadow-md"
      />
      {showAlert && (
        <AlertBox message={alertMessage} onClose={() => setShowAlert(false)} />
      )}
      {/* Show loader when loading */}
      {loading ? (
        <div className="flex justify-center items-center h-80">
          <ClimbingBoxLoader color="#2563eb" size={18} />
        </div>
      ) : (
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-gray-200 relative flex flex-col items-center">
          <h2 className="text-3xl font-bold text-blue-600 mb-6 text-center">
            {" "}
            Sign In{" "}
          </h2>

          <form onSubmit={formik.handleSubmit} className="w-full">
            {/* Email */}
            <div className="mb-4">
              <label className="block mb-1 text-gray-700 font-medium">
                Email
              </label>
              <input
                type="email"
                name="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                value={formik.values.email}
                onChange={formik.handleChange}
              />
              {formik.touched.email && formik.errors.email && (
                <p className="text-red-500 text-sm mt-1">
                  {formik.errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="mb-6 relative">
              <label className="block mb-1 text-gray-700 font-medium">
                Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="email"
                placeholder="••••••••"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none pr-10"
                value={formik.values.password}
                onChange={formik.handleChange}
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-10 text-gray-500 cursor-pointer"
              >
                {showPassword ? (
                  <FaEyeSlash size={20} strokeWidth={3} />
                ) : (
                  <FaEye size={20} strokeWidth={3} />
                )}
              </span>
              {formik.touched.password && formik.errors.password && (
                <p className="text-red-500 text-sm mt-1">
                  {formik.errors.password}
                </p>
              )}
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full text-white font-semibold py-2 rounded-lg shadow-md transition-all duration-300 ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700"
              }`}
            >
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
