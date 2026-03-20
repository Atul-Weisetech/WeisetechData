import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { toast } from "react-toastify";
import API_BASE from "../config";

export default function AddEmployee() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const formik = useFormik({
    initialValues: {
      first_name: "",
      last_name: "",
      email_address: "",
      password: "",
      designation: "",
      city: "",
      state: "",
      postal_code: "",
      salary: "",
      deduction: "",
      joining_date: "",
      address_line_1: "",
      address_line_2: "",
    },
    validationSchema: Yup.object({
      first_name: Yup.string().required("First name is required"),
      last_name: Yup.string().required("Last name is required"),
      email_address: Yup.string()
        .email("Invalid email")
        .required("Email is required"),
      password: Yup.string()
        .min(8, "Password must be at least 8 characters")
        .max(20, "Password must be at most 20 characters")
        .matches(/[A-Z]/, "Must contain at least one uppercase letter")
        .matches(/[a-z]/, "Must contain at least one lowercase letter")
        .matches(/[0-9]/, "Must contain at least one number")
        .matches(
          /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/,
          "Must contain at least one special character"
        )
        .required("Password is required"),
      designation: Yup.string().required("Designation is required"),
      city: Yup.string().required("City is required"),
      state: Yup.string().required("State is required"),
      postal_code: Yup.string().required("Postal code is required"),
      salary: Yup.number().required("Salary is required"),
      deduction: Yup.number().required("Deduction is required"),
      joining_date: Yup.date().required("Joining date is required"),
      address_line_1: Yup.string().required("Address Line 1 is required"),
      address_line_2: Yup.string(),
    }),
    onSubmit: async (values) => {
      try {
        const unixTimestamp = Math.floor(
          new Date(values.joining_date).getTime() / 1000
        );
        const payload = { ...values, joining_date: unixTimestamp };
        await axios.post(`${API_BASE}/api/employees`, payload);
        toast.success("Employee added successfully");
        setTimeout(() => navigate("/welcome"), 2000);
      } catch (err) {
        toast.error(err.response?.data?.error || "Failed to add employee");
      }
    },
  });

  return (
    <div className="max-w-xl mx-auto mt-6 sm:mt-10 bg-white p-4 sm:p-6 rounded shadow-md relative">
      <div className="flex justify-end mb-2">
        <button
          type="button"
          onClick={() => navigate("/welcome")}
          className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 transition text-sm"
        >
          Back
        </button>
      </div>

      <h2 className="text-xl font-semibold mb-4 text-blue-700 text-center">
        Add Employee
      </h2>

      <form onSubmit={formik.handleSubmit}>
        {Object.keys(formik.initialValues).map((field) => (
          <div key={field} className="mb-4">
            <label className="block mb-1 font-medium text-gray-700">
              {field.replace(/_/g, " ").toUpperCase()}
            </label>

            {field === "password" ? (
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  className="w-full border px-3 py-2 rounded pr-10 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                />
                <span
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 cursor-pointer"
                >
                  {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                </span>
                {formik.touched.password && formik.errors.password && (
                  <p className="text-red-500 text-sm mt-1">{formik.errors.password}</p>
                )}
                {formik.values.password && !formik.errors.password && (
                  <p className="text-green-600 text-xs mt-1">Strong password</p>
                )}
              </div>
            ) : (
              <>
                <input
                  type={field.includes("date") ? "date" : "text"}
                  name={field}
                  value={formik.values[field]}
                  onChange={formik.handleChange}
                  className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-400 focus:outline-none"
                />
                {formik.touched[field] && formik.errors[field] && (
                  <p className="text-red-500 text-sm mt-1">{formik.errors[field]}</p>
                )}
              </>
            )}
          </div>
        ))}

        <button
          type="submit"
          className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 w-full mt-4"
        >
          Add Employee
        </button>
      </form>
    </div>
  );
}
