import { useEffect, useState } from 'react';
import axios from 'axios';

export default function AllPayrolls() {
  const [payrolls, setPayrolls] = useState([]);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const fetchPayrolls = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/payrolls');
      setPayrolls(res.data);
    } catch (err) {
      console.error('Error fetching payrolls:', err);
    }
  };

  useEffect(() => {
    fetchPayrolls();
  }, []);

  const publishPayroll = async (id) => {
    try {
      await axios.put(`http://localhost:5000/api/payroll/publish/${id}`);
      setToast({ show: true, message: 'Payroll published', type: 'success' });
      fetchPayrolls();
    } catch (err) {
      setToast({ show: true, message: 'Failed to publish payroll', type: 'error' });
    }
  };

  return (
    <div className="max-w-6xl mx-auto mt-6 sm:mt-10 bg-white p-4 sm:p-6 rounded shadow-md">
      {toast.show && (
        <div className="flex justify-center mb-4">
          <div className={`max-w-2xl w-full px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm font-medium ${toast.type === 'success' ? 'bg-green-50 text-green-800 border border-green-300' : 'bg-red-50 text-red-800 border border-red-300'}`}>
            {toast.type === 'success' ? (
              <span className="text-green-600 text-lg">✅</span>
            ) : (
              <span className="text-red-600 text-lg">❌</span>
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
      <h2 className="text-2xl font-bold mb-6 text-blue-700">Payroll Records</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border">
          <thead className="bg-blue-100">
            <tr>
              <th className="px-4 py-2 whitespace-nowrap">Serial No</th>
              <th className="px-4 py-2 whitespace-nowrap">Employee ID</th>
              <th className="px-4 py-2 whitespace-nowrap">Amount</th>
              <th className="px-4 py-2 whitespace-nowrap">Month</th>
              <th className="px-4 py-2 whitespace-nowrap">Payment Mode</th>
              <th className="px-4 py-2 whitespace-nowrap">Published</th>
              <th className="px-4 py-2 whitespace-nowrap">Action</th>
            </tr>
          </thead>
          <tbody>
            {payrolls.map((p, index) => (
              <tr key={p.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2">{index + 1}</td>
                <td className="px-4 py-2">{p.fk_employee_id}</td>
                <td className="px-4 py-2">₹{p.payroll_amount}</td>
                <td className="px-4 py-2">{p.pay_month}</td>
                <td className="px-4 py-2">{p.mode_of_payment}</td>
                <td className="px-4 py-2">{p.is_published ? 'yes' : 'no'}</td>
                <td className="px-4 py-2">
                  {!p.is_published && (
                    <button
                      onClick={() => publishPayroll(p.id)}
                      className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                    >
                      Publish
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
