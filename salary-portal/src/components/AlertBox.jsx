import React from "react";

export default function AlertBox({ message, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-xl p-6 max-w-sm w-full text-center shadow-xl">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">Alert</h2>
        <p className="text-gray-700 mb-6">{message}</p>
        <button
          onClick={onClose}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded"
        >
          OK
        </button>
      </div>
    </div>
  );
}
