const db = require('../config/db');

const getStatusText = (statusCode) => {
  const statusMap = { '0': 'requested', '1': 'approved', '2': 'declined' };
  return statusMap[statusCode] || 'unknown';
};

const getStatusCode = (statusText) => {
  const normalized = (statusText || '').toLowerCase();
  const statusMap = {
    requested: '0', pending: '0', approved: '1', declined: '2', rejected: '2'
  };
  return statusMap[normalized] || '0';
};

const query = (sql, params) => new Promise((resolve, reject) => {
  db.query(sql, params, (err, results) => {
    if (err) reject(err);
    else resolve(results);
  });
});

const TABLE = 'tbl_employee_work_from_home';

const getAllWorkFromHomeRequests = async (req, res) => {
  try {
    const rows = await query(
      `SELECT id, employee_id, employee_name, from_date, to_date, number_of_days,
        description, status, applied_date, reviewed_by, reviewed_at, created_date, last_updated_date
       FROM ${TABLE}
       ORDER BY CASE status WHEN '0' THEN 1 WHEN '1' THEN 2 WHEN '2' THEN 3 END,
         applied_date DESC, created_date DESC`
    );
    const formattedRows = (Array.isArray(rows) ? rows : []).map(row => ({
      ...row,
      status_text: getStatusText(row.status)
    }));
    res.json({ success: true, data: formattedRows });
  } catch (error) {
    console.error('Error fetching work from home requests:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch work from home requests', details: error.message });
  }
};

const getWorkFromHomeByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const empId = parseInt(employeeId, 10);
    if (isNaN(empId)) {
      return res.status(400).json({ success: false, error: 'Invalid employee ID' });
    }
    const rows = await query(
      `SELECT id, employee_id, employee_name, from_date, to_date, number_of_days,
        description, status, applied_date, reviewed_by, reviewed_at, created_date, last_updated_date
       FROM ${TABLE} WHERE employee_id = ? ORDER BY applied_date DESC, created_date DESC`,
      [empId]
    );
    const formattedRows = (Array.isArray(rows) ? rows : []).map(row => ({
      ...row,
      status_text: getStatusText(row.status)
    }));
    res.json({ success: true, data: formattedRows });
  } catch (error) {
    console.error('Error fetching employee work from home:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch work from home requests', details: error.message });
  }
};

const createWorkFromHomeRequest = async (req, res) => {
  try {
    const body = req.body || {};
    console.log('[work-from-home] POST create – body:', JSON.stringify(body));
    let employee_id = body.employee_id ?? body.employeeId ?? body.fk_employee_id;
    let employee_name = body.employee_name ?? body.employeeName;
    let from_date = body.from_date ?? body.fromDate;
    let to_date = body.to_date ?? body.toDate;
    let number_of_days = body.number_of_days ?? body.numberOfDays;
    const description = body.description || '';

    if (employee_id === undefined || employee_id === null || employee_id === '') {
      return res.status(400).json({ success: false, error: 'Employee ID is required. Please login again.', message: 'Employee ID is required. Please login again.' });
    }
    employee_id = parseInt(employee_id, 10);
    if (isNaN(employee_id)) {
      return res.status(400).json({ success: false, error: 'Invalid employee ID.', message: 'Invalid employee ID.' });
    }
    if (!from_date || !to_date) {
      return res.status(400).json({ success: false, error: 'From date and to date are required.', message: 'From date and to date are required.' });
    }
    if (!description || !String(description).trim()) {
      return res.status(400).json({ success: false, error: 'Description is required.', message: 'Description is required.' });
    }

    const from = new Date(from_date);
    const to = new Date(to_date);
    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      return res.status(400).json({ success: false, error: 'Invalid date format. Use YYYY-MM-DD.', message: 'Invalid date format. Use YYYY-MM-DD.' });
    }
    if (to < from) {
      return res.status(400).json({ success: false, error: 'From date cannot be after to date', message: 'From date cannot be after to date' });
    }

    if (!number_of_days || Number(number_of_days) < 1) {
      const diffTime = Math.abs(to - from);
      number_of_days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    } else {
      number_of_days = parseInt(number_of_days, 10) || 1;
    }
    if (number_of_days < 1) {
      return res.status(400).json({ success: false, error: 'Number of days must be at least 1', message: 'Number of days must be at least 1' });
    }

    if (!employee_name || !String(employee_name).trim()) {
      try {
        const empRows = await query('SELECT first_name, last_name FROM tbl_employee WHERE id = ?', [employee_id]);
        if (Array.isArray(empRows) && empRows.length > 0) {
          employee_name = `${empRows[0].first_name || ''} ${empRows[0].last_name || ''}`.trim() || null;
        }
      } catch (e) {
        console.error('Error fetching employee name for WFH:', e);
      }
    }
    if (!employee_name || !String(employee_name).trim()) {
      return res.status(400).json({ success: false, error: 'Employee name could not be resolved. Please try again.', message: 'Employee name could not be resolved. Please try again.' });
    }

    const insertResult = await query(
      `INSERT INTO ${TABLE} (employee_id, employee_name, from_date, to_date, number_of_days, description, applied_date)
       VALUES (?, ?, ?, ?, ?, ?, CURDATE())`,
      [employee_id, String(employee_name).trim(), from_date, to_date, number_of_days, String(description).trim()]
    );

    const insertId = insertResult?.insertId;
    if (insertId == null) {
      console.error('Work from home INSERT did not return insertId:', insertResult);
      return res.status(500).json({ success: false, error: 'Failed to save request. Please try again.', message: 'Failed to save request. Please try again.' });
    }

    const newRecordRows = await query(`SELECT * FROM ${TABLE} WHERE id = ?`, [insertId]);
    const newRecord = Array.isArray(newRecordRows) ? newRecordRows[0] : newRecordRows;
    if (!newRecord) {
      return res.status(201).json({
        success: true,
        message: 'Work from home request submitted successfully',
        data: { id: insertId, employee_id, employee_name, from_date, to_date, number_of_days, description, status: '0', status_text: 'requested' }
      });
    }

    const formattedRecord = { ...newRecord, status_text: getStatusText(newRecord.status) };

    res.status(201).json({
      success: true,
      message: 'Work from home request submitted successfully',
      data: formattedRecord
    });
  } catch (error) {
    console.error('Error creating work from home request:', error);
    const errMsg = error.message || 'Failed to submit request';
    res.status(500).json({
      success: false,
      error: errMsg,
      message: errMsg,
      details: error.message
    });
  }
};

const updateWorkFromHomeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reviewed_by } = req.body;
    let statusCode = status;
    if (['requested', 'approved', 'declined'].includes(status)) {
      statusCode = getStatusCode(status);
    }
    if (!statusCode || !['0', '1', '2'].includes(statusCode)) {
      return res.status(400).json({ success: false, error: 'Valid status is required (0=requested, 1=approved, 2=declined)' });
    }
    if (statusCode !== '0' && !reviewed_by) {
      return res.status(400).json({ success: false, error: 'Reviewer name is required when approving or declining' });
    }

    const result = await query(
      `UPDATE ${TABLE} SET status = ?, reviewed_by = ?, reviewed_at = NOW(), last_updated_date = NOW() WHERE id = ?`,
      [statusCode, reviewed_by, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Work from home request not found' });
    }

    const updatedRecords = await query(`SELECT * FROM ${TABLE} WHERE id = ?`, [id]);
    const updatedRecord = Array.isArray(updatedRecords) && updatedRecords.length > 0 ? updatedRecords[0] : null;
    if (!updatedRecord) {
      return res.status(404).json({ success: false, error: 'Updated record not found' });
    }

    const statusMessages = { '0': 'Set to requested', '1': 'Approved successfully', '2': 'Declined successfully' };
    res.json({
      success: true,
      message: statusMessages[statusCode],
      data: { ...updatedRecord, status_text: getStatusText(updatedRecord.status) }
    });
  } catch (error) {
    console.error('Error updating work from home status:', error);
    res.status(500).json({ success: false, error: 'Failed to update status', details: error.message });
  }
};

const getPendingWorkFromHomeCount = async (req, res) => {
  try {
    const result = await query(`SELECT COUNT(*) as pending_count FROM ${TABLE} WHERE status = '0'`);
    const count = Array.isArray(result) && result.length > 0 ? result[0].pending_count : 0;
    res.json({ success: true, data: { pending_work_from_home_requests: count } });
  } catch (error) {
    console.error('Error fetching pending work from home count:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch count', details: error.message });
  }
};

const deleteWorkFromHomeRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(`DELETE FROM ${TABLE} WHERE id = ?`, [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Work from home request not found' });
    }
    res.json({ success: true, message: 'Work from home request deleted successfully' });
  } catch (error) {
    console.error('Error deleting work from home request:', error);
    res.status(500).json({ success: false, error: 'Failed to delete request', details: error.message });
  }
};

module.exports = {
  getAllWorkFromHomeRequests,
  getWorkFromHomeByEmployee,
  createWorkFromHomeRequest,
  updateWorkFromHomeStatus,
  getPendingWorkFromHomeCount,
  deleteWorkFromHomeRequest
};
