import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { FaArrowLeft } from "react-icons/fa";
import API_BASE from "../config";

const fullWidthFields = new Set(["first_name", "last_name", "email_address"]);

const labelMap = {
  first_name: "First Name",
  last_name: "Last Name",
  email_address: "Email Address",
  city: "City",
  state: "State",
  postal_code: "Postal Code",
  salary: "Salary",
  deduction: "Deduction",
  joining_date: "Joining Date",
};

const placeholderMap = {
  first_name: "Enter first name",
  last_name: "Enter last name",
  email_address: "Enter email address",
  city: "Enter city",
  state: "Enter state",
  postal_code: "Enter postal code",
  salary: "Enter monthly salary (e.g. 50000)",
  deduction: "Enter deduction amount (e.g. 2000)",
  joining_date: "",
};

export default function EditEmployee() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const formik = useFormik({
    initialValues: {
      first_name: "",
      last_name: "",
      email_address: "",
      city: "",
      state: "",
      postal_code: "",
      salary: "",
      deduction: "",
      joining_date: "",
    },
    validationSchema: Yup.object({
      first_name: Yup.string().required("First name is required"),
      last_name: Yup.string().required("Last name is required"),
      email_address: Yup.string()
        .email("Invalid email")
        .required("Email is required"),
      city: Yup.string().required("City is required"),
      state: Yup.string().required("State is required"),
      postal_code: Yup.string().required("Postal code is required"),
      salary: Yup.number().required("Salary is required"),
      deduction: Yup.number().required("Deduction is required"),
      joining_date: Yup.string().required("Joining date is required"),
    }),
    onSubmit: async (values) => {
      try {
        const updatedData = {
          ...values,
          joining_date: parseInt(new Date(values.joining_date).getTime() / 1000),
          last_update_date: new Date().toISOString().slice(0, 19).replace("T", " "),
        };
        await axios.put(`${API_BASE}/api/employees/${id}`, updatedData);
        toast.success("Employee updated successfully");
        setTimeout(() => navigate(`/employee/${id}`), 2000);
      } catch (err) {
        if (err.response?.data?.error === "Email already in use by another employee") {
          toast.error("This email is already assigned to another employee.");
        } else {
          toast.error("Failed to update employee");
        }
      }
    },
  });

  useEffect(() => {
    axios
      .get(`${API_BASE}/api/employees`)
      .then((res) => {
        const emp = res.data.find((e) => e.employee_id === parseInt(id));
        if (emp) {
          let formattedDate = "";
          if (typeof emp.joining_date === "number") {
            const dateObj = new Date(emp.joining_date * 1000);
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, "0");
            const day = String(dateObj.getDate()).padStart(2, "0");
            formattedDate = `${year}-${month}-${day}`;
          }
          formik.setValues({
            first_name: emp.first_name || "",
            last_name: emp.last_name || "",
            email_address: emp.email_address || "",
            city: emp.city || "",
            state: emp.state || "",
            postal_code: emp.postal_code || "",
            salary: emp.salary || "",
            deduction: emp.deduction || "",
            joining_date: formattedDate || "",
          });
        } else {
          toast.error("Employee not found");
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400 text-lg">
        Loading employee...
      </div>
    );
  }

  return (
    <div className="w-full bg-white p-4 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={() => navigate(`/employee/${id}`)}
          className="flex items-center gap-2 text-gray-600 hover:text-blue-700 transition text-sm font-medium"
        >
          <FaArrowLeft size={13} /> Back
        </button>
        <h2 className="text-xl font-semibold text-blue-700">Edit Employee</h2>
        <div className="w-16" />
      </div>

      <form onSubmit={formik.handleSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.keys(formik.initialValues).map((field) => (
            <div
              key={field}
              className={fullWidthFields.has(field) ? "sm:col-span-2 lg:col-span-3" : ""}
            >
              <label className="block mb-1 font-medium text-gray-700">
                {labelMap[field] || field.replace(/_/g, " ")}
              </label>
              <input
                type={
                  field.includes("date")
                    ? "date"
                    : field === "salary" || field === "deduction"
                    ? "number"
                    : "text"
                }
                name={field}
                placeholder={placeholderMap[field] || ""}
                value={formik.values[field]}
                onChange={formik.handleChange}
                className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-400 focus:outline-none"
              />
              {formik.touched[field] && formik.errors[field] && (
                <p className="text-red-500 text-sm mt-1">{formik.errors[field]}</p>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 mt-6">
          <button
            type="submit"
            className="bg-primary-600 text-white px-6 py-2 rounded hover:bg-primary-700 font-medium"
          >
            Save Changes
          </button>
          <button
            type="button"
            onClick={() => navigate(`/employee/${id}`)}
            className="w-40 border border-gray-300 text-gray-600 bg-gray-200 px-6 py-2 rounded hover:bg-gray-300 font-medium"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
