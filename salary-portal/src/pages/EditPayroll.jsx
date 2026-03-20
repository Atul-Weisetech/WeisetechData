import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import API_BASE from "../config";

export default function EditPayroll() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [initialValues, setInitialValues] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear + i);

  const formatDateLocal = (dateStr) => {
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    axios
      .get(`${API_BASE}/api/employees`)
      .then((res) => setEmployees(res.data))
      .catch((err) => console.error("Failed to load employees", err));

    axios
      .get(`${API_BASE}/api/payrolls/${id}`)
      .then((res) => {
        const data = res.data;
        const formattedDate = formatDateLocal(data.payroll_date);

        let pay_month = "", pay_year = "";
        if (data.pay_month) {
          const parts = data.pay_month.split(" ");
          if (parts.length === 2) {
            pay_month = parts[0];
            pay_year = parts[1];
          }
        }

        setInitialValues({
          fk_employee_id: data.fk_employee_id || "",
          payroll_amount: data.payroll_amount || "",
          payroll_date: formattedDate || "",
          pay_month,
          pay_year,
          mode_of_payment: data.mode_of_payment || "",
          is_published: !!data.is_published,
        });
      })
      .catch((err) => {
        console.error("Failed to load payroll data", err);
        setToast({ show: true, message: "Payroll not found", type: "error" });
        setTimeout(() => navigate("/welcome?view=payroll"), 2000);
      });
  }, [id, navigate]);

  const validationSchema = Yup.object({
    fk_employee_id: Yup.string().required("Employee is required"),
    payroll_amount: Yup.number()
      .required("Amount is required")
      .max(9999999.999, "Max 3 decimal places allowed"),
    payroll_date: Yup.date().required("Payroll date is required"),
    pay_month: Yup.string().required("Month is required"),
    pay_year: Yup.string().required("Year is required"),
    mode_of_payment: Yup.string().required("Payment mode is required"),
  });

  const handleSubmit = async (values) => {
    const payload = {
      ...values,
      pay_month: `${values.pay_month} ${values.pay_year}`, // ✅ combine
    };
    try {
      await axios.put(`${API_BASE}/api/payrolls/${id}`, payload);
      setToast({
        show: true,
        message: "Payroll updated successfully!",
        type: "success",
      });
      setTimeout(() => navigate("/welcome?view=payroll"), 1500);
    } catch (error) {
      console.error("Error updating payroll", error);
      setToast({
        show: true,
        message: "Failed to update payroll",
        type: "error",
      });
    }
  };

  const LoadingState = () => (
    <div className="flex justify-center items-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <h1 className="text-xl font-bold text-blue-700">Edit Payroll</h1>
        <button
          onClick={() => navigate("/welcome?view=payroll")}
          className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
        >
          Back
        </button>
      </header>

        {toast.show && (
          <div className="flex justify-center mb-4">
            <div
              className={`max-w-2xl w-full px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm font-medium
              ${
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

          {!initialValues ? (
            <LoadingState />
          ) : (
            <div className="bg-white w-full max-w-2xl mx-auto p-4 sm:p-6 rounded-lg shadow">
              <Formik
                initialValues={initialValues}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
                enableReinitialize
              >
                <Form>
                  <label className="block mb-1 font-medium">Select Employee</label>
                  <Field
                    as="select"
                    name="fk_employee_id"
                    className="w-full mb-2 px-3 py-2 border rounded"
                  >
                    <option value="">Select</option>
                    {employees.map((emp) => (
                      <option key={emp.employee_id} value={emp.employee_id}>
                        {emp.first_name} {emp.last_name}
                      </option>
                    ))}
                  </Field>
                  <ErrorMessage
                    name="fk_employee_id"
                    component="div"
                    className="text-red-500 text-sm mb-2"
                  />

                  <Field
                    name="payroll_amount"
                    type="number"
                    step="0.001"
                    placeholder="Payroll Amount"
                    className="w-full mb-2 px-4 py-2 border rounded"
                  />
                  <ErrorMessage
                    name="payroll_amount"
                    component="div"
                    className="text-red-500 text-sm mb-2"
                  />

                  <div className="flex flex-col sm:flex-row gap-2 mb-2">
                    <Field
                      as="select"
                      name="pay_month"
                      className="w-full sm:w-1/2 px-3 py-2 border rounded"
                    >
                      <option value="">Select Month</option>
                      {months.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </Field>
                    <Field
                      as="select"
                      name="pay_year"
                      className="w-full sm:w-1/2 px-3 py-2 border rounded"
                    >
                      <option value="">Select Year</option>
                      {years.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </Field>
                  </div>
                  <ErrorMessage
                    name="pay_month"
                    component="div"
                    className="text-red-500 text-sm mb-2"
                  />
                  <ErrorMessage
                    name="pay_year"
                    component="div"
                    className="text-red-500 text-sm mb-2"
                  />

                  <Field
                    name="payroll_date"
                    type="date"
                    className="w-full mb-2 px-4 py-2 border rounded"
                  />
                  <ErrorMessage
                    name="payroll_date"
                    component="div"
                    className="text-red-500 text-sm mb-2"
                  />

                  <Field
                    name="mode_of_payment"
                    placeholder="Payment Mode (e.g. Bank Transfer)"
                    className="w-full mb-4 px-4 py-2 border rounded"
                  />
                  <ErrorMessage
                    name="mode_of_payment"
                    component="div"
                    className="text-red-500 text-sm mb-2"
                  />

                  <button
                    type="submit"
                    className="w-full bg-primary-600 text-white py-2 rounded hover:bg-primary-700"
                  >
                    Update Payroll
                  </button>
                </Form>
              </Formik>
            </div>
          )}
    </div>
  );
}
