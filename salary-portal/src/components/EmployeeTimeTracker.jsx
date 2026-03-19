import { useState, useEffect, useRef } from "react";
import axios from "axios";
import API_BASE from "../config";

const EmployeeTimeTracker = ({ onClose, initialTimerState, onTimerUpdate }) => {
  // Initialize state with props or defaults
  const [isTracking, setIsTracking] = useState(
    initialTimerState?.isTracking || false
  );
  const [startTime, setStartTime] = useState(
    initialTimerState?.startTime || ""
  );
  const [endTime, setEndTime] = useState("");
  const [activityType, setActivityType] = useState(
    initialTimerState?.currentActivityType || "Working time"
  );
  const [activity, setActivity] = useState("");
  const [description, setDescription] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [elapsedTime, setElapsedTime] = useState(
    initialTimerState?.elapsedTime || 0
  );
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [activityLogs, setActivityLogs] = useState(
    initialTimerState?.activityLogs || []
  );
  const [currentActivityStart, setCurrentActivityStart] = useState("");
  // Geolocation inputs
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [locMessage, setLocMessage] = useState("");

  // Activity options with icons
  const activityOptions = [
    {
      value: "Working time",
      label: "Working",
      icon: "💼",
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      hoverColor: "hover:bg-blue-100",
    },
    {
      value: "Meeting",
      label: "Meeting",
      icon: "👥",
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      hoverColor: "hover:bg-purple-100",
    },
    {
      value: "Project block",
      label: "Project",
      icon: "📁",
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      hoverColor: "hover:bg-green-100",
    },
    {
      value: "Break",
      label: "Break",
      icon: "☕",
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      hoverColor: "hover:bg-orange-100",
    },
  ];

  // Initialize current date
  useEffect(() => {
    const now = new Date();
    const day = now.getDate();
    const month = now.toLocaleString("en", { month: "short" });
    setCurrentDate(`${day} ${month}`);
  }, []);

  // Always-current ref so cleanup/unmount can read latest values without stale closure
  const stateRef = useRef({});
  stateRef.current = { isTracking, elapsedTime, startTime, activityLogs, activityType };

  // Tick the timer while tracking is active
  useEffect(() => {
    if (!isTracking) return;
    const iv = setInterval(() => setElapsedTime((p) => p + 1), 1000);
    return () => clearInterval(iv);
  }, [isTracking]);

  // On unmount, push final state back to parent so background badge stays accurate
  useEffect(() => {
    return () => {
      const s = stateRef.current;
      if (s.isTracking && onTimerUpdate) {
        onTimerUpdate({
          isTracking: s.isTracking,
          elapsedTime: s.elapsedTime,
          startTime: s.startTime,
          activityLogs: s.activityLogs,
          currentActivityType: s.activityType,
        });
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update parent component with timer state
  const updateParentTimer = (updates) => {
    const newState = {
      isTracking,
      elapsedTime,
      startTime,
      activityLogs,
      currentActivityType: activityType,
      lastUpdate: Date.now(),
      ...updates,
    };

    if (onTimerUpdate) {
      onTimerUpdate(newState);
    }
  };

  // Get current time string
  const getCurrentTimeString = () => {
    const now = new Date();
    return now.toTimeString().slice(0, 5);
  };

  // Handle activity type change
  const handleActivityTypeChange = (newActivityType) => {
    setActivityType(newActivityType);
    updateParentTimer({ currentActivityType: newActivityType });
  };

  // Geolocation helpers
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setLocMessage("Geolocation not supported; please enter lat/lon manually.");
      return;
    }
    setLocMessage("Fetching your location...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setLocMessage("Location captured");
      },
      (err) => {
        console.error("Geolocation error:", err);
        setLocMessage("Failed to fetch location; please enter manually.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const getLocationOnce = () => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        return resolve(null);
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        },
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  };

  // Call backend to clock-in
  const callClockIn = async () => {
    try {
      const empl_id = parseInt(localStorage.getItem("id"), 10);
      let latVal = latitude;
      let lonVal = longitude;
      if (latVal == null || lonVal == null) {
        const loc = await getLocationOnce();
        if (loc) {
          latVal = loc.lat;
          lonVal = loc.lon;
          setLatitude(latVal);
          setLongitude(lonVal);
        }
      }
      const res = await axios.post(
        `${API_BASE}/api/attendance/clock-in`,
        {
          empl_id,
          lat: latVal,
          log: lonVal,
        }
      );
      return res?.data;
    } catch (error) {
      console.error("Clock-in failed:", error);
      alert(error?.response?.data?.message || "Failed to record clock-in");
    }
  };

  // Call backend to clock-out
  const callClockOut = async () => {
    try {
      const empl_id = parseInt(localStorage.getItem("id"), 10);
      let latVal = latitude;
      let lonVal = longitude;
      if (latVal == null || lonVal == null) {
        const loc = await getLocationOnce();
        if (loc) {
          latVal = loc.lat;
          lonVal = loc.lon;
          setLatitude(latVal);
          setLongitude(lonVal);
        }
      }
      const res = await axios.post(
        `${API_BASE}/api/attendance/clock-out`,
        {
          empl_id,
          lat: latVal,
          log: lonVal,
        }
      );
      return res?.data;
    } catch (error) {
      console.error("Clock-out failed:", error);
      alert(error?.response?.data?.message || "Failed to record clock-out");
      return null;
    }
  };

  // Auto-fill start time when tracking starts
  const handleStartTracking = async () => {
    const timeString = getCurrentTimeString();
    setStartTime(timeString);
    setCurrentActivityStart(timeString);
    setIsTracking(true);
    setEndTime(""); // Reset end time when starting fresh

    updateParentTimer({
      isTracking: true,
      startTime: timeString,
      elapsedTime: 0,
    });

    // Try to capture location once when starting and wait briefly
    if (latitude == null || longitude == null) {
      const loc = await getLocationOnce();
      if (loc) {
        setLatitude(loc.lat);
        setLongitude(loc.lon);
      }
    }

    // Record clock-in in backend
    await callClockIn();
  };

  // Handle done for today
  const handleDoneForToday = () => {
    setShowConfirmation(true);
  };

  // Confirm end tracking
  const handleConfirmEnd = async () => {
    const timeString = getCurrentTimeString();
    setEndTime(timeString);

    // Add end time to last activity if exists
    let finalLogs = [...activityLogs];
    if (finalLogs.length > 0) {
      const lastLog = finalLogs[finalLogs.length - 1];
      if (!lastLog.endTime) {
        finalLogs[finalLogs.length - 1] = {
          ...lastLog,
          endTime: timeString,
        };
        setActivityLogs(finalLogs);
        updateParentTimer({ activityLogs: finalLogs });
      }
    }

    setIsTracking(false);
    setShowConfirmation(false);

    // Ensure we have location before clock-out
    if (latitude == null || longitude == null) {
      const loc = await getLocationOnce();
      if (loc) {
        setLatitude(loc.lat);
        setLongitude(loc.lon);
      }
    }

    // Record clock-out in backend, then submit all data
    const result = await callClockOut();
    handleSubmitData(result?.working_hours);
  };

  // Cancel end tracking
  const handleCancelEnd = () => {
    setShowConfirmation(false);
  };

  // Submit all data
  const handleSubmitData = (workedHours) => {
    const finalData = {
      date: currentDate,
      startTime,
      endTime,
      totalElapsedTime: formatTime(elapsedTime),
      activities: activityLogs,
      status: "completed",
      workedHours: workedHours ?? null,
    };

    console.log("Final Time Tracking Data:", finalData);
    alert(
      workedHours != null
        ? `Time tracking saved. Worked hours: ${workedHours}h`
        : "Time tracking completed and saved!"
    );

    // Reset form
    handleReset();
    if (onClose) onClose();
  };

  // Reset form
  const handleReset = () => {
    setIsTracking(false);
    setStartTime("");
    setEndTime("");
    setActivityType("Working time");
    setActivity("");
    setDescription("");
    setElapsedTime(0);
    setActivityLogs([]);
    setCurrentActivityStart("");

    // Update parent with reset state
    updateParentTimer({
      isTracking: false,
      elapsedTime: 0,
      startTime: "",
      activityLogs: [],
      currentActivityType: "Working time",
    });

    if (onClose) onClose();
  };

  // Get activity icon
  const getActivityIcon = (type) => {
    const activity = activityOptions.find((opt) => opt.value === type);
    return activity ? activity.icon : "💼";
  };

  // Helper to format time (existing function from file)
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    const pad = (n) => n.toString().padStart(2, "0");
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  };

  // Add missing handler to add activity log
  const handleAddActivity = () => {
    if (!isTracking) return;
    const timeString = getCurrentTimeString();

    // Close previous ongoing activity if any
    let finalLogs = [...activityLogs];
    if (finalLogs.length > 0) {
      const lastLog = finalLogs[finalLogs.length - 1];
      if (!lastLog.endTime) {
        finalLogs[finalLogs.length - 1] = { ...lastLog, endTime: timeString };
      }
    }

    // Add new activity log entry
    const newLog = {
      id: Date.now(),
      type: activityType,
      activity: activity || activityType,
      description,
      startTime: timeString,
      endTime: "",
    };

    finalLogs.push(newLog);
    setActivityLogs(finalLogs);
    setCurrentActivityStart(timeString);
    updateParentTimer({ activityLogs: finalLogs });

    // Clear inputs for next entry
    setActivity("");
    setDescription("");
  };

  // Watch system geolocation while tracking
  useEffect(() => {
    let watchId = null;
    if (isTracking && typeof navigator !== "undefined" && navigator.geolocation) {
      setLocMessage("Tracking location…");
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setLatitude(pos.coords.latitude);
          setLongitude(pos.coords.longitude);
        },
        (err) => {
          console.error("Geolocation watch error:", err);
          setLocMessage("Location watch failed; using last known position.");
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
      );
    }
    return () => {
      if (watchId && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [isTracking]);

  return (
    <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-gray-200 p-6 max-h-[90vh] overflow-y-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Time Tracking {isTracking && "⏱"}
      </h2>

      {/* Combined Timer and Date Display */}
      <div className="text-center mb-6 p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border-2 border-gray-200">
        <div className="flex items-center justify-between">
          {/* Timer Section - Left Side */}
          <div className="flex-1">
            <div className="text-lg font-semibold text-gray-600 mb-3">
              Current Session
            </div>
            <div className="text-4xl font-mono font-bold text-gray-800 mb-2">
              {formatTime(elapsedTime)}
            </div>
            <div className="text-sm font-medium text-gray-500">
              {isTracking ? "Timer Running" : "Timer Paused"}
            </div>
          </div>

          {/* Divider Line */}
          <div className="h-20 w-px bg-gray-300 mx-4"></div>

          {/* Date Section - Right Side */}
          <div className="flex-1">
            {/* <div className="text-lg font-semibold text-gray-600 mb-3">
              Today's Date
            </div> */}
            <div className="inline-flex flex-col items-center bg-gradient-to-r from-blue-100 to-purple-100 px-6 py-3 rounded-lg border border-gray-200">
              <span className="text-3xl font-bold text-gray-800">
                {currentDate.split(" ")[0]}
              </span>
              <span className="text-base font-semibold text-gray-600 uppercase">
                {currentDate.split(" ")[1]}
              </span>
            </div>
          </div>
        </div>
      </div>
      <form className="space-y-6">
        {/* Activity Type - Horizontal Row */}
        <div>
          <label className="block text-lg font-semibold text-gray-800 mb-4">
            ACTIVITY TYPE
          </label>
          <div className="flex gap-4 justify-between">
            {activityOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleActivityTypeChange(option.value)}
                className={`flex-1 py-4 px-3 rounded-xl text-white font-semibold shadow-lg hover:shadow-xl transition-all bg-gradient-to-r ${option.color}`}
              >
                <span className="mr-2">{option.icon}</span>
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Start & End Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-lg font-semibold text-gray-800 mb-2">
              START TIME
            </label>
            <input
              type="text"
              value={startTime}
              placeholder="--:--"
              readOnly
              className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl bg-gray-50 text-gray-700 text-center font-mono"
            />
          </div>

          <div>
            <label className="block text-lg font-semibold text-gray-800 mb-2">
              END TIME
            </label>
            <input
              type="text"
              value={endTime}
              placeholder="--:--"
              readOnly
              className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl bg-gray-50 text-gray-700 text-center font-mono"
            />
          </div>
        </div>

        {/* Activity Input */}
        <div className="space-y-4">
          <div>
            <label className="block text-lg font-semibold text-gray-800 mb-3">
              ACTIVITY (OPTIONAL)
            </label>
            <input
              type="text"
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              placeholder="What are you working on?"
              className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Add Activity Button */}
          <button
            type="button"
            onClick={handleAddActivity}
            disabled={!isTracking}
            className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 ${
              isTracking
                ? "bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white shadow-lg hover:shadow-xl"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            ➕ Add Activity Now
          </button>
        </div>

        {/* Description */}
        <div>
          <label className="block text-lg font-semibold text-gray-800 mb-3">
            DESCRIPTION
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add details about your activity..."
            rows="3"
            className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
          />
        </div>

        {/* Activity Logs */}
        {activityLogs.length > 0 && (
          <div className="border-2 border-gray-200 rounded-xl p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Activity Log
            </h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {activityLogs.map((log, index) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{getActivityIcon(log.type)}</span>
                    <div>
                      <div className="font-semibold text-gray-800">
                        {log.activity}
                      </div>
                      <div
                        className={`text-sm ${
                          log.endTime
                            ? "text-gray-600"
                            : "text-green-600 font-medium"
                        }`}
                      >
                        {log.startTime}{" "}
                        {log.endTime ? `- ${log.endTime}` : "- Ongoing"}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`text-sm font-medium px-2 py-1 rounded border ${
                      log.endTime
                        ? "text-gray-600 bg-white"
                        : "text-green-700 bg-green-100 border-green-200"
                    }`}
                  >
                    {log.type} {!log.endTime && "⏳"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </form>

      {/* Sticky Action Buttons */}
      <div className="sticky bottom-0 bg-white pt-6 mt-8 border-t border-gray-200">
        <div className="flex gap-4">
          {!isTracking ? (
            <button
              type="button"
              onClick={handleStartTracking}
              className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-4 px-6 rounded-xl font-semibold text-lg transition-colors shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
            >
              {/* <span className="text-xl">▶</span> */}
              <span>Start Tracking</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleDoneForToday}
              className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-4 px-6 rounded-xl font-semibold text-lg transition-colors shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
            >
              {/* <span className="text-xl">⏹️</span> */}
              <span>Done for Today</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleReset}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-4 px-6 rounded-xl font-semibold text-lg transition-colors shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
          >
            {/* <span className="text-xl">🔄</span> */}
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Status Indicator */}
      <div
        className={`mt-6 p-4 rounded-xl text-center font-semibold text-lg ${
          isTracking
            ? "bg-green-100 text-green-800 border-2 border-green-200"
            : "bg-gray-100 text-gray-800 border-2 border-gray-200"
        }`}
      >
        Status: {isTracking ? " Tracking Active" : "Tracking Paused"}
      </div>

      {/* Confirmation Popup */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl border-2 border-gray-200">
            <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
              End Time Tracking?
            </h3>
            <p className="text-gray-600 text-center mb-6">
              Are you sure you want to end your time tracking session for today?
            </p>
            <div className="flex gap-4">
              <button
                onClick={handleCancelEnd}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
              >
                No, Continue
              </button>
              <button
                onClick={handleConfirmEnd}
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
              >
                Yes, End Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeTimeTracker;
