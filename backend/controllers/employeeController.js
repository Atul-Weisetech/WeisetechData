const db = require("../config/db");

// Ensure newer columns exist on legacy databases
let schemaEnsured = false;
const ensureColumnExists = (table, column, definition) => {
  db.query(`SHOW COLUMNS FROM ${table} LIKE ?`, [column], (inspectErr, rows) => {
    if (inspectErr) {
      console.error(`Failed to inspect ${table}.${column}:`, inspectErr);
      return;
    }
    if (!rows || rows.length === 0) {
      db.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`, (alterErr) => {
        if (alterErr) {
          console.error(`Failed to add column ${column} to ${table}:`, alterErr);
        } else {
          console.log(`Added column ${column} to ${table}`);
        }
      });
    }
  });
};

const ensureTableExists = (table, createSql) => {
  db.query(`SHOW TABLES LIKE ?`, [table], (inspectErr, rows) => {
    if (inspectErr) {
      console.error(`Failed to inspect table ${table}:`, inspectErr);
      return;
    }
    if (!rows || rows.length === 0) {
      db.query(createSql, (createErr) => {
        if (createErr) {
          console.error(`Failed to create table ${table}:`, createErr);
        } else {
          console.log(`Created missing table ${table}`);
        }
      });
    }
  });
};

const ensureSchema = () => {
  if (schemaEnsured) return;
  schemaEnsured = true;
  ensureColumnExists("tbl_employee", "designation", "VARCHAR(255)");
  ensureColumnExists("tbl_employee", "is_active", "TINYINT(1) NOT NULL DEFAULT 1");
  ensureColumnExists("tbl_user", "designation", "VARCHAR(255)");
  ensureColumnExists("tbl_user", "is_active", "TINYINT(1) NOT NULL DEFAULT 1");
  ensureTableExists(
    "tbl_employee_leave_request",
    `CREATE TABLE tbl_employee_leave_request (
      id INT AUTO_INCREMENT PRIMARY KEY,
      employee_id INT NOT NULL,
      employee_name VARCHAR(255) NOT NULL,
      from_date DATE NOT NULL,
      to_date DATE NOT NULL,
      number_of_days INT NOT NULL,
      description TEXT,
      status ENUM('0','1','2') DEFAULT '0',
      applied_date DATE,
      reviewed_by VARCHAR(255),
      reviewed_at DATETIME,
      created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_updated_date DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`
  );
  ensureTableExists(
    "tbl_employee_work_from_home",
    `CREATE TABLE tbl_employee_work_from_home (
      id INT AUTO_INCREMENT PRIMARY KEY,
      employee_id INT NOT NULL,
      employee_name VARCHAR(255) NOT NULL,
      from_date DATE NOT NULL,
      to_date DATE NOT NULL,
      number_of_days INT NOT NULL,
      description TEXT,
      status ENUM('0','1','2') DEFAULT '0',
      applied_date DATE,
      reviewed_by VARCHAR(255),
      reviewed_at DATETIME,
      created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_updated_date DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`
  );
  ensureTableExists(
    "tbl_performance_warning",
    `CREATE TABLE tbl_performance_warning (
      id INT AUTO_INCREMENT PRIMARY KEY,
      employee_id INT NOT NULL,
      employee_name VARCHAR(255) NOT NULL,
      overall_notes TEXT,
      created_by VARCHAR(255),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`
  );
  
  ensureTableExists(
    "tbl_performance_warning_type",
    `CREATE TABLE tbl_performance_warning_type (
      id INT AUTO_INCREMENT PRIMARY KEY,
      id_performance_warning INT NOT NULL,
      warning_type VARCHAR(255) NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (id_performance_warning) REFERENCES tbl_performance_warning(id) ON DELETE CASCADE
    )`
  );
  
  // Ensure all columns exist in tbl_performance_warning (in case table was created before schema update)
  ensureColumnExists("tbl_performance_warning", "overall_notes", "TEXT");
  ensureColumnExists("tbl_performance_warning", "created_by", "VARCHAR(255)");
  ensureColumnExists("tbl_performance_warning", "created_at", "DATETIME DEFAULT CURRENT_TIMESTAMP");
  ensureColumnExists("tbl_performance_warning", "updated_at", "DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
};

ensureSchema();

exports.addEmployee = (req, res) => {
  const emp = req.body;

  if (!emp.email_address || !emp.password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const generatedUsername = `${emp.first_name || ""}${emp.last_name || ""}`.toLowerCase();

  // Normalize joining_date if provided in YYYY-MM-DD string format
  if (emp.joining_date && typeof emp.joining_date === "string") {
    const parts = emp.joining_date.split("-");
    emp.joining_date = parseInt(parts.join(""));
  }

  db.query(
    "SELECT 1 FROM tbl_user WHERE email_address = ? AND is_active = TRUE",
    [emp.email_address],
    (err, userResults) => {
      if (err) return res.status(500).json({ error: err.sqlMessage || "Database error" });
      if (userResults.length > 0)
        return res.status(400).json({ error: "Employee already exists" });

      const { password, last_update_date, ...empData } = emp;

      // 1) Create employee row with is_active = true
      const employeeData = {
        ...empData,
        is_active: true
      };

      db.query("INSERT INTO tbl_employee SET ?", employeeData, (err, empResult) => {
        if (err) return res.status(500).json({ error: err.sqlMessage || "Database error" });

        const employeeId = empResult.insertId;

        // 2) Create user row with is_active = true
        db.query(
          "INSERT INTO tbl_user (email_address, password, user_role, username, designation, is_active) VALUES (?, ?, ?, ?, ?, ?)",
          [emp.email_address, emp.password, "2", generatedUsername, emp.designation || null, true],
          (err2, userResult) => {
            if (err2) return res.status(500).json({ error: err2.sqlMessage || "Database error" });

            const userId = userResult.insertId;

            // 3) Try linking user -> employee if schema supports it
            db.query(
              "UPDATE tbl_user SET fk_employee_id = ? WHERE id = ?",
              [employeeId, userId],
              (linkErr1) => {
                if (linkErr1 && linkErr1.code !== "ER_BAD_FIELD_ERROR") {
                  return res.status(500).json({ error: linkErr1.sqlMessage || "Database error" });
                }

                // 4) Try linking employee -> user if schema supports it
                db.query(
                  "UPDATE tbl_employee SET fk_user_id = ? WHERE id = ?",
                  [userId, employeeId],
                  (linkErr2) => {
                    if (linkErr2 && linkErr2.code !== "ER_BAD_FIELD_ERROR") {
                      return res.status(500).json({ error: linkErr2.sqlMessage || "Database error" });
                    }

                    return res.json({
                      message: "Employee added successfully",
                      employee_id: employeeId,
                      user_id: userId,
                    });
                  }
                );
              }
            );
          }
        );
      });
    }
  );
};

exports.getEmployees = (req, res) => {
  const { includeInactive } = req.query;
  
  // First, try to check if is_active column exists by attempting a query with it
  // If it fails, fall back to query without is_active filter
  let query = `
    SELECT 
      id AS employee_id,
      first_name,
      last_name,
      email_address,
      designation,
      city,
      state,
      postal_code,
      salary,
      deduction,
      joining_date,
      address_line_1,
      address_line_2
    FROM tbl_employee
  `;
  
  // Try to include is_active if column exists, otherwise query without it
  const queryWithActive = `
    SELECT 
      id AS employee_id,
      first_name,
      last_name,
      email_address,
      designation,
      city,
      state,
      postal_code,
      salary,
      deduction,
      joining_date,
      address_line_1,
      address_line_2,
      is_active
    FROM tbl_employee
  `;
  
  // Only show active employees by default if is_active column exists
  const whereClause = (!includeInactive || includeInactive === 'false') ? " WHERE is_active = TRUE" : "";
  const fullQueryWithActive = queryWithActive + whereClause;
  const fullQueryWithoutActive = query;

  // Try query with is_active first
  db.query(fullQueryWithActive, (err, rows) => {
    if (err && err.code === 'ER_BAD_FIELD_ERROR' && err.sqlMessage && err.sqlMessage.includes('is_active')) {
      // Column doesn't exist, use query without is_active
      console.log('is_active column not found, fetching all employees without filter');
      db.query(fullQueryWithoutActive, (err2, rows2) => {
        if (err2) {
          console.error('Error fetching employees:', err2);
          return res.status(500).json({ error: err2.sqlMessage || "Database error", details: err2.message });
        }
        console.log(`Fetched ${rows2.length} employees`);
        res.json(rows2);
      });
    } else if (err) {
      console.error('Error fetching employees:', err);
      return res.status(500).json({ error: err.sqlMessage || "Database error", details: err.message });
    } else {
      console.log(`Fetched ${rows.length} employees`);
      res.json(rows);
    }
  });
};

exports.getEmployeeById = (req, res) => {
  const id = req.params.id;
  if (!id) {
    return res.status(400).json({ error: "Employee id is required" });
  }

  const formatJoiningDate = (value) => {
    if (!value) return null;
    if (typeof value === "number") {
      const str = value.toString().padStart(8, "0");
      return `${str.slice(0, 4)}-${str.slice(4, 6)}-${str.slice(6, 8)}`;
    }
    if (typeof value === "string" && /^\d{8}$/.test(value)) {
      return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
    }
    // Assume already YYYY-MM-DD or ISO
    return String(value).slice(0, 10);
  };

  db.query(
    `SELECT 
      id AS employee_id,
      first_name,
      last_name,
      email_address,
      designation,
      joining_date,
      city,
      state,
      postal_code,
      salary,
      deduction,
      is_active
    FROM tbl_employee
    WHERE id = ?`,
    [id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.sqlMessage || "Database error" });
      }
      if (!rows || rows.length === 0) {
        return res.status(404).json({ error: "Employee not found" });
      }
      const employee = rows[0];
      if (employee.joining_date) {
        employee.joining_date = formatJoiningDate(employee.joining_date);
      }
      res.json(employee);
    }
  );
};

exports.updateEmployee = (req, res) => {
  const id = req.params.id;
  const emp = req.body;

  db.query(
    "SELECT * FROM tbl_employee WHERE email_address = ? AND id != ? AND is_active = TRUE",
    [emp.email_address, id],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.sqlMessage || "Database error" });

      if (results.length > 0) {
        return res
          .status(400)
          .json({ error: "Email already in use by another employee" });
      }

      db.query(
        "SELECT email_address FROM tbl_employee WHERE id = ?",
        [id],
        (err, results) => {
          if (err || results.length === 0)
            return res
              .status(500)
              .json({ error: "Employee not found for user update" });

          const oldEmail = results[0].email_address;

          // Ensure joining_date is int format YYYYMMDD
          if (emp.joining_date && typeof emp.joining_date === "string") {
            const parts = emp.joining_date.split("-");
            emp.joining_date = parseInt(parts.join("")); // e.g., 2025-07-11 -> 20250711
          }

          const { last_update_date, ...empData } = emp;

          db.query(
            "UPDATE tbl_employee SET ? WHERE id = ?",
            [empData, id],
            (err) => {
              if (err) return res.status(500).json({ error: err.sqlMessage || "Database error" });

              db.query(
                "UPDATE tbl_user SET email_address = ?, last_update_date = ? WHERE email_address = ?",
                [emp.email_address, emp.last_update_date, oldEmail],
                (err2) => {
                  if (err2) return res.status(500).json({ error: err2.sqlMessage || "Database error" });
                  res.json({
                    message: "Employee and user updated successfully",
                  });
                }
              );
            }
          );
        }
      );
    }
  );
};

// Deactivate employee instead of deleting
exports.deactivateEmployee = (req, res) => {
  const id = req.params.id;

  db.query(
    "SELECT email_address FROM tbl_employee WHERE id = ?",
    [id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.sqlMessage || "Database error" });
      if (result.length === 0)
        return res.status(404).json({ error: "Employee not found" });

      const email = result[0].email_address;

      // Deactivate employee
      db.query(
        "UPDATE tbl_employee SET is_active = FALSE WHERE id = ?", 
        [id], 
        (err) => {
          if (err) return res.status(500).json({ error: err.sqlMessage || "Database error" });

          // Also deactivate user account
          db.query(
            "UPDATE tbl_user SET is_active = FALSE WHERE email_address = ?",
            [email],
            (err2) => {
              if (err2) return res.status(500).json({ error: err2.sqlMessage || "Database error" });
              res.json({
                message: "Employee deactivated successfully",
              });
            }
          );
        }
      );
    }
  );
};

// Reactivate employee if needed
exports.activateEmployee = (req, res) => {
  const id = req.params.id;

  db.query(
    "SELECT email_address FROM tbl_employee WHERE id = ?",
    [id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.sqlMessage || "Database error" });
      if (result.length === 0)
        return res.status(404).json({ error: "Employee not found" });

      const email = result[0].email_address;

      // Activate employee
      db.query(
        "UPDATE tbl_employee SET is_active = TRUE WHERE id = ?", 
        [id], 
        (err) => {
          if (err) return res.status(500).json({ error: err.sqlMessage || "Database error" });

          // Also activate user account
          db.query(
            "UPDATE tbl_user SET is_active = TRUE WHERE email_address = ?",
            [email],
            (err2) => {
              if (err2) return res.status(500).json({ error: err2.sqlMessage || "Database error" });
              res.json({
                message: "Employee activated successfully",
              });
            }
          );
        }
      );
    }
  );
};

// Keep the original delete for admin purposes (optional)
exports.deleteEmployee = (req, res) => {
  const id = req.params.id;

  db.query(
    "SELECT email_address FROM tbl_employee WHERE id = ?",
    [id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.sqlMessage || "Database error" });
      if (result.length === 0)
        return res.status(404).json({ error: "Employee not found" });

      const email = result[0].email_address;

      db.query("DELETE FROM tbl_employee WHERE id = ?", [id], (err) => {
        if (err) return res.status(500).json({ error: err.sqlMessage || "Database error" });

        db.query(
          "DELETE FROM tbl_user WHERE email_address = ?",
          [email],
          (err2) => {
            if (err2) return res.status(500).json({ error: err2.sqlMessage || "Database error" });
            res.json({
              message: "Employee and associated user deleted successfully",
            });
          }
        );
      });
    }
  );
};

exports.createPayroll = (req, res) => {
  const {
    fk_employee_id,
    payroll_amount,
    payroll_date,
    pay_month,
    mode_of_payment,
    breakdown,
  } = req.body;

  db.query(
    "INSERT INTO tbl_employee_payroll (fk_employee_id, payroll_amount, payroll_date, pay_month, mode_of_payment) VALUES (?, ?, ?, ?, ?)",
    [fk_employee_id, payroll_amount, payroll_date, pay_month, mode_of_payment],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.sqlMessage || "Database error" });

      const payrollId = result.insertId;
      const breakdownItems = Array.isArray(breakdown) ? breakdown : [];
      if (breakdownItems.length === 0) {
        return res.json({ message: "Payroll created successfully" });
      }

      db.query(`SHOW COLUMNS FROM \`tbl_payroll_breakdown\` LIKE 'category'`, (colErr, cols) => {
        if (colErr) return res.status(500).json({ error: colErr.sqlMessage || "Database error" });
        const hasCategory = !!(cols && cols.length);
        const breakdownData = breakdownItems.map((item) => [
          payrollId,
          item.amount ?? 0,
          item.type ?? null,
          item.category ?? (item.is_earning ? 1 : 2),
        ]);

        const sql = hasCategory
          ? "INSERT INTO tbl_payroll_breakdown (fk_payroll_id, amount, type, category) VALUES ?"
          : "INSERT INTO tbl_payroll_breakdown (fk_payroll_id, amount, type, is_earning) VALUES ?";
        const values = hasCategory
          ? breakdownData
          : breakdownData.map(([pid, amt, typ, cat]) => [pid, amt, typ, cat === 1 ? 1 : 0]);

        db.query(
          sql,
          [values],
          (err2) => {
            if (err2) return res.status(500).json({ error: err2.sqlMessage || "Database error" });
            res.json({ message: "Payroll created successfully" });
          }
        );
      });
    }
  );
};

// Get payrolls for a specific employee
exports.getEmployeePayrolls = (req, res) => {
  const employeeId = req.params.id;
  
  db.query(
    `SELECT * FROM tbl_employee_payroll WHERE fk_employee_id = ? ORDER BY payroll_date DESC`,
    [employeeId],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.sqlMessage || "Database error" });
      res.json(results);
    }
  );
};

// Get payroll breakdown for a specific payroll
exports.getPayrollBreakdown = (req, res) => {
  const payrollId = req.params.id;
  
  db.query(
    `SELECT * FROM tbl_payroll_breakdown WHERE fk_payroll_id = ?`,
    [payrollId],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.sqlMessage || "Database error" });
      res.json(results);
    }
  );
};
