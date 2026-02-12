import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import AlertBox from "../components/AlertBox";
import AddPayrollBreakdown from "./AddPayrollBreakdown"; // adjust path if different

export default function AddPayroll() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
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
      .get("http://localhost:5000/api/employees")
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
      setAlertMessage("Please fill all fields with valid values");
      setShowAlert(true);
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
      const res = await axios.post("http://localhost:5000/api/payrolls", data);
      const createdId = res.data?.id;
      setLastCreatedPayrollId(createdId || null);
      setAlertMessage("Payroll added successfully!");
      setShowAlert(true);

      // Open breakdown modal for the created payroll so breakdown can be added immediately
      setTimeout(() => {
        setShowAlert(false);
        setOpenBreakdown(true);
      }, 600);
    } catch (err) {
      console.error(err.response?.data || err);
      setAlertMessage("Failed to add payroll");
      setShowAlert(true);
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
      setAlertMessage("Select month, year, date, and payment mode for bulk generation");
      setShowAlert(true);
      return;
    }

    try {
      const empRes = await axios.get("http://localhost:5000/api/employees");
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
        setAlertMessage("No employees with valid salary found");
        setShowAlert(true);
        return;
      }

      let created = [];
      try {
        const res = await axios.post("http://localhost:5000/api/payrolls/bulk", {
          items: bulkPayload,
        });
        created = Array.isArray(res.data) ? res.data : [];
      } catch {
        const results = await Promise.all(
          bulkPayload.map((p) => axios.post("http://localhost:5000/api/payrolls", p))
        );
        created = results.map((r) => r.data);
      }

      setAlertMessage(`Generated ${created.length} payrolls successfully`);
      setShowAlert(true);

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
              "http://localhost:5000/api/payrolls/employeeBreakdown/bulk",
              { items: breakdownItems }
            );
          } catch {
            await Promise.all(
              breakdownItems.map((item) =>
                axios.post(
                  "http://localhost:5000/api/payrolls/employeeBreakdown/breakdown",
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
      setAlertMessage("Bulk generation failed");
      setShowAlert(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile Sidebar Drawer */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-72 bg-white shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="font-semibold text-slate-800">Menu</div>
              <button
                type="button"
                onClick={() => setIsSidebarOpen(false)}
                className="w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
                aria-label="Close menu"
              >
                ×
              </button>
            </div>
            <Sidebar
              onSelect={() => setIsSidebarOpen(false)}
              className="shadow-none"
            />
          </div>
        </div>
      )}

      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-56 shrink-0 sticky top-0 h-screen">
          <Sidebar className="h-screen" />
        </aside>

        <main className="flex-1 min-w-0 p-4 sm:p-6">
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 shadow-sm"
                aria-label="Open menu"
              >
                ☰
              </button>
              <h1 className="text-xl sm:text-2xl font-bold text-blue-700 truncate">
                🏢 Weisetech HR Portal
              </h1>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => navigate("/welcome?view=payroll")}
                className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
              >
                Back
              </button>
            </div>
          </header>

        <div className="bg-white w-full max-w-2xl mx-auto rounded-lg shadow p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 text-blue-600">Generate Payroll</h2>

          {showAlert && (
            <AlertBox message={alertMessage} onClose={() => setShowAlert(false)} />
          )}

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
                  setAlertMessage("Select employee and month/year first");
                  setShowAlert(true);
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
        </main>
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
    </div>
  );
}
