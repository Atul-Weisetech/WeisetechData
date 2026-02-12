const express = require("express");
const router = express.Router();
const {
  clockIn,
  clockOut,
  getStatus,
  getDayReport,
  getMonthReport
} = require("../controllers/attendanceController");

router.post("/clock-in", clockIn);
router.post("/clock-out", clockOut);
router.get("/status/:empl_id", getStatus);
router.post("/day-report", getDayReport);
router.post("/month-report", getMonthReport);

module.exports = router;
