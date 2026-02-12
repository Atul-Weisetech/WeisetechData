const db = require('../config/db');

// Add HR with role = 1 (HR)
exports.addHR = (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  db.query(
    'SELECT * FROM tbl_user WHERE email_address = ?',
    [normalizedEmail],
    (err, results) => {
      if (err) return res.status(500).json({ error: err?.sqlMessage || 'Database error' });
      if (results.length > 0) return res.status(400).json({ error: 'HR already exists' });

      db.query(
        'INSERT INTO tbl_user (email_address, password, user_role) VALUES (?, ?, ?)',
        [normalizedEmail, String(password).trim(), 1], // 1 = HR
        (err2) => {
          if (err2) return res.status(500).json({ error: err2?.sqlMessage || 'Database error' });
          res.json({ message: 'HR added successfully' });
        }
      );
    }
  );
};
  
// Login: allow email or username as identifier
exports.login = (req, res) => {
  const { email, password } = req.body;
  const identifier = String(email || '').trim();
  const normalizedIdentifier = identifier.toLowerCase();
  const normalizedPassword = String(password || '').trim();

  if (!identifier || !normalizedPassword) {
    return res.status(400).json({ error: 'Email/ID and password are required' });
  }

  const findUserSql = `
    SELECT * FROM tbl_user
    WHERE email_address = ? OR username = ?
    LIMIT 1
  `;

  db.query(findUserSql, [normalizedIdentifier, normalizedIdentifier], (err, results) => {
    if (err) {
      console.error('Login query error:', err);
      return res.status(500).json({ error: err?.sqlMessage || 'Database error', details: err.message });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = results[0];

    if (String(user.password) !== normalizedPassword) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    // Map numeric role to string
    const roleMap = { 0: 'admin', 1: 'hr', 2: 'employee' };

    // Join employee by email address (no fk_employee_id column in tbl_user)
    const employeeJoinSqlByEmail = `
      SELECT e.id AS employee_id, e.first_name, e.last_name, e.designation AS job_title
      FROM tbl_employee e
      WHERE e.email_address = ?
      LIMIT 1
    `;

    const joinParams = [user.email_address];
    const joinSql = employeeJoinSqlByEmail;

    db.query(joinSql, joinParams, (empErr, empRows) => {
      if (empErr) {
        console.error('Employee join query error:', empErr);
        // Continue with login even if employee join fails - return null for employee
        return res.json({
          message: 'Login successful',
          user: user,
          role: roleMap[user.user_role] || 'unknown',
          employee: null,
        });
      }

      const employee = Array.isArray(empRows) && empRows.length > 0 ? empRows[0] : null;

      return res.json({
        message: 'Login successful',
        user: user,
        role: roleMap[user.user_role] || 'unknown',
        employee: employee
          ? {
              id: employee.employee_id,
              first_name: employee.first_name,
              last_name: employee.last_name,
              designation: employee.job_title,
            }
          : null,
      });
    });
  });
};

      