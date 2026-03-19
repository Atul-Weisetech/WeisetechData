const express = require("express");
const router = express.Router();
const {
  clockIn,
  clockOut,
  getStatus,
  getDayReport,
  getMonthReport,
  getDailyRecords,
} = require("../controllers/attendanceController");

router.post("/clock-in", clockIn);
router.post("/clock-out", clockOut);
router.get("/status/:empl_id", getStatus);
router.post("/day-report", getDayReport);
router.post("/month-report", getMonthReport);
router.get("/records/:empl_id", getDailyRecords);

module.exports = router;
