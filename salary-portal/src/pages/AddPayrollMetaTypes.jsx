import React, { useState, useEffect } from "react";
import axios from "axios";
import API_BASE from "../config";

export default function AddPayrollMetaTypes({ isOpen, onClose }) {
  const [typeName, setTypeName] = useState("");
  const [metaTypes, setMetaTypes] = useState([]);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  useEffect(() => {
    if (isOpen) {
      axios
        .get(`${API_BASE}/api/payroll-meta-types`)
        .then((res) => setMetaTypes(res.data))
        .catch((err) => console.error(err));
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!typeName) return;

    try {
      await axios.post(`${API_BASE}/api/payroll-meta-types`, {
        type_name: typeName,
      });
      setTypeName("");
      const res = await axios.get(`${API_BASE}/api/payroll-meta-types`);
      setMetaTypes(res.data);
      setToast({ show: true, message: "Meta type added successfully!", type: "success" });
    } catch (err) {
      setToast({ show: true, message: err.response?.data?.error || "Failed to add type", type: "error" });
    }
  };

  if (!isOpen) return null;

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
          Add Payroll Meta Types
        </h2>

        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
        >
          ✖
        </button>

        <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
          <input
            type="text"
            value={typeName}
            onChange={(e) => setTypeName(e.target.value)}
            placeholder="Enter type (e.g. Bonus)"
            className="flex-1 border px-3 py-2 rounded focus:ring-2 focus:ring-blue-400 focus:outline-none"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 rounded hover:bg-blue-700"
          >
            Add
          </button>
        </form>

        <ul className="space-y-2 max-h-40 overflow-y-auto">
          {metaTypes.map((type) => (
            <li
              key={type.id}
              className="p-2 border rounded bg-gray-50 text-gray-700"
            >
              {type.type_name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
