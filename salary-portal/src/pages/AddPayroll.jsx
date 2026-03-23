import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FaArrowLeft } from "react-icons/fa";
import AddPayrollBreakdown from "./AddPayrollBreakdown"; // adjust path if different
import API_BASE from "../config";

export default function AddPayroll() {
  const [employees, setEmployees] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState({
    payroll_amount: "",
    payroll_date: "",
    pay_month: "",
    pay_month_raw: "",
    pay_year: "",
    mode_of_payment: "",
  });
  const [openBreakdown, setOpenBreakdown] = useState(false);
  const [lastCreatedPayrollId, setLastCreatedPayrollId] = useState(null);
  const navigate = useNavigate();
  const role = localStorage.getItem("role");

  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
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
    const email = localStorage.getItem("email");
    if (!email || !role) navigate("/", { replace: true });

    window.history.pushState(null, null, window.location.href);
    window.onpopstate = () => window.history.go(1);

    axios
      .get(`${API_BASE}/api/employees`)
      .then((res) => setEmployees(res.data || []))
      .catch((err) => console.error(err));
  }, [navigate, role]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "payroll_amount") {
      if (value === "" || /^[0-9]*\.?[0-9]*$/.test(value)) {
        setForm((prev) => ({ ...prev, [name]: value }));
      }
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleMonthChange = (e) => {
    const month = e.target.value;
    const year = form.pay_year;
    setForm((prev) => ({
      ...prev,
      pay_month_raw: month,
      pay_month: month && year ? `${month} ${year}` : "",
    }));
  };

  const handleYearChange = (e) => {
    const year = e.target.value;
    const month = form.pay_month_raw;
    setForm((prev) => ({
      ...prev,
      pay_year: year,
      pay_month: month && year ? `${month} ${year}` : "",
    }));
  };

  const handleSubmit = async () => {
    if (
      !selectedId ||
      !form.payroll_amount ||
      Number(form.payroll_amount) <= 0 ||
      !form.payroll_date ||
      !form.pay_month ||
      !form.mode_of_payment
    ) {
      toast.warning("Please fill all fields with valid values");
      return;
    }

    const data = {
      fk_employee_id: Number(selectedId),
      payroll_amount: Number(form.payroll_amount),
      payroll_date: formatDateLocal(form.payroll_date),
      pay_month: form.pay_month,
      mode_of_payment: form.mode_of_payment,
      is_published: false,
    };

    try {
      const res = await axios.post(`${API_BASE}/api/payrolls`, data);
      const createdId = res.data?.id;
      setLastCreatedPayrollId(createdId || null);
      toast.success("Payroll added successfully!");
      setTimeout(() => setOpenBreakdown(true), 600);
    } catch (err) {
      console.error(err.response?.data || err);
      toast.error("Failed to add payroll");
    }
  };

  // Helper: default breakdown structure based on salary
  const defaultBreakdown = (amount) => [
    { type: "Basic", amount: Math.round(amount * 0.4), category: 1 },
    { type: "HRA", amount: Math.round(amount * 0.2), category: 1 },
    { type: "Allowance", amount: Math.round(amount * 0.1), category: 1 },
    { type: "PF", amount: Math.round(amount * 0.12), category: 2 },
  ];

  const handleGenerateAll = async () => {
    if (!form.pay_month_raw || !form.pay_year || !form.payroll_date || !form.mode_of_payment) {
      toast.warning("Select month, year, date, and payment mode for bulk generation");
      return;
    }

    try {
      const empRes = await axios.get(`${API_BASE}/api/employees`);
      const list = empRes.data || [];
      const payMonth = `${form.pay_month_raw} ${form.pay_year}`;

      const bulkPayload = list
        .filter((e) => e.salary && Number(e.salary) > 0)
        .map((e) => ({
          fk_employee_id: Number(e.employee_id),
          payroll_amount: Number(e.salary),
          payroll_date: formatDateLocal(form.payroll_date),
          pay_month: payMonth,
          mode_of_payment: form.mode_of_payment,
          is_published: false,
        }));

      if (!bulkPayload.length) {
        toast.warning("No employees with valid salary found");
        return;
      }

      let created = [];
      try {
        const res = await axios.post(`${API_BASE}/api/payrolls/bulk`, {
          items: bulkPayload,
        });
        created = Array.isArray(res.data) ? res.data : [];
      } catch {
        const results = await Promise.all(
          bulkPayload.map((p) => axios.post(`${API_BASE}/api/payrolls`, p))
        );
        created = results.map((r) => r.data);
      }

      toast.success(`Generated ${created.length} payrolls successfully`);

      // Optional auto breakdown creation
      try {
        const breakdownItems = created.flatMap((row) => {
          const base = row.payroll_amount || 0;
          return defaultBreakdown(base).map((b) => ({
            fk_employee_id: row.fk_employee_id,
            fk_payroll_id: row.id,
            amount: b.amount,
            type: b.type,
            category: b.category,
          }));
        });

        if (breakdownItems.length) {
          try {
            await axios.post(
              `${API_BASE}/api/payrolls/employeeBreakdown/bulk`,
              { items: breakdownItems }
            );
          } catch {
            await Promise.all(
              breakdownItems.map((item) =>
                axios.post(
                  `${API_BASE}/api/payrolls/employeeBreakdown/breakdown`,
                  item
                )
              )
            );
          }
        }
      } catch (e) {
        console.warn("Bulk breakdown creation failed", e);
      }
    } catch (e) {
      console.error(e);
      toast.error("Bulk generation failed");
    }
  };

  return (
    <>
      <div className="p-4 sm:p-6">
        <header className="flex items-center justify-between gap-3 mb-6">
          <button
            onClick={() => navigate("/welcome?view=payroll")}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-700 transition text-sm font-medium"
          >
            <FaArrowLeft size={13} /> Back
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-blue-700">Generate Payroll</h1>
          <div className="w-16" />
        </header>

        <div className="bg-white w-full max-w-2xl mx-auto rounded-lg shadow p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 text-blue-600">Generate Payroll</h2>

          <label className="block mb-1 font-medium">Select Employee</label>
          <select
            value={selectedId || ""}
            onChange={(e) => setSelectedId(Number(e.target.value))}
            className="w-full mb-3 px-4 py-2 border rounded"
          >
            <option value="">Select</option>
            {employees.map((emp) => (
              <option key={emp.employee_id} value={emp.employee_id}>
                {emp.first_name} {emp.last_name}
              </option>
            ))}
          </select>

          <input
            name="payroll_amount"
            type="number"
            step="0.01"
            placeholder="Payroll Amount"
            value={form.payroll_amount}
            onChange={handleChange}
            className="w-full mb-3 px-4 py-2 border rounded"
          />

          <div className="flex gap-2 mb-3">
            <select
              value={form.pay_month_raw}
              onChange={handleMonthChange}
              className="w-full sm:w-1/2 px-3 py-2 border rounded"
            >
              <option value="">Select</option>
              {months.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={form.pay_year}
              onChange={handleYearChange}
              className="w-full sm:w-1/2 px-3 py-2 border rounded"
            >
              <option value="">Select</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <input
            name="payroll_date"
            type="date"
            value={form.payroll_date}
            onChange={handleChange}
            className="w-full mb-3 px-4 py-2 border rounded"
          />
          <input
            name="mode_of_payment"
            placeholder="Payment Mode"
            value={form.mode_of_payment}
            onChange={handleChange}
            className="w-full mb-4 px-4 py-2 border rounded"
          />

          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              className="w-full bg-primary-600 text-white py-2 rounded hover:bg-primary-700"
            >
              Save Payroll
            </button>
            <button
              onClick={() => {
                if (!selectedId || !form.pay_month) {
                  toast.warning("Select employee and month/year first");
                  return;
                }
                setOpenBreakdown(true);
              }}
              className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700"
            >
              Add Breakdown
            </button>
          </div>
        </div>
      </div>

      <AddPayrollBreakdown
        isOpen={openBreakdown}
        onClose={() => {
          setOpenBreakdown(false);
          navigate("/welcome?view=payroll");
        }}
        defaultEmployeeId={selectedId ? String(selectedId) : ""}
        defaultPayrollId={lastCreatedPayrollId ? String(lastCreatedPayrollId) : ""}
      />
    </>
  );
}
