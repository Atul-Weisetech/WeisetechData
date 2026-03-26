import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash, FaArrowLeft } from "react-icons/fa";
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

  const fullWidthFields = new Set(["first_name", "last_name", "email_address", "password", "designation", "address_line_1", "address_line_2"]);

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
          <h2 className="text-xl font-semibold text-blue-700">Add Employee</h2>
          <div className="w-16" />
        </div>

        <form onSubmit={formik.handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.keys(formik.initialValues).map((field) => {
          const placeholderMap = {
            first_name: "Enter first name",
            last_name: "Enter last name",
            email_address: "Enter email address",
            password: "Min 8 chars, upper, lower, number, special",
            designation: "Enter designation (e.g. Software Engineer)",
            city: "Enter city",
            state: "Enter state",
            postal_code: "Enter postal code",
            salary: "Enter monthly salary (e.g. 50000)",
            deduction: "Enter deduction amount (e.g. 2000)",
            joining_date: "",
            address_line_1: "Enter address line 1",
            address_line_2: "Enter address line 2 (optional)",
          };
          const labelMap = {
            first_name: "First Name",
            last_name: "Last Name",
            email_address: "Email Address",
            password: "Password",
            designation: "Designation",
            city: "City",
            state: "State",
            postal_code: "Postal Code",
            salary: "Salary",
            deduction: "Deduction",
            joining_date: "Joining Date",
            address_line_1: "Address Line 1",
            address_line_2: "Address Line 2",
          };
          return (
            <div key={field} className={fullWidthFields.has(field) ? "sm:col-span-2 lg:col-span-3" : ""}>
              <label className="block mb-1 font-medium text-gray-700">
                {labelMap[field] || field.replace(/_/g, " ")}
              </label>

              {field === "password" ? (
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder={placeholderMap.password}
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
                    <p className="text-green-600 text-xs mt-1">Strong password ✓</p>
                  )}
                </div>
              ) : (
                <>
                  <input
                    type={field.includes("date") ? "date" : field === "salary" || field === "deduction" ? "number" : "text"}
                    name={field}
                    placeholder={placeholderMap[field] || ""}
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
          );
          })}
          </div>

          <div className="flex items-center gap-3 mt-6">
            <button
              type="submit"
              className="bg-primary-600 text-white px-6 py-2 rounded hover:bg-primary-700 font-medium"
            >
              Add Employee
            </button>
            <button
              type="button"
              onClick={() => navigate("/welcome")}
              className="w-40 border border-gray-300 text-gray-600 bg-gray-200 px-6 py-2 rounded hover:bg-gray-300 font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
  );
}
