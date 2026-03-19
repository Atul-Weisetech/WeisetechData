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

// ---------------------- DAILY RECORDS (clock-in + clock-out per day) -------
exports.getDailyRecords = async (req, res) => {
  try {
    const { empl_id } = req.params;
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year  = parseInt(req.query.year)  || new Date().getFullYear();

    const start = Math.floor(new Date(year, month - 1, 1).getTime() / 1000);
    const end   = Math.floor(new Date(year, month, 1).getTime() / 1000);

    const [rows] = await db.promise().query(
      `SELECT date, type, working_hours FROM tbl_attendance
       WHERE empl_id = ? AND date BETWEEN ? AND ?
       ORDER BY date ASC`,
      [empl_id, start, end]
    );

    const dayMap = {};
    rows.forEach((r) => {
      const day = new Date(r.date * 1000).toISOString().split("T")[0];
      if (!dayMap[day]) dayMap[day] = { clock_in: null, clock_out: null, hours: 0 };
      if (r.type === 0 && !dayMap[day].clock_in) dayMap[day].clock_in = r.date;
      if (r.type === 1) { dayMap[day].clock_out = r.date; dayMap[day].hours = r.working_hours || 0; }
    });

    const fmt = (ts) => ts ? new Date(ts * 1000).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }) : null;

    const records = Object.entries(dayMap)
      .sort(([a], [b]) => (a < b ? 1 : -1))
      .map(([date, v]) => ({ date, clock_in: fmt(v.clock_in), clock_out: fmt(v.clock_out), hours: Number((v.hours || 0).toFixed(2)) }));

    const total_hours = Number(records.reduce((s, r) => s + r.hours, 0).toFixed(2));
    return res.json({ success: true, records, total_hours });
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
