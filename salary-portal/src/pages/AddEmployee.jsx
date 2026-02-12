import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import AlertBox from "../components/AlertBox";

export default function AddEmployee() {
  const navigate = useNavigate();
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

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
      password: Yup.string().min(4).required("Password is required"),
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

        await axios.post("http://localhost:5000/api/employees", payload);
        setAlertMessage("Employee added successfully");
        setShowAlert(true);

        // Redirect after short delay
        setTimeout(() => {
          setShowAlert(false);
          navigate("/welcome");
        }, 5500);
      } catch (err) {
        setAlertMessage(err.response?.data?.error || "Failed to add employee");
        setShowAlert(true);
      }
    },
  });

  return (
    <div className="max-w-xl mx-auto mt-6 sm:mt-10 bg-white p-4 sm:p-6 rounded shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-blue-700 text-center">
        Add Employee
      </h2>

      {showAlert && (
        <AlertBox message={alertMessage} onClose={() => setShowAlert(false)} />
      )}

      <form onSubmit={formik.handleSubmit}>
        {Object.keys(formik.initialValues).map((field) => (
          <div key={field} className="mb-4">
            <label className="block mb-1 font-medium text-gray-700">
              {field.replace(/_/g, " ").toUpperCase()}
            </label>
            <input
              type={
                field.includes("date")
                  ? "date"
                  : field === "password"
                  ? "password"
                  : "text"
              }
              name={field}
              value={formik.values[field]}
              onChange={formik.handleChange}
              className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-400 focus:outline-none"
            />
            {formik.touched[field] && formik.errors[field] && (
              <p className="text-red-500 text-sm mt-1">
                {formik.errors[field]}
              </p>
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
