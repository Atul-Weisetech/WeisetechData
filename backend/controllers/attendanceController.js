const db = require("../config/db");

// Helper: calculate hours
function calculateHours(start, end) {
  const diff = (end - start) / 3600; // seconds → hours
  return Number(diff.toFixed(2));
}

// ---------------------- CLOCK-IN ---------------------------
exports.clockIn = async (req, res) => {
  try {
    const { empl_id, lat, log } = req.body;
    const now = Math.floor(Date.now() / 1000);

    // Check already IN for today
    const checkIn = await db.promise().query(`
      SELECT * FROM tbl_attendance
      WHERE empl_id = ? AND type = 0
      ORDER BY id DESC
      LIMIT 1
    `, [empl_id]);

    const lastIn = checkIn[0][0];

    if (lastIn) {
      // Check last OUT
      const lastOutData = await db.promise().query(`
        SELECT * FROM tbl_attendance
        WHERE empl_id = ? AND type = 1
        ORDER BY id DESC LIMIT 1
      `, [empl_id]);

      const lastOut = lastOutData[0][0];

      if (!lastOut || lastOut.date < lastIn.date) {
        return res.json({
          success: false,
          message: "Already clocked-in. Please clock-out first."
        });
      }
    }

    // Insert new IN record
    await db.promise().query(`
      INSERT INTO tbl_attendance (empl_id, date, type, lat, log, created, updated)
      VALUES (?, ?, 0, ?, ?, ?, ?)
    `, [empl_id, now, lat, log, now, now]);

    return res.json({
      success: true,
      message: "Clock-in recorded",
      clock_in_time: now
    });

  } catch (err) {
    console.log(err);
    return res.json({ success: false, message: "Server error" });
  }
};

// ---------------------- CLOCK-OUT ---------------------------
exports.clockOut = async (req, res) => {
  try {
    const { empl_id, lat, log } = req.body;
    const now = Math.floor(Date.now() / 1000);

    // Check last IN
    const lastInData = await db.promise().query(`
      SELECT * FROM tbl_attendance
      WHERE empl_id = ? AND type = 0
      ORDER BY id DESC LIMIT 1
    `, [empl_id]);

    const lastIn = lastInData[0][0];

    if (!lastIn) {
      return res.json({
        success: false,
        message: "No active clock-in found"
      });
    }

    // Check last OUT
    const lastOutData = await db.promise().query(`
      SELECT * FROM tbl_attendance
      WHERE empl_id = ? AND type = 1
      ORDER BY id DESC LIMIT 1
    `, [empl_id]);

    const lastOut = lastOutData[0][0];

    if (lastOut && lastOut.date > lastIn.date) {
      return res.json({
        success: false,
        message: "Already clocked-out"
      });
    }

    // CLOCK-OUT
  const hours = calculateHours(lastIn.date, now);

  // Insert OUT record and also store worked hours
  await db.promise().query(`
    INSERT INTO tbl_attendance (empl_id, date, type, lat, log, created, updated, working_hours)
    VALUES (?, ?, 1, ?, ?, ?, ?, ?)
  `, [empl_id, now, lat, log, now, now, hours]);

  // Also update working hours for the matching IN entry
  await db.promise().query(`
    UPDATE tbl_attendance SET working_hours = ?
    WHERE id = ?
  `, [hours, lastIn.id]);

  return res.json({
    success: true,
    message: "Clock-out recorded",
    working_hours: hours
  });

  } catch (err) {
    console.log(err);
    return res.json({ success: false, message: "Server error" });
  }
};

// ---------------------- GET STATUS ---------------------------
exports.getStatus = async (req, res) => {
  try {
    const { empl_id } = req.params;

    const lastInData = await db.promise().query(`
      SELECT * FROM tbl_attendance
      WHERE empl_id = ? AND type = 0
      ORDER BY id DESC LIMIT 1
    `, [empl_id]);

    const lastIn = lastInData[0][0];

    if (!lastIn) {
      return res.json({ success: true, running: false });
    }

    const lastOutData = await db.promise().query(`
      SELECT * FROM tbl_attendance
      WHERE empl_id = ? AND type = 1
      ORDER BY id DESC LIMIT 1
    `, [empl_id]);

    const lastOut = lastOutData[0][0];

    const running = !lastOut || lastOut.date < lastIn.date;

    return res.json({
      success: true,
      running,
      clock_in_time: running ? lastIn.date : null
    });

  } catch (err) {
    console.log(err);
    return res.json({ success: false, message: "Server error" });
  }
};

// ---------------------- DAY REPORT ---------------------------
exports.getDayReport = async (req, res) => {
  try {
    const { empl_id, date } = req.body;

    const dayStart = Math.floor(new Date(date + " 00:00:00").getTime() / 1000);
    const dayEnd = dayStart + 86400;

    const rows = await db.promise().query(`
      SELECT working_hours FROM tbl_attendance
      WHERE empl_id = ? AND date BETWEEN ? AND ? AND type = 0
    `, [empl_id, dayStart, dayEnd]);

    const result = rows[0];
    const total = result.reduce((sum, r) => sum + (r.working_hours || 0), 0);

    return res.json({
      success: true,
      date,
      total_working_hours: Number(total.toFixed(2))
    });

  } catch (err) {
    console.log(err);
    return res.json({ success: false, message: "Server error" });
  }
};

// ---------------------- MONTH REPORT ---------------------------
exports.getMonthReport = async (req, res) => {
  try {
    const { empl_id, month, year } = req.body;

    const start = Math.floor(new Date(year, month - 1, 1).getTime() / 1000);
    const end = Math.floor(new Date(year, month, 1).getTime() / 1000);

    const rows = await db.promise().query(`
      SELECT date, working_hours FROM tbl_attendance
      WHERE empl_id = ? AND date BETWEEN ? AND ? AND type = 0
    `, [empl_id, start, end]);

    const result = rows[0];

    const total = result.reduce((sum, r) => sum + (r.working_hours || 0), 0);

    return res.json({
      success: true,
      empl_id,
      month,
      year,
      total_hours: Number(total.toFixed(2)),
      days: result.map(r => ({
        date: new Date(r.date * 1000).toISOString().split("T")[0],
        hours: r.working_hours
      }))
    });

  } catch (err) {
    console.log(err);
    return res.json({ success: false, message: "Server error" });
  }
};
