import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
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
        alert("HR added successfully");
        navigate("/welcome");
      } catch (err) {
        alert(err.response?.data?.error || "Failed to add HR");
      }
    },
  });

  return (
    <div className="max-w-md mx-auto mt-6 sm:mt-16 bg-white p-4 sm:p-6 rounded shadow relative">
      <div className="flex justify-end mb-2">
        <button
          type="button"
          onClick={() => navigate("/welcome")}
          className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 transition text-sm"
        >
          Back
        </button>
      </div>
      <h2 className="text-xl font-semibold mb-4 text-center text-blue-700">
        Add New HR
      </h2>
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

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          Add HR
        </button>
      </form>
    </div>
  );
}
