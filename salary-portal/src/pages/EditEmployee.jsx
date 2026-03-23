import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import API_BASE from "../config";

export default function EditEmployee() {
  const { id } = useParams();
  const navigate = useNavigate();

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
          joining_date: parseInt(
            new Date(values.joining_date).getTime() / 1000
          ),
          last_update_date: new Date().toISOString().slice(0, 19).replace("T", " "),
        };

        await axios.put(
          `${API_BASE}/api/employees/${id}`,
          updatedData
        );

        toast.success("Employee updated successfully");
        setTimeout(() => navigate("/welcome"), 2000);
      } catch (err) {
        console.error("Update error:", err);
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
      .catch((err) => console.error(err));
  }, [id]);

  return (
    <div className="max-w-xl mx-auto mt-6 sm:mt-10 bg-white p-4 sm:p-6 rounded shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-blue-700 text-center">Edit Employee</h2>

      <form onSubmit={formik.handleSubmit}>
        {Object.keys(formik.values).map((field) => (
          <div key={field} className="mb-4">
            <label className="block mb-1 font-medium text-gray-700">
              {field.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </label>
            <input
              type={field.includes("date") ? "date" : "text"}
              name={field}
              value={formik.values[field]}
              onChange={formik.handleChange}
              placeholder={field === "joining_date" ? "" : `Enter ${field.replace(/_/g, " ")}`}
              className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-400 focus:outline-none"
            />
            {formik.touched[field] && formik.errors[field] && (
              <p className="text-red-500 text-sm mt-1">{formik.errors[field]}</p>
            )}
          </div>
        ))}
        <div className="flex gap-3 mt-4">
          <button
            type="submit"
            className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 transition-colors"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => navigate("/welcome")}
            className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 transition-colors"
          >
            Back
          </button>
        </div>
      </form>
    </div>
  );
}
