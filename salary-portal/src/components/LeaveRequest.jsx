import React, { useState, useEffect } from "react";
import axios from "axios";

function LeaveRequest({ onClose, embedded = false, onSuccess }) {
  const [formData, setFormData] = useState({
    from_date: "",
    to_date: "",
    number_of_days: 1,
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [dateError, setDateError] = useState("");
  const [isSingleDay, setIsSingleDay] = useState(false);

  // Calculate number of days when from_date or to_date changes
  useEffect(() => {
    if (formData.from_date && formData.to_date) {
      const fromDate = new Date(formData.from_date);
      const toDate = new Date(formData.to_date);
      
      // Reset error
      setDateError("");
      setIsSingleDay(false);
      
      // Validate that end date is not earlier than start date
      if (toDate < fromDate) {
        setDateError("End date cannot be earlier than start date");
        setFormData(prev => ({ ...prev, number_of_days: 1 }));
        return;
      }
      
      // Calculate difference in days
      const timeDiff = toDate.getTime() - fromDate.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
      
      // Update number of days
      if (daysDiff >= 1) {
        setFormData(prev => ({ ...prev, number_of_days: daysDiff }));
        
        // Set flag if it's a single day leave
        if (daysDiff === 1) {
          setIsSingleDay(true);
        }
      }
    }
  }, [formData.from_date, formData.to_date]);

  // Alternative approach: Let user toggle between single day and multi-day
  const handleSingleDayToggle = () => {
    if (!formData.from_date) return;
    
    setIsSingleDay(!isSingleDay);
    if (!isSingleDay) {
      // Setting to single day mode - set to_date same as from_date
      setFormData(prev => ({ 
        ...prev, 
        to_date: prev.from_date,
        number_of_days: 1
      }));
    } else {
      // Exiting single day mode - clear to_date
      setFormData(prev => ({ 
        ...prev, 
        to_date: "",
        number_of_days: 1
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear date error when user changes dates
    if (name === "from_date" || name === "to_date") {
      setDateError("");
    }
    
    // If user changes to_date while in single day mode, exit single day mode
    if (name === "to_date" && isSingleDay && value !== formData.from_date) {
      setIsSingleDay(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate dates before submission
    if (formData.from_date && formData.to_date) {
      const fromDate = new Date(formData.from_date);
      const toDate = new Date(formData.to_date);
      
      if (toDate < fromDate) {
        setDateError("End date cannot be earlier than start date");
        return;
      }
    }
    
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        employee_id: localStorage.getItem("id"),
        employee_name: localStorage.getItem("name"),
        from_date: formData.from_date,
        to_date: formData.to_date,
        number_of_days: formData.number_of_days,
        description: formData.description,
        status: "pending",
        applied_date: new Date().toISOString(),
      };

      const res = await axios.post(
        "http://localhost:5000/api/leave-requests",
        payload
      );
      if (res.status === 201 || res.status === 200) {
        setSuccess("Leave request submitted successfully");
        setFormData({
          from_date: "",
          to_date: "",
          number_of_days: 1,
          description: "",
        });
        setIsSingleDay(false);
        if (onSuccess) {
          onSuccess();
        }
        if (!embedded && onClose) {
          onClose();
        }
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message || "Failed to submit leave request";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={`bg-white p-6 rounded-lg shadow-md w-full ${
        embedded ? "" : "max-w-md relative"
      }`}
    >
      {!embedded && (
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 rounded-full p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 shadow-sm transition-all"
          aria-label="Close"
        >
          ✕
        </button>
      )}

      <h2 className="text-xl font-semibold mb-4">Apply for Leave</h2>

      {error && (
        <div className="mb-3 p-2 bg-red-100 text-red-700 rounded border border-red-200 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-3 p-2 bg-green-100 text-green-700 rounded border border-green-200 text-sm">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            From Date
          </label>
          <input
            type="date"
            name="from_date"
            value={formData.from_date}
            onChange={handleChange}
            min={new Date().toISOString().split("T")[0]}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              To Date
            </label>
            <button
              type="button"
              onClick={handleSingleDayToggle}
              className={`text-sm px-3 py-1 rounded-full ${
                isSingleDay 
                  ? "bg-blue-100 text-blue-700 border border-blue-300" 
                  : "bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200"
              }`}
              disabled={!formData.from_date}
            >
              {isSingleDay ? "✓ Single Day" : "Single Day Leave"}
            </button>
          </div>
          
          <input
            type="date"
            name="to_date"
            value={formData.to_date}
            onChange={handleChange}
            min={formData.from_date || ""}
            disabled={isSingleDay}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
              isSingleDay ? "bg-gray-100 cursor-not-allowed" : ""
            }`}
            required
          />
          
          {isSingleDay && (
            <p className="mt-1 text-sm text-blue-600">
              ✓ Single day leave selected. Leave will be applied for {formData.from_date} only.
            </p>
          )}
          
          {dateError && (
            <p className="mt-1 text-sm text-red-600">{dateError}</p>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Number of Days
          </label>
          <input
            type="number"
            name="number_of_days"
            value={formData.number_of_days}
            min={1}
            readOnly
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50"
            required
          />
          <p className="mt-1 text-sm text-gray-500">
            {isSingleDay 
              ? "Single day leave (1 day)" 
              : `Leave duration: ${formData.number_of_days} day${formData.number_of_days > 1 ? 's' : ''}`
            }
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Reason for leave"
            required
          />
        </div>

        <div className={`flex ${embedded ? "justify-start" : "justify-end"} gap-2`}>
          {!embedded && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
          )}
          <button
            type="submit"
            disabled={submitting || dateError}
            className="px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Request"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default LeaveRequest;