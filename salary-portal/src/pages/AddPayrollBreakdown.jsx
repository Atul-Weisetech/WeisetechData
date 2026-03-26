import React, { useEffect, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import API_BASE from "../config";

export default function AddPayrollBreakdown({ isOpen, onClose }) {
  if (!isOpen) return null;

  const [employees, setEmployees] = useState([]);
  const [payrolls, setPayrolls] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [metaTypes, setMetaTypes] = useState([]);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  useEffect(() => {
    if (!isOpen) return;
    axios.get(`${API_BASE}/api/employees`)
      .then((res) => setEmployees(res.data || []))
      .catch((err) => console.error(err));

    axios.get(`${API_BASE}/api/payrolls`)
      .then((res) => setPayrolls(res.data || []))
      .catch((err) => console.error(err));

    axios.get(`${API_BASE}/api/payroll-meta-types`)
      .then((res) => setMetaTypes(res.data || []))
      .catch((err) => console.error(err));
  }, [isOpen]);

  const employeesWithPayroll = employees.filter((emp) =>
    payrolls.some((pay) => pay.fk_employee_id === emp.employee_id)
  );

  const payrollMonths = payrolls.filter(
    (pay) => pay.fk_employee_id === parseInt(selectedEmployee)
  );

  const formik = useFormik({
    initialValues: {
      fk_employee_id: "",
      fk_payroll_id: "",
      amount: "",
      type: "",
      category: 1,
    },
    validationSchema: Yup.object({
      fk_employee_id: Yup.string().required("Employee is required"),
      fk_payroll_id: Yup.string().required("Payroll is required"),
      amount: Yup.number().required("Amount is required"),
      type: Yup.string().required("Type is required"),
      category: Yup.number().oneOf([1,2]).required("Category is required"),
    }),
    onSubmit: async (values) => {
      try {
        await axios.post(
          `${API_BASE}/api/payrolls/employeeBreakdown/breakdown`,
          values
        );
        setToast({ show: true, message: "Payroll breakdown added successfully", type: "success" });
        setTimeout(() => {
          onClose();
        }, 1000);
      } catch (err) {
        setToast({ show: true, message: err.response?.data?.error || "Failed to add payroll breakdown", type: "error" });
      }
    },
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md relative">
        {toast.show && (
          <div className="flex justify-center mb-4">
            <div
              className={`max-w-2xl w-full px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm font-medium ${
                toast.type === "success"
                  ? "bg-green-50 text-green-800 border border-green-300"
                  : "bg-red-50 text-red-800 border border-red-300"
              }`}
            >
              {toast.type === "success" ? (
                <span className="text-green-600 text-lg">✅</span>
              ) : (
                <span className="text-red-600 text-lg">❌</span>
              )}
              <span>{toast.message}</span>
            </div>
          </div>
        )}
        <h2 className="text-xl font-bold text-center text-blue-700 mb-4">
          Add Payroll Breakdown
        </h2>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-primary-600 hover:text-red-600"
        >
          ✕
        </button>

        <form onSubmit={formik.handleSubmit} className="space-y-4">
          {/* Employee */}
          <div>
            <label className="block mb-1 font-medium">Employee</label>
            <select
              name="fk_employee_id"
              value={formik.values.fk_employee_id}
              onChange={(e) => {
                formik.handleChange(e);
                setSelectedEmployee(e.target.value);
              }}
              className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-400"
            >
              <option value="">Select Employee</option>
              {employeesWithPayroll.map((emp) => {
                const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";
                return (
                  <option key={emp.employee_id} value={emp.employee_id}>
                    {cap(emp.first_name)} {cap(emp.last_name)}
                  </option>
                );
              })}
            </select>
            {formik.touched.fk_employee_id && formik.errors.fk_employee_id && (
              <p className="text-red-500 text-sm">{formik.errors.fk_employee_id}</p>
            )}
          </div>

          {/* Payroll Month */}
          <div>
            <label className="block mb-1 font-medium">Payroll Month</label>
            <select
              name="fk_payroll_id"
              value={formik.values.fk_payroll_id}
              onChange={formik.handleChange}
              className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-400"
              disabled={!selectedEmployee}
            >
              <option value="">Select Month</option>
              {payrollMonths.map((pay) => (
                <option key={pay.id} value={pay.id}>
                  {pay.pay_month}
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block mb-1 font-medium">Amount</label>
            <input
              type="number"
              name="amount"
              value={formik.values.amount}
              onChange={formik.handleChange}
              className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block mb-1 font-medium">Type</label>
            <select
              name="type"
              value={formik.values.type}
              onChange={formik.handleChange}
              className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-400 focus:outline-none"
            >
              <option value="">Select Type</option>
              {metaTypes.map((t) => (
                <option key={t.id} value={t.type_name}>
                  {t.type_name}
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block mb-1 font-medium">Category</label>
            <select
              name="category"
              value={formik.values.category}
              onChange={formik.handleChange}
              className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-400"
            >
              <option value={1}>Earning</option>
              <option value={2}>Deduction</option>
            </select>
          </div>

          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 w-full"
          >
            Save Breakdown
          </button>
        </form>
      </div>
    </div>
  );
}
