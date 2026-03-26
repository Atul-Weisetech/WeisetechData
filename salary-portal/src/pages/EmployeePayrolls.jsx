import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { FaArrowLeft, FaCalendarAlt, FaCreditCard, FaRupeeSign } from "react-icons/fa";
import DownloadPayrollPDF from "../components/DownloadPayrollPDF";
import API_BASE from "../config";

const CARDS_PER_PAGE = 6;

const MONTH_ORDER = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

const toMonthSortKey = (pay_month) => {
  if (!pay_month) return 0;
  const [m, y] = pay_month.split(" ");
  const mi = MONTH_ORDER.indexOf(m);
  return (parseInt(y, 10) || 0) * 100 + (mi >= 0 ? mi : 0);
};

const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";

export default function EmployeePayrolls() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [payrolls, setPayrolls]       = useState([]);
  const [employeeData, setEmployeeData] = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [breakdownData, setBreakdownData] = useState({});
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [payrollRes, employeeRes] = await Promise.all([
          axios.get(`${API_BASE}/api/payrolls/employee/${id}`),
          axios.get(`${API_BASE}/api/employees/${id}`),
        ]);
        setPayrolls(payrollRes.data || []);
        setEmployeeData(employeeRes.data);

        if (payrollRes.data?.length > 0) {
          const results = await Promise.all(
            payrollRes.data.map((p) =>
              axios
                .get(`${API_BASE}/api/payrolls/employee/breakdown`, { params: { payrollId: p.id } })
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

  // Sort descending — latest month first
  const sortedPayrolls = [...payrolls].sort(
    (a, b) => toMonthSortKey(b.pay_month) - toMonthSortKey(a.pay_month)
  );

  const totalPages = Math.ceil(sortedPayrolls.length / CARDS_PER_PAGE);
  const paginatedPayrolls = sortedPayrolls.slice(
    (currentPage - 1) * CARDS_PER_PAGE,
    currentPage * CARDS_PER_PAGE
  );

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
    });
  };

  const empName = employeeData
    ? `${cap(employeeData.first_name)} ${cap(employeeData.last_name)}`.trim()
    : "";

  const preparePayrollData = (payroll) => ({
    payroll_amount: payroll.payroll_amount,
    pay_month: payroll.pay_month,
    payroll_date: payroll.payroll_date,
    mode_of_payment: payroll.mode_of_payment,
    breakdown: breakdownData[payroll.id] || [],
  });

  const prepareEmployeeData = () => {
    if (!employeeData) return { name: empName || `Employee ${id}`, email_address: "N/A", designation: "Employee" };
    return {
      name: empName || `Employee ${id}`,
      email_address: employeeData.email_address || "N/A",
      designation: employeeData.designation || "Employee",
    };
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <header className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition text-sm font-medium mb-3"
        >
          <FaArrowLeft size={13} /> Back
        </button>
        <h1 className="text-2xl font-bold text-blue-700">My Payslips</h1>
        {employeeData && (
          <p className="text-sm text-gray-500 mt-0.5">
            {empName}
            {employeeData.designation ? ` — ${employeeData.designation}` : ""}
          </p>
        )}
      </header>

      {error && (
        <div className="mb-4 px-4 py-2 rounded border border-red-200 bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      ) : sortedPayrolls.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <FaRupeeSign size={36} className="mb-3 opacity-30" />
          <p className="text-sm">No published payslips found.</p>
        </div>
      ) : (
        <>
          {/* Cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {paginatedPayrolls.map((payroll) => (
              <PayslipCard
                key={payroll.id}
                payroll={payroll}
                formatDate={formatDate}
                payrollData={preparePayrollData(payroll)}
                employeeData={prepareEmployeeData()}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8 flex-wrap">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded border text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                ← Prev
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded text-sm font-semibold transition ${
                    page === currentPage
                      ? "bg-blue-600 text-white shadow"
                      : "border text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded border text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Next →
              </button>
            </div>
          )}

          <p className="text-center text-xs text-gray-400 mt-3">
            Showing {(currentPage - 1) * CARDS_PER_PAGE + 1}–{Math.min(currentPage * CARDS_PER_PAGE, sortedPayrolls.length)} of {sortedPayrolls.length} payslip{sortedPayrolls.length !== 1 ? "s" : ""}
          </p>
        </>
      )}
    </div>
  );
}

function PayslipCard({ payroll, formatDate, payrollData, employeeData }) {
  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-slate-100 hover:shadow-lg transition-shadow">
      {/* Gradient Header */}
      <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 px-5 py-4 relative overflow-hidden">
        {/* decorative circle */}
        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
        <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-white/10" />
        <p className="text-blue-100 text-xs font-medium uppercase tracking-wider mb-1 relative">Pay Period</p>
        <h3 className="text-white text-xl font-bold relative">{payroll.pay_month || "—"}</h3>
        <div className="mt-3 inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
          <FaRupeeSign size={11} className="text-white" />
          <span className="text-white font-semibold text-sm">
            {Number(payroll.payroll_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="px-5 py-4 space-y-3">
        <div className="flex items-center gap-2.5 text-sm text-gray-600">
          <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
            <FaCalendarAlt size={12} className="text-blue-500" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Payroll Date</p>
            <p className="font-medium text-gray-700">{formatDate(payroll.payroll_date)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 text-sm text-gray-600">
          <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
            <FaCreditCard size={12} className="text-blue-500" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Payment Mode</p>
            <p className="font-medium text-gray-700">{payroll.mode_of_payment || "—"}</p>
          </div>
        </div>
      </div>

      {/* Download Button */}
      <div className="px-5 pb-4">
        <DownloadPayrollPDF
          payrollData={payrollData}
          employeeData={employeeData}
          companyName="Weisetech Developers"
          location="Ganesh Glory 11, E-620, Gota, Ahmedabad, Gujarat 382470"
          companyPhone="+91 79 4000 0000"
          companyEmail="hr@weisetech.com"
          className="w-full justify-center text-sm py-2"
        />
      </div>
    </div>
  );
}
