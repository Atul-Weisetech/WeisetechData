import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  Briefcase,
  Users,
  FolderOpen,
  Coffee,
  Clock,
  Play,
  Square,
  RotateCcw,
  Plus,
  CheckCircle,
  X,
  MapPin,
} from "lucide-react";
import API_BASE from "../config";

const activityOptions = [
  {
    value: "Working time",
    label: "Working",
    Icon: Briefcase,
    selectedBg: "bg-primary-600",
    selectedText: "text-white",
    selectedBorder: "border-primary-600",
    idleBg: "bg-primary-50",
    idleText: "text-primary-700",
    idleBorder: "border-primary-200",
    dotColor: "bg-primary-500",
  },
  {
    value: "Meeting",
    label: "Meeting",
    Icon: Users,
    selectedBg: "bg-purple-600",
    selectedText: "text-white",
    selectedBorder: "border-purple-600",
    idleBg: "bg-purple-50",
    idleText: "text-purple-700",
    idleBorder: "border-purple-200",
    dotColor: "bg-purple-500",
  },
  {
    value: "Project block",
    label: "Project",
    Icon: FolderOpen,
    selectedBg: "bg-green-600",
    selectedText: "text-white",
    selectedBorder: "border-green-600",
    idleBg: "bg-green-50",
    idleText: "text-green-700",
    idleBorder: "border-green-200",
    dotColor: "bg-green-500",
  },
  {
    value: "Break",
    label: "Break",
    Icon: Coffee,
    selectedBg: "bg-orange-500",
    selectedText: "text-white",
    selectedBorder: "border-orange-500",
    idleBg: "bg-orange-50",
    idleText: "text-orange-700",
    idleBorder: "border-orange-200",
    dotColor: "bg-orange-500",
  },
];

const getActivityOption = (type) =>
  activityOptions.find((o) => o.value === type) || activityOptions[0];

const EmployeeTimeTracker = ({ onClose, initialTimerState, onTimerUpdate }) => {
  const [isTracking, setIsTracking] = useState(initialTimerState?.isTracking || false);
  const [startTime, setStartTime] = useState(initialTimerState?.startTime || "");
  const [endTime, setEndTime] = useState("");
  const [activityType, setActivityType] = useState(initialTimerState?.currentActivityType || "Working time");
  const [activity, setActivity] = useState("");
  const [description, setDescription] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [elapsedTime, setElapsedTime] = useState(initialTimerState?.elapsedTime || 0);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [activityLogs, setActivityLogs] = useState(initialTimerState?.activityLogs || []);
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [locMessage, setLocMessage] = useState("");

  useEffect(() => {
    const now = new Date();
    setCurrentDate(`${now.getDate()} ${now.toLocaleString("en", { month: "short" })}`);
  }, []);

  const stateRef = useRef({});
  stateRef.current = { isTracking, elapsedTime, startTime, activityLogs, activityType };

  useEffect(() => {
    if (!isTracking) return;
    const iv = setInterval(() => setElapsedTime((p) => p + 1), 1000);
    return () => clearInterval(iv);
  }, [isTracking]);

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

  const updateParentTimer = (updates) => {
    if (onTimerUpdate) {
      onTimerUpdate({
        isTracking,
        elapsedTime,
        startTime,
        activityLogs,
        currentActivityType: activityType,
        lastUpdate: Date.now(),
        ...updates,
      });
    }
  };

  const getCurrentTimeString = () => new Date().toTimeString().slice(0, 5);

  const handleActivityTypeChange = (val) => {
    setActivityType(val);
    updateParentTimer({ currentActivityType: val });
  };

  const getLocationOnce = () =>
    new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });

  const callClockIn = async () => {
    try {
      const empl_id = parseInt(localStorage.getItem("id"), 10);
      let latVal = latitude, lonVal = longitude;
      if (latVal == null || lonVal == null) {
        const loc = await getLocationOnce();
        if (loc) { latVal = loc.lat; lonVal = loc.lon; setLatitude(latVal); setLongitude(lonVal); }
      }
      const res = await axios.post(`${API_BASE}/api/attendance/clock-in`, { empl_id, lat: latVal, log: lonVal });
      return res?.data;
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to record clock-in");
    }
  };

  const callClockOut = async () => {
    try {
      const empl_id = parseInt(localStorage.getItem("id"), 10);
      let latVal = latitude, lonVal = longitude;
      if (latVal == null || lonVal == null) {
        const loc = await getLocationOnce();
        if (loc) { latVal = loc.lat; lonVal = loc.lon; setLatitude(latVal); setLongitude(lonVal); }
      }
      const res = await axios.post(`${API_BASE}/api/attendance/clock-out`, { empl_id, lat: latVal, log: lonVal });
      return res?.data;
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to record clock-out");
      return null;
    }
  };

  const handleStartTracking = async () => {
    const timeString = getCurrentTimeString();
    setStartTime(timeString);
    setIsTracking(true);
    setEndTime("");
    updateParentTimer({ isTracking: true, startTime: timeString, elapsedTime: 0 });
    if (latitude == null || longitude == null) {
      const loc = await getLocationOnce();
      if (loc) { setLatitude(loc.lat); setLongitude(loc.lon); }
    }
    await callClockIn();
  };

  const handleDoneForToday = () => setShowConfirmation(true);

  const handleConfirmEnd = async () => {
    const timeString = getCurrentTimeString();
    setEndTime(timeString);
    let finalLogs = [...activityLogs];
    if (finalLogs.length > 0 && !finalLogs[finalLogs.length - 1].endTime) {
      finalLogs[finalLogs.length - 1] = { ...finalLogs[finalLogs.length - 1], endTime: timeString };
      setActivityLogs(finalLogs);
      updateParentTimer({ activityLogs: finalLogs });
    }
    setIsTracking(false);
    setShowConfirmation(false);
    if (latitude == null || longitude == null) {
      const loc = await getLocationOnce();
      if (loc) { setLatitude(loc.lat); setLongitude(loc.lon); }
    }
    const result = await callClockOut();
    handleSubmitData(result?.working_hours);
  };

  const handleCancelEnd = () => setShowConfirmation(false);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600), m = Math.floor((seconds % 3600) / 60), s = seconds % 60;
    const p = (n) => n.toString().padStart(2, "0");
    return `${p(h)}:${p(m)}:${p(s)}`;
  };

  const handleSubmitData = (workedHours) => {
    toast.success(
      workedHours != null
        ? `Time tracking saved. Worked hours: ${workedHours}h`
        : "Time tracking completed and saved!"
    );
    handleReset();
    if (onClose) onClose();
  };

  const handleReset = () => {
    setIsTracking(false);
    setStartTime("");
    setEndTime("");
    setActivityType("Working time");
    setActivity("");
    setDescription("");
    setElapsedTime(0);
    setActivityLogs([]);
    updateParentTimer({ isTracking: false, elapsedTime: 0, startTime: "", activityLogs: [], currentActivityType: "Working time" });
    if (onClose) onClose();
  };

  const handleAddActivity = () => {
    if (!isTracking) return;
    const timeString = getCurrentTimeString();
    let finalLogs = [...activityLogs];
    if (finalLogs.length > 0 && !finalLogs[finalLogs.length - 1].endTime) {
      finalLogs[finalLogs.length - 1] = { ...finalLogs[finalLogs.length - 1], endTime: timeString };
    }
    finalLogs.push({ id: Date.now(), type: activityType, activity: activity || activityType, description, startTime: timeString, endTime: "" });
    setActivityLogs(finalLogs);
    updateParentTimer({ activityLogs: finalLogs });
    setActivity("");
    setDescription("");
  };

  useEffect(() => {
    let watchId = null;
    if (isTracking && navigator.geolocation) {
      setLocMessage("Tracking location…");
      watchId = navigator.geolocation.watchPosition(
        (pos) => { setLatitude(pos.coords.latitude); setLongitude(pos.coords.longitude); },
        () => setLocMessage("Location watch failed."),
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
      );
    }
    return () => { if (watchId && navigator.geolocation) navigator.geolocation.clearWatch(watchId); };
  }, [isTracking]);

  const selectedOpt = getActivityOption(activityType);

  return (
    <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden max-h-[92vh] flex flex-col">

      {/* Modal Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-400 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
            <Clock size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Time Tracker</h2>
            <p className="text-xs text-primary-100">{currentDate} · {isTracking ? "Session active" : "Not tracking"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isTracking && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-white bg-white/20 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse" />
              Live
            </span>
          )}
          {onClose && (
            <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="overflow-y-auto flex-1 p-5 space-y-5">

        {/* Timer Display */}
        <div className={`rounded-2xl p-5 flex items-center justify-between border-2 transition-colors ${
          isTracking ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
        }`}>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Current Session</p>
            <p className={`text-4xl font-mono font-bold ${isTracking ? "text-green-700" : "text-gray-500"}`}>
              {formatTime(elapsedTime)}
            </p>
            <p className={`text-xs font-medium mt-1 ${isTracking ? "text-green-600" : "text-gray-400"}`}>
              {isTracking ? `Started at ${startTime}` : "Timer paused"}
            </p>
          </div>
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
            isTracking ? "bg-green-100" : "bg-gray-100"
          }`}>
            <Clock size={28} className={isTracking ? "text-green-500" : "text-gray-400"} />
          </div>
        </div>

        {/* Activity Type Selection */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Activity Type</p>
          <div className="grid grid-cols-4 gap-2">
            {activityOptions.map((opt) => {
              const isSelected = activityType === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleActivityTypeChange(opt.value)}
                  className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 font-medium text-xs transition-all ${
                    isSelected
                      ? `${opt.selectedBg} ${opt.selectedText} ${opt.selectedBorder} shadow-md scale-105`
                      : `${opt.idleBg} ${opt.idleText} ${opt.idleBorder} hover:scale-102`
                  }`}
                >
                  <opt.Icon size={18} />
                  <span>{opt.label}</span>
                  {isSelected && <span className={`w-1.5 h-1.5 rounded-full bg-white/70`} />}
                </button>
              );
            })}
          </div>
          {/* Selected indicator */}
          <div className={`mt-2 flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg ${selectedOpt.idleBg} ${selectedOpt.idleText}`}>
            <selectedOpt.Icon size={12} />
            <span>Currently: <strong>{selectedOpt.label}</strong></span>
          </div>
        </div>

        {/* Start / End Time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Start Time</p>
            <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-xl">
              <Clock size={14} className="text-gray-400" />
              <span className="font-mono text-sm font-semibold text-gray-700">{startTime || "--:--"}</span>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">End Time</p>
            <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-xl">
              <Clock size={14} className="text-gray-400" />
              <span className="font-mono text-sm font-semibold text-gray-700">{endTime || "--:--"}</span>
            </div>
          </div>
        </div>

        {/* Activity Input */}
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Activity <span className="normal-case font-normal text-gray-400">(optional)</span></p>
            <input
              type="text"
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              placeholder="What are you working on?"
              className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-colors"
            />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Description</p>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details about your activity..."
              rows={2}
              className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-colors resize-none"
            />
          </div>
          <button
            type="button"
            onClick={handleAddActivity}
            disabled={!isTracking}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              isTracking
                ? "bg-primary-600 hover:bg-primary-700 text-white shadow-md hover:shadow-lg"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            <Plus size={16} /> Add Activity
          </button>
        </div>

        {/* Location Status */}
        {locMessage && (
          <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
            <MapPin size={12} className="text-gray-400 shrink-0" />
            {locMessage}
          </div>
        )}

        {/* Activity Log */}
        {activityLogs.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Activity Log</p>
            <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
              {activityLogs.map((log) => {
                const opt = getActivityOption(log.type);
                return (
                  <div key={log.id} className={`flex items-center justify-between p-3 rounded-xl border ${opt.idleBg} ${opt.idleBorder}`}>
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-lg ${opt.selectedBg} flex items-center justify-center shrink-0`}>
                        <opt.Icon size={13} className="text-white" />
                      </div>
                      <div>
                        <p className={`text-xs font-semibold ${opt.idleText}`}>{log.activity}</p>
                        <p className="text-xs text-gray-500">
                          {log.startTime} {log.endTime ? `→ ${log.endTime}` : "→ Ongoing"}
                        </p>
                      </div>
                    </div>
                    {!log.endTime ? (
                      <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded-full">Live</span>
                    ) : (
                      <CheckCircle size={14} className="text-gray-400" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="shrink-0 border-t border-gray-100 bg-gray-50 px-5 py-4">
        {/* Status bar */}
        <div className={`flex items-center gap-2 text-xs font-medium mb-3 px-3 py-2 rounded-lg ${
          isTracking ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
        }`}>
          <span className={`w-2 h-2 rounded-full ${isTracking ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
          Status: {isTracking ? "Tracking Active" : "Tracking Paused"}
        </div>
        <div className="flex gap-3">
          {!isTracking ? (
            <button
              type="button"
              onClick={handleStartTracking}
              className="flex-1 flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-md"
            >
              <Play size={15} /> Start Tracking
            </button>
          ) : (
            <button
              type="button"
              onClick={handleDoneForToday}
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-md"
            >
              <Square size={15} /> Done for Today
            </button>
          )}
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white hover:bg-gray-100 text-gray-600 border border-gray-200 rounded-xl font-semibold text-sm transition-colors"
          >
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 max-w-sm w-full">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <Clock size={22} className="text-amber-600" />
            </div>
            <h3 className="text-base font-bold text-gray-900 text-center mb-1">End Session?</h3>
            <p className="text-sm text-gray-500 text-center mb-5">
              Are you sure you want to end your time tracking session for today?
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleCancelEnd}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors"
              >
                Continue
              </button>
              <button
                onClick={handleConfirmEnd}
                className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm transition-colors"
              >
                End Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeTimeTracker;
