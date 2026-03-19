import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import DownloadPayrollPDF from "../components/DownloadPayrollPDF";
import API_BASE from "../config";

export default function EmployeePayrolls() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [payrolls, setPayrolls] = useState([]);
  const [employeeData, setEmployeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [breakdownData, setBreakdownData] = useState({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        // Fetch payrolls
        const payrollRes = await axios.get(`${API_BASE}/api/payrolls/employee/${id}`);
        console.log('Payrolls data:', payrollRes.data);
        setPayrolls(payrollRes.data || []);
        
        // Fetch employee data
        const employeeRes = await axios.get(`${API_BASE}/api/employees/${id}`);
        console.log('Employee data:', employeeRes.data);
        setEmployeeData(employeeRes.data);
        
        // Fetch breakdown data for each payroll - FIXED: Use the correct endpoint
        if (payrollRes.data && payrollRes.data.length > 0) {
          const breakdownPromises = payrollRes.data.map(payroll => 
            axios.get(`${API_BASE}/api/payrolls/${payroll.id}/breakdown`)
              .then(res => {
                console.log(`Breakdown for payroll ${payroll.id}:`, res.data);
                return { payrollId: payroll.id, data: res.data };
              })
              .catch(error => {
                console.warn(`Failed to fetch breakdown for payroll ${payroll.id}:`, error.message);
                return { payrollId: payroll.id, data: [] };
              })
          );
          
          const breakdownResults = await Promise.all(breakdownPromises);
          const breakdownMap = {};
          
          breakdownResults.forEach(result => {
            breakdownMap[result.payrollId] = result.data;
          });
          
          console.log('Breakdown map:', breakdownMap);
          setBreakdownData(breakdownMap);
        }
        
      } catch (e) {
        console.error('Error loading data:', e);
        setError(e?.response?.data?.message || "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const formatCurrency = (val) => {
    const num = Number(val);
    if (Number.isNaN(num)) return String(val ?? "");
    return `₹${num.toFixed(2)}`;
  };

  // Prepare payroll data for PDF generation
  const preparePayrollData = (payroll) => {
    const breakdown = breakdownData[payroll.id] || [];
    console.log(`Preparing payroll data for ${payroll.id}:`, { breakdown });
    
    return {
      payroll_amount: payroll.payroll_amount,
      pay_month: payroll.pay_month,
      payroll_date: payroll.payroll_date,
      mode_of_payment: payroll.mode_of_payment,
      breakdown: breakdown
    };
  };

  // Prepare employee data for PDF generation
  const prepareEmployeeData = () => {
    if (!employeeData) return {
      name: `Employee ${id}`,
      email_address: "N/A",
      designation: "Employee"
    };
    
    const fullName = `${employeeData.first_name || ''} ${employeeData.last_name || ''}`.trim();
    
    return {
      name: fullName || `Employee ${id}`,
      email_address: employeeData.email_address || "N/A",
      designation: employeeData.designation || "Employee"
    };
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
            <div className="flex items-start gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 shadow-sm"
                aria-label="Open menu"
              >
                ☰
              </button>
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-blue-700 truncate">
                  Published Payrolls
                </h1>
                <p className="text-sm text-gray-500">Employee ID: {id}</p>
                {employeeData && (
                  <p className="text-sm text-gray-600 truncate">
                    {employeeData.first_name} {employeeData.last_name} -{" "}
                    {employeeData.designation}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={() => navigate("/welcome?view=employees")}
              className="bg-primary-600 text-white px-6 py-2 rounded hover:bg-primary-700"
            >
              Back
            </button>
          </header>

        {error && (
          <div className="mb-4 px-4 py-2 rounded border border-red-200 bg-red-50 text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : payrolls.length === 0 ? (
          <div className="text-center text-gray-500">No published payrolls found for this employee.</div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-blue-100 text-gray-700">
                  <tr>
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Month</th>
                    <th className="px-4 py-3">Payroll Date</th>
                    <th className="px-4 py-3">Payment Mode</th>
                    <th className="px-4 py-3">Download</th>
                  </tr>
                </thead>
                <tbody>
                  {payrolls.map((p, idx) => (
                    <tr key={p.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-2">{idx + 1}</td>
                      <td className="px-4 py-2">{formatCurrency(p.payroll_amount)}</td>
                      <td className="px-4 py-2">{p.pay_month}</td>
                      <td className="px-4 py-2">
                        {new Date(p.payroll_date).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric"
                        })}
                      </td>
                      <td className="px-4 py-2">{p.mode_of_payment}</td>
                      <td className="px-4 py-2">
                        <DownloadPayrollPDF
                          payrollData={preparePayrollData(p)}
                          employeeData={prepareEmployeeData()}
                          companyName="Weisetech Developers"
                          location="Ganesh Glory 11, E-620, Gota, Ahmedabad, Gujarat 382470"
                          className="text-sm px-3 py-1"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        </main>
      </div>
    </div>
  );
}