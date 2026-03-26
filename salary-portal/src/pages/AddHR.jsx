import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash, FaArrowLeft } from "react-icons/fa";
import { toast } from "react-toastify";
import API_BASE from "../config";

export default function AddHR() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const formik = useFormik({
    initialValues: {
      firstname: "",
      lastname: "",
      email: "",
      password: "",
    },
    validationSchema: Yup.object({
      firstname: Yup.string().required("Firstname is required"),
      lastname: Yup.string().required("Lastname is required"),
      email: Yup.string().email("Invalid email").required("Email is required"),
      password: Yup.string()
        .min(4, "Password must be at least 4 characters")
        .required("Password is required"),
    }),
    onSubmit: async (values) => {
      try {
        await axios.post(`${API_BASE}/api/add-hr`, values);
        toast.success("HR added successfully");
        setTimeout(() => navigate("/welcome"), 2000);
      } catch (err) {
        toast.error(err.response?.data?.error || "Failed to add HR");
      }
    },
  });

  return (
    <div className="w-full bg-white p-4 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={() => navigate("/welcome")}
          className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition text-sm font-medium"
        >
          <FaArrowLeft size={13} /> Back
        </button>
        <h2 className="text-xl font-semibold text-blue-700">Add New HR</h2>
        <div className="w-16" />
      </div>
      <form onSubmit={formik.handleSubmit} className="space-y-4">
        {/* First Name */}
        <div>
          <input
            name="firstname"
            placeholder="First name"
            type="text"
            value={formik.values.firstname}
            onChange={formik.handleChange}
            className="w-full px-4 py-2 border rounded"
          />
          {formik.errors.firstname && formik.touched.firstname && (
            <p className="text-red-500 text-sm">{formik.errors.firstname}</p>
          )}
        </div>

        {/* Last Name */}
        <div>
          <input
            name="lastname"
            placeholder="Last name"
            type="text"
            value={formik.values.lastname}
            onChange={formik.handleChange}
            className="w-full px-4 py-2 border rounded"
          />
          {formik.errors.lastname && formik.touched.lastname && (
            <p className="text-red-500 text-sm">{formik.errors.lastname}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <input
            name="email"
            placeholder="HR Email"
            type="email"
            autoComplete="email"
            value={formik.values.email}
            onChange={formik.handleChange}
            className="w-full px-4 py-2 border rounded"
          />
          {formik.errors.email && formik.touched.email && (
            <p className="text-red-500 text-sm">{formik.errors.email}</p>
          )}
        </div>

        {/* Password */}
        <div className="relative">
          <input
            name="password"
            placeholder="Password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={formik.values.password}
            onChange={formik.handleChange}
            className="w-full px-4 py-2 border rounded pr-10"
          />
          <span
            onClick={() => setShowPassword(!showPassword)}
            className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-500 cursor-pointer"
          >
            {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
          </span>
          {formik.errors.password && formik.touched.password && (
            <p className="text-red-500 text-sm mt-1">
              {formik.errors.password}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 mt-2">
          <button
            type="submit"
            className="bg-primary-600 text-white px-6 py-2 rounded hover:bg-primary-700 font-medium"
          >
            Add HR
          </button>
          <button
            type="button"
            onClick={() => navigate("/welcome")}
            className="w-35 border border-gray-300 text-gray-600 bg-gray-200 px-6 py-2 rounded hover:bg-gray-300 font-medium"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
