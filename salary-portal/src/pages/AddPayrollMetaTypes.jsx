import { useState, useEffect } from "react";
import axios from "axios";
import { Tag, X } from "lucide-react";
import API_BASE from "../config";

export default function AddPayrollMetaTypes({ isOpen, onClose }) {
  const [typeName, setTypeName] = useState("");
  const [metaTypes, setMetaTypes] = useState([]);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    if (isOpen) fetchTypes();
  }, [isOpen]);

  const fetchTypes = () => {
    axios
      .get(`${API_BASE}/api/payroll-meta-types`)
      .then((res) => setMetaTypes(res.data))
      .catch((err) => console.error(err));
  };

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!typeName.trim()) return;
    try {
      await axios.post(`${API_BASE}/api/payroll-meta-types`, { type_name: typeName.trim() });
      setTypeName("");
      fetchTypes();
      showToast("Meta type added successfully!", "success");
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to add type", "error");
    }
  };

  const handleSaveEdit = async (id) => {
    if (!editValue.trim()) return;
    try {
      await axios.put(`${API_BASE}/api/payroll-meta-types/${id}`, { type_name: editValue.trim() });
      setEditingId(null);
      setEditValue("");
      fetchTypes();
      showToast("Meta type updated!", "success");
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to update type", "error");
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE}/api/payroll-meta-types/${id}`);
      fetchTypes();
      showToast("Meta type deleted!", "success");
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to delete type", "error");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-primary-600 hover:text-red-600"
        >
          <X size={18} />
        </button>

        <h2 className="text-xl font-bold text-center text-gray-900 mb-1 flex items-center justify-center gap-2">
          <Tag size={20} className="text-primary-600" /> Add Payroll Meta Types
        </h2>

        {toast.show && (
          <div className={`mt-3 mb-2 px-3 py-2 rounded text-sm font-medium ${toast.type === "success" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
            {toast.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-2 mt-4 mb-5">
          <input
            type="text"
            value={typeName}
            onChange={(e) => setTypeName(e.target.value)}
            placeholder="Enter type (e.g. Bonus)"
            className="flex-1 border px-3 py-2 rounded focus:ring-2 focus:ring-primary-400 focus:outline-none"
          />
          <button
            type="submit"
            className="bg-primary-600 text-white px-4 rounded hover:bg-primary-700"
          >
            Add
          </button>
        </form>

        <ul className="space-y-2 max-h-56 overflow-y-auto">
          {metaTypes.map((type) => (
            <li key={type.id} className="flex items-center gap-2 p-2 border rounded bg-gray-50">
              {editingId === type.id ? (
                <>
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSaveEdit(type.id); if (e.key === "Escape") { setEditingId(null); setEditValue(""); } }}
                    autoFocus
                    className="flex-1 border px-2 py-1 rounded text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none"
                  />
                  <button
                    onClick={() => handleSaveEdit(type.id)}
                    className="bg-primary-600 text-white px-2 py-1 rounded text-xs hover:bg-primary-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => { setEditingId(null); setEditValue(""); }}
                    className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-gray-700 text-sm">{type.type_name}</span>
                  <button
                    onClick={() => { setEditingId(type.id); setEditValue(type.type_name); }}
                    className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs hover:bg-gray-300"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(type.id)}
                    className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700"
                  >
                    Delete
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
