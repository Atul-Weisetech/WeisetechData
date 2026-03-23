import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import DataTable from "react-data-table-component";
import DownloadPayrollPDF from "../components/DownloadPayrollPDF";
import API_BASE from "../config";

const tableCustomStyles = {
  headRow: { style: { backgroundColor: "#eff6ff", borderBottom: "2px solid #bfdbfe" } },
  headCells: { style: { color: "#374151", fontWeight: "600", fontSize: "13px" } },
  rows: { style: { "&:hover": { backgroundColor: "#f0f9ff" } } },
  pagination: { style: { borderTop: "1px solid #e2e8f0", backgroundColor: "#f8fafc" } },
};

export default function EmployeePayrolls() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [payrolls, setPayrolls] = useState([]);
  const [employeeData, setEmployeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [breakdownData, setBreakdownData] = useState({});

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const payrollRes = await axios.get(`${API_BASE}/api/payrolls/employee/${id}`);
        setPayrolls(payrollRes.data || []);

        const employeeRes = await axios.get(`${API_BASE}/api/employees/${id}`);
        setEmployeeData(employeeRes.data);

        if (payrollRes.data?.length > 0) {
          const results = await Promise.all(
            payrollRes.data.map((p) =>
              axios
                .get(`${API_BASE}/api/payrolls/${p.id}/breakdown`)
                .then((res) => ({ payrollId: p.id, data: res.data }))
                .catch(() => ({ payrollId: p.id, data: [] }))
            )
          );
          const map = {};
          results.forEach((r) => { map[r.payrollId] = r.data; });
          setBreakdownData(map);
        }
      } catch (e) {
        setError(e?.response?.data?.message || "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const formatCurrency = (val) => {
    const num = Number(val);
    return Number.isNaN(num) ? String(val ?? "") : `₹${num.toFixed(2)}`;
  };

  const preparePayrollData = (payroll) => ({
    payroll_amount: payroll.payroll_amount,
    pay_month: payroll.pay_month,
    payroll_date: payroll.payroll_date,
    mode_of_payment: payroll.mode_of_payment,
    breakdown: breakdownData[payroll.id] || [],
  });

  const prepareEmployeeData = () => {
    if (!employeeData) return { name: `Employee ${id}`, email_address: "N/A", designation: "Employee" };
    return {
      name: `${employeeData.first_name || ""} ${employeeData.last_name || ""}`.trim() || `Employee ${id}`,
      email_address: employeeData.email_address || "N/A",
      designation: employeeData.designation || "Employee",
    };
  };

  const columns = [
    {
      name: "Sr.No",
      cell: (_, i) => i + 1,
      width: "70px",
    },
    {
      name: "Amount",
      selector: (row) => parseFloat(row.payroll_amount) || 0,
      cell: (row) => formatCurrency(row.payroll_amount),
      sortable: true,
    },
    {
      name: "Month",
      selector: (row) => row.pay_month,
      sortable: true,
    },
    {
      name: "Payroll Date",
      selector: (row) => row.payroll_date,
      cell: (row) =>
        new Date(row.payroll_date).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }),
      sortable: true,
    },
    {
      name: "Payment Mode",
      selector: (row) => row.mode_of_payment,
      sortable: true,
    },
    {
      name: "Download",
      cell: (row) => (
        <DownloadPayrollPDF
          payrollData={preparePayrollData(row)}
          employeeData={prepareEmployeeData()}
          companyName="Weisetech Developers"
          location="Ganesh Glory 11, E-620, Gota, Ahmedabad, Gujarat 382470"
          className="text-sm px-3 py-1"
        />
      ),
      ignoreRowClick: true,
    },
  ];

  return (
    <div className="p-4 sm:p-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-blue-700 truncate">Published Payrolls</h1>
          <p className="text-sm text-gray-500">Employee ID: {id}</p>
          {employeeData && (
            <p className="text-sm text-gray-600 truncate">
              {employeeData.first_name} {employeeData.last_name} — {employeeData.designation}
            </p>
          )}
        </div>
        <button
          onClick={() => navigate("/welcome?view=employees")}
          className="bg-primary-600 text-white px-6 py-2 rounded hover:bg-primary-700 transition-colors"
        >
          Back
        </button>
      </header>

      {error && (
        <div className="mb-4 px-4 py-2 rounded border border-red-200 bg-red-50 text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <DataTable
          columns={columns}
          data={payrolls}
          progressPending={loading}
          pagination
          paginationRowsPerPageOptions={[5, 10, 25, 50]}
          defaultSortFieldId={3}
          customStyles={tableCustomStyles}
          noDataComponent={
            <div className="text-center py-12 text-gray-400">
              No published payrolls found for this employee.
            </div>
          }
        />
      </div>
    </div>
  );
}
