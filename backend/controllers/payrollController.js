const db = require("../config/db");
const { sendPayrollEmail } = require("../services/emailService");

const ensureBreakdownCategory = () => {
  // Ensure table exists first
  db.query(`SHOW TABLES LIKE ?`, ["tbl_payroll_breakdown"], (tableErr, tables) => {
    if (tableErr) return;
    if (!tables || tables.length === 0) return; // table missing; skip
    // Ensure column exists
    db.query(`SHOW COLUMNS FROM \`tbl_payroll_breakdown\` LIKE ?`, ["category"], (colErr, cols) => {
      if (colErr) return;
      if (!cols || cols.length === 0) {
        db.query(
          "ALTER TABLE \`tbl_payroll_breakdown\` ADD COLUMN \`category\` TINYINT(1) NOT NULL DEFAULT 1",
          () => {}
        );
      }
    });
  });
};

ensureBreakdownCategory();

exports.createPayroll = (req, res) => {
  const {
    fk_employee_id,
    payroll_amount,
    payroll_date,
    pay_month,
    mode_of_payment,
    is_published,
  } = req.body;

  if (
    !fk_employee_id ||
    !payroll_amount ||
    !payroll_date ||
    !pay_month ||
    !mode_of_payment
  ) {
    return res.status(400).json({ message: "Please fill all fields" });
  }

  const query = `
    INSERT INTO tbl_employee_payroll 
      (fk_employee_id, payroll_amount, payroll_date, pay_month, mode_of_payment, is_published)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(
    query,
    [
      fk_employee_id,
      payroll_amount,
      payroll_date,
      pay_month, // Use frontend value directly
      mode_of_payment,
      is_published ?? false,
    ],
    (err, result) => {
      if (err) {
        console.error("Payroll insert failed:", err);
        return res
          .status(500)
          .json({ message: "Error in adding payroll", error: err });
      }

      console.log("Payroll insert successful");
      return res.status(201).json({ message: "Payroll added successfully" });
    }
  );
};

exports.getAllPayrolls = (req, res) => {
  const query = `
    SELECT p.*, e.first_name, e.last_name, e.email_address
    FROM tbl_employee_payroll p
    JOIN tbl_employee e ON p.fk_employee_id = e.id
    ORDER BY p.payroll_date DESC
  `;

  db.query(query, (err, result) => {
    if (err) {
      console.error('Error fetching payrolls:', err);
      return res
        .status(500)
        .json({ message: "Error fetching payrolls", error: err.sqlMessage || err.message, details: err });
    }
    console.log(`Fetched ${result.length} payrolls`);
    return res.status(200).json(result);
  });
};

// GET /api/payrolls/published?month=January&year=2025
exports.getPublishedPayrollsByMonthYear = (req, res) => {
  const { month, year } = req.query;

  if (!month || !year) {
    return res.status(400).json({ message: "month and year are required" });
  }

  const monthKey = `${month} ${year}`; // matches pay_month stored like "January 2025"

  // Include published rows if either pay_month equals the key OR payroll_date falls in that month/year
  const query = `
    SELECT p.*, e.first_name, e.last_name, e.email_address,
           EXISTS(
             SELECT 1 FROM tbl_payroll_breakdown b WHERE b.fk_payroll_id = p.id
           ) AS has_breakdown
    FROM tbl_employee_payroll p
    JOIN tbl_employee e ON p.fk_employee_id = e.id
    WHERE p.is_published = 1
      AND (
        p.pay_month = ?
        OR (
          MONTH(p.payroll_date) = MONTH(STR_TO_DATE(CONCAT('1 ', ?, ' ', ?), '%e %M %Y'))
          AND YEAR(p.payroll_date) = ?
        )
      )
    ORDER BY p.payroll_date DESC
  `;

  const params = [monthKey, month, year, year];

  db.query(query, params, (err, results) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "Error fetching published payrolls", error: err });
    }
    return res.status(200).json(results);
  });
};

exports.getPayrollById = (req, res) => {
  const id = req.params.id;
  console.log(id);

  db.query(
    "SELECT * FROM tbl_employee_payroll WHERE id = ?",
    [id],
    (err, result) => {
      if (err)
        return res
          .status(500)
          .json({ message: "Error fetching payroll", error: err });
      if (result.length === 0)
        return res.status(404).json({ message: "Payroll not found" });
      return res.status(200).json(result[0]);
    }
  );
};

exports.updatePayroll = (req, res) => {
  const id = req.params.id;
  const {
    fk_employee_id,
    payroll_amount,
    payroll_date,
    pay_month,
    mode_of_payment,
    is_published,
  } = req.body;

  const query = `
    UPDATE tbl_employee_payroll 
    SET fk_employee_id=?, payroll_amount=?, payroll_date=?, pay_month=?, mode_of_payment=?, is_published=?
    WHERE id = ?
  `;

  db.query(
    query,
    [
      fk_employee_id,
      payroll_amount,
      payroll_date,
      pay_month,
      mode_of_payment,
      is_published,
      id,
    ],
    (err, result) => {
      if (err) {
        console.error(err);
        return res
          .status(500)
          .json({ message: "Error updating payroll", error: err });
      }
      return res.status(200).json({ message: "Payroll updated successfully" });
    }
  );
};

exports.deletePayroll = (req, res) => {
  const id = req.params.id;
  db.query(
    "DELETE FROM tbl_employee_payroll WHERE id = ?",
    [id],
    (err, result) => {
      if (err)
        return res
          .status(500)
          .json({ message: "Error deleting payroll", error: err });
      return res.status(200).json({ message: "Payroll deleted successfully" });
    }
  );
};

exports.publishPayroll = (req, res) => {
  const { id } = req.params;
  console.log("Publishing payroll for ID:", id);

  const query = `
    SELECT p.*, e.email_address, e.first_name, e.last_name, e.designation
    FROM tbl_employee_payroll p
    JOIN tbl_employee e ON p.fk_employee_id = e.id
    WHERE p.id = ?
  `;

  db.query(query, [id], (err, result) => {
    if (err || result.length === 0) {
      return res
        .status(500)
        .json({ message: "Payroll not found or error", error: err });
    }

    const payroll = result[0];

    db.query(
      "UPDATE tbl_employee_payroll SET is_published = 1 WHERE id = ?",
      [id],
      async (err2) => {
        if (err2) {
          return res
            .status(500)
            .json({ message: "Error updating payroll", error: err2 });
        }

        const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";
        const employeeName = `${cap(payroll.first_name)} ${cap(payroll.last_name)}`.trim();

        const { success, error: mailErr } = await sendPayrollEmail({
          toEmail: payroll.email_address,
          employeeName,
          payMonth: payroll.pay_month,
          amount: payroll.payroll_amount,
          payDate: payroll.payroll_date,
          modeOfPayment: payroll.mode_of_payment,
          designation: payroll.designation || null,
        });

        if (!success) {
          return res.status(201).json({
            message: "Payroll published, but email could not be sent.",
            error: mailErr?.message,
          });
        }

        return res.status(200).json({
          message: "Payroll published and email sent successfully!",
        });
      }
    );
  });
};

exports.publishAllForMonth = (req, res) => {
  const { monthKey } = req.params;

  const query = `
    SELECT p.*, e.email_address, e.first_name, e.last_name, e.designation
    FROM tbl_employee_payroll p
    JOIN tbl_employee e ON p.fk_employee_id = e.id
    WHERE p.pay_month = ? AND p.is_published = 0
  `;

  db.query(query, [monthKey], async (err, results) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "Error fetching payrolls", error: err });
    }

    if (results.length === 0) {
      return res
        .status(200)
        .json({ message: "No unpublished payrolls found for this month." });
    }

    const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";
    let successCount = 0;
    let emailFailCount = 0;
    let dbFailCount = 0;

    for (const payroll of results) {
      try {
        // Mark as published
        await new Promise((resolve, reject) => {
          db.query(
            "UPDATE tbl_employee_payroll SET is_published = 1 WHERE id = ?",
            [payroll.id],
            (err2) => (err2 ? reject(err2) : resolve())
          );
        });

        // Send themed email
        const employeeName = `${cap(payroll.first_name)} ${cap(payroll.last_name)}`.trim();
        const { success } = await sendPayrollEmail({
          toEmail: payroll.email_address,
          employeeName,
          payMonth: payroll.pay_month,
          amount: payroll.payroll_amount,
          payDate: payroll.payroll_date,
          modeOfPayment: payroll.mode_of_payment,
          designation: payroll.designation || null,
        });

        if (!success) emailFailCount++;
        successCount++;
      } catch (err) {
        console.error("Error processing payroll ID:", payroll.id, err);
        dbFailCount++;
      }
    }

    const parts = [`Published ${successCount} payroll(s)`];
    if (emailFailCount > 0) parts.push(`${emailFailCount} email(s) failed`);
    if (dbFailCount > 0) parts.push(`${dbFailCount} record(s) failed to update`);

    return res.status(200).json({ message: parts.join(", ") + "." });
  });
};

exports.getPayrollByEmployeeId = (req, res) => {
  const employeeId = req.params.id;
  console.log(employeeId);

  db.query(
    "SELECT * FROM tbl_employee_payroll WHERE fk_employee_id = ? AND is_published = 1 ORDER BY pay_month DESC",
    [employeeId],
    (err, results) => {
      if (err)
        return res
          .status(500)
          .json({ message: "Error fetching payrolls", error: err });
      res.status(200).json(results);
    }
  );
};

exports.addPayrollBreakdown = (req, res) => {
  const { fk_payroll_id, amount, type, category } = req.body;
  if (!fk_payroll_id || !amount || !type || !category) {
    return res.status(400).json({ message: "Please fill all fields" });
  }
  ensureBreakdownCategory();
  const sql = `
    INSERT INTO tbl_payroll_breakdown
      (fk_payroll_id, amount, \`type\`, category)
    VALUES (?, ?, ?, ?)
  `;
  db.query(sql, [fk_payroll_id, amount, type, category], (err) => {
    if (err) {
      return res.status(500).json({ message: "Error in adding breakdown", error: err.sqlMessage });
    }
    return res.status(201).json({ message: "Breakdown added successfully" });
  });
};

// PUT /api/payrolls/employeeBreakdown/:id
exports.updatePayrollBreakdown = (req, res) => {
  const { id } = req.params;
  const { amount, type } = req.body;
  if (!amount || !type) {
    return res.status(400).json({ message: "Amount and type are required" });
  }
  const sql = `
    UPDATE tbl_payroll_breakdown
    SET amount = ?, \`type\` = ?, updated_date = NOW()
    WHERE id = ?
  `;
  db.query(sql, [amount, type, id], (err, result) => {
    if (err) return res.status(500).json({ message: "Update failed", error: err.sqlMessage });
    return res.status(200).json({ message: "Breakdown updated" });
  });
};

// DELETE /api/payrolls/employeeBreakdown/:id
exports.deletePayrollBreakdown = (req, res) => {
  const { id } = req.params;
  const sql = `DELETE FROM tbl_payroll_breakdown WHERE id = ?`;
  db.query(sql, [id], (err) => {
    if (err) return res.status(500).json({ message: "Delete failed", error: err.sqlMessage });
    return res.status(200).json({ message: "Breakdown deleted" });
  });
};

exports.getPayrollBreakdown = (req, res) => {
  const { payrollId } = req.query;

  if (!payrollId) {
    return res.status(400).json({ message: "Missing query parameters" });
  }
  console.log(payrollId);
  db.query(
    `SELECT * FROM tbl_payroll_breakdown 
     WHERE fk_payroll_id = ?
     ORDER BY id DESC`,
    [payrollId],
    (err, results) => {
      if (err) {
        console.error("Fetch failed:", err);
        return res
          .status(500)
          .json({ message: "Error fetching breakdown", error: err });
      }
      const mapped = (results || []).map((r) => ({
        ...r,
        category: r.category != null ? r.category : (r.is_earning === 0 ? 2 : 1),
      }));
      res.status(200).json(mapped);
    }
  );
};

// Get all breakdowns for a particular employee across all their payrolls
exports.getPayrollBreakdownByEmployee = (req, res) => {
  const { id: employeeId } = req.params;
  console.log("getPayrollBreakdownByEmployee -> employeeId:", employeeId);

  if (!employeeId) {
    return res.status(400).json({ message: "Employee id is required" });
  }

  const query = `
    SELECT 
      b.id,
      b.fk_payroll_id,
      b.amount,
      b.\`type\`,
      b.is_earning,
      b.created_date,
      p.pay_month
    FROM tbl_payroll_breakdown b
    JOIN tbl_employee_payroll p ON p.id = b.fk_payroll_id
    WHERE p.fk_employee_id = ?
    ORDER BY p.pay_month DESC, b.created_date DESC`;

  db.query(query, [employeeId], (err, results) => {
    if (err) {
      console.error("Fetch by employee failed:", err);
      return res
        .status(500)
        .json({ message: "Error fetching breakdown by employee", error: err });
    }
    res.status(200).json(results);
  });
};

// Get all meta types
exports.getPayrollMetaTypes = (req, res) => {
  db.query(
    "SELECT * FROM tbl_payroll_meta_types ORDER BY id DESC",
    (err, rows) => {
      if (err) {
        console.error("Fetch failed:", err);
        return res
          .status(500)
          .json({ message: "Error fetching meta types", error: err });
      }
      res.json(rows);
    }
  );
};

// Add a new meta type
exports.addPayrollMetaType = (req, res) => {
  const { type_name } = req.body;
  if (!type_name) {
    return res.status(400).json({ message: "Type name is required" });
  }

  db.query(
    `INSERT INTO tbl_payroll_meta_types (type_name, created_date, updated_date) VALUES (?, NOW(), NOW())`,
    [type_name],
    (err, result) => {
      if (err) {
        console.error("Insert failed:", err);
        if (err.code === "ER_DUP_ENTRY") {
          return res
            .status(400)
            .json({ message: "This meta type already exists" });
        }
        return res
          .status(500)
          .json({ message: "Error in adding meta type", error: err });
      }
      return res.status(201).json({ message: "Meta type added successfully" });
    }
  );
};

// Update a meta type
exports.updatePayrollMetaType = (req, res) => {
  const { id } = req.params;
  const { type_name } = req.body;
  if (!type_name) {
    return res.status(400).json({ message: "Type name is required" });
  }
  db.query(
    "UPDATE tbl_payroll_meta_types SET type_name = ?, updated_date = NOW() WHERE id = ?",
    [type_name, id],
    (err, result) => {
      if (err) {
        console.error("Update failed:", err);
        return res.status(500).json({ message: "Error updating meta type", error: err });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Meta type not found" });
      }
      return res.json({ message: "Meta type updated successfully" });
    }
  );
};

// Delete a meta type
exports.deletePayrollMetaType = (req, res) => {
  const { id } = req.params;
  db.query(
    "DELETE FROM tbl_payroll_meta_types WHERE id = ?",
    [id],
    (err, result) => {
      if (err) {
        console.error("Delete failed:", err);
        return res.status(500).json({ message: "Error deleting meta type", error: err });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Meta type not found" });
      }
      return res.json({ message: "Meta type deleted successfully" });
    }
  );
};

// GET /api/payrolls/published?month=January&year=2025
exports.getPublishedPayrollsByMonthYear = (req, res) => {
  const { month, year } = req.query;

  if (!month || !year) {
    return res.status(400).json({ message: "month and year are required" });
  }

  const monthKey = `${month} ${year}`; // matches pay_month stored like "January 2025"

  // Include published rows if either pay_month equals the key OR payroll_date falls in that month/year
  const query = `
    SELECT p.*, e.first_name, e.last_name, e.email_address
    FROM tbl_employee_payroll p
    JOIN tbl_employee e ON p.fk_employee_id = e.id
    WHERE p.is_published = 1
      AND (
        p.pay_month = ?
        OR (
          MONTH(p.payroll_date) = MONTH(STR_TO_DATE(CONCAT('1 ', ?, ' ', ?), '%e %M %Y'))
          AND YEAR(p.payroll_date) = ?
        )
      )
    ORDER BY p.payroll_date DESC
  `;

  const params = [monthKey, month, year, year];

  db.query(query, params, (err, results) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "Error fetching published payrolls", error: err });
    }
    return res.status(200).json(results);
  });
};
