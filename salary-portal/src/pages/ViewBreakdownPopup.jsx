import React, { useState, useEffect } from "react";
import axios from "axios";

export default function ViewBreakdownPopup({
  isOpen,
  onClose,
  breakdownData,
  onRefresh,
  payrollId,
  employeeId,
}) {
  if (!isOpen) return null;

  const [editRowId, setEditRowId] = useState(null);
  const [form, setForm] = useState({ amount: "", type: "" });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({
    show: false,
    type: "success",
    message: "",
  });
  const [metaTypes, setMetaTypes] = useState([]);
  const [newItem, setNewItem] = useState({ amount: "", type: "", category: 1 });

  useEffect(() => {
    if (!isOpen) return;
    axios
      .get("http://localhost:5000/api/payroll-meta-types")
      .then((res) => setMetaTypes(res.data || []))
      .catch((e) => console.error(e));
  }, [isOpen]);

  const startEdit = (item) => {
    setEditRowId(item.id);
    setForm({ amount: String(item.amount), type: item.type });
  };

  const cancelEdit = () => {
    setEditRowId(null);
    setForm({ amount: "", type: "" });
  };

  const saveEdit = async () => {
    try {
      setLoading(true);
      await axios.put(
        `http://localhost:5000/api/payrolls/employeeBreakdown/${editRowId}`,
        {
          amount: Number(form.amount),
          type: form.type,
        }
      );
      setToast({ show: true, type: "success", message: "Updated successfully" });
      setEditRowId(null);
      onRefresh?.();
    } catch (e) {
      setToast({ show: true, type: "error", message: e.response?.data?.error || "Update failed" });
    } finally {
      setLoading(false);
    }
  };

  const deleteRow = async (id) => {
    if (!confirm("Delete this breakdown item?")) return;
    try {
      setLoading(true);
      await axios.delete(`http://localhost:5000/api/payrolls/employeeBreakdown/${id}`);
      setToast({ show: true, type: "success", message: "Deleted successfully" });
      onRefresh?.();
    } catch (e) {
      setToast({ show: true, type: "error", message: e.response?.data?.error || "Delete failed" });
    } finally {
      setLoading(false);
    }
  };

  const addRow = async () => {
    if (!payrollId || !employeeId || !newItem.type || !newItem.amount) {
      setToast({ show: true, type: "error", message: "Fill type and amount" });
      return;
    }
    try {
      setLoading(true);
      await axios.post("http://localhost:5000/api/payrolls/employeeBreakdown/breakdown", {
        fk_employee_id: Number(employeeId),
        fk_payroll_id: Number(payrollId),
        amount: Number(newItem.amount),
        type: newItem.type,
        category: Number(newItem.category),
      });
      setToast({ show: true, type: "success", message: "Added successfully" });
      setNewItem({ amount: "", type: "", category: 1 });
      onRefresh?.();
    } catch (e) {
      setToast({ show: true, type: "error", message: e.response?.data?.error || "Add failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-gray-800">✖</button>
        <h2 className="text-xl font-bold text-center text-blue-700 mb-4">Manage Breakdownnnn</h2>

        {toast.show && (
          <div className={`mb-3 px-3 py-2 rounded ${toast.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
            {toast.message}
          </div>
        )}

        <div className="mb-4 p-3 border rounded bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block mb-1 text-sm">Type</label>
              <select
                className="w-full border px-2 py-1 rounded"
                value={newItem.type}
                onChange={(e) => setNewItem((s) => ({ ...s, type: e.target.value }))}
              >
                <option value="">Select Type</option>
                {metaTypes.map((t) => (
                  <option key={t.id} value={t.type_name}>{t.type_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1 text-sm">Amount</label>
              <input
                type="number"
                className="w-full border px-2 py-1 rounded"
                value={newItem.amount}
                onChange={(e) => setNewItem((s) => ({ ...s, amount: e.target.value }))}
              />
            </div>
            <div>
              <label className="block mb-1 text-sm">Category</label>
              <select
                className="w-full border px-2 py-1 rounded"
                value={newItem.category}
                onChange={(e) => setNewItem((s) => ({ ...s, category: Number(e.target.value) }))}
              >
                <option value={1}>Earning</option>
                <option value={2}>Deduction</option>
              </select>
            </div>
          </div>
          <div className="mt-3 text-right">
            <button
              disabled={loading}
              onClick={addRow}
              className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              Add Breakdown
            </button>
          </div>
        </div>

        {breakdownData.length === 0 ? (
          <p className="text-gray-600 text-center">No breakdown available</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 border whitespace-nowrap">Type</th>
                  <th className="p-2 border whitespace-nowrap">Amount</th>
                  <th className="p-2 border whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {breakdownData.map((item) => {
                  const isEditing = editRowId === item.id;
                  return (
                    <tr key={item.id}>
                      <td className="p-2 border">
                        {isEditing ? (
                          <input
                            className="w-full border px-2 py-1 rounded"
                            value={form.type}
                            onChange={(e) =>
                              setForm((f) => ({ ...f, type: e.target.value }))
                            }
                          />
                        ) : (
                          item.type
                        )}
                      </td>
                      <td className="p-2 border">
                        {isEditing ? (
                          <input
                            type="number"
                            className="w-full border px-2 py-1 rounded"
                            value={form.amount}
                            onChange={(e) =>
                              setForm((f) => ({ ...f, amount: e.target.value }))
                            }
                          />
                        ) : (
                          `₹${item.amount}`
                        )}
                      </td>
                      <td className="p-2 border">
                        {isEditing ? (
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={loading}
                              onClick={saveEdit}
                              className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => startEdit(item)}
                              className="px-3 py-1 rounded bg-yellow-600 hover:bg-yellow-800 text-white"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              disabled={loading}
                              onClick={() => deleteRow(item.id)}
                              className="px-3 py-1 rounded bg-red-600 hover:bg-red-800 text-white"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
