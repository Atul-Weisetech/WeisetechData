const db = require('../config/db');

// Helper function to map status codes to text
const getStatusText = (statusCode) => {
  const statusMap = {
    '0': 'requested',
    '1': 'approved', 
    '2': 'declined'
  };
  return statusMap[statusCode] || 'unknown';
};

// Helper function to map text to status codes
const getStatusCode = (statusText) => {
  const normalized = (statusText || '').toLowerCase();
  const statusMap = {
    'requested': '0',
    'pending': '0',
    'approved': '1',
    'declined': '2',
    'rejected': '2'
  };
  return statusMap[normalized] || '0';
};

// Helper to use callback-based mysql2 with async/await
const query = (sql, params) => new Promise((resolve, reject) => {
  db.query(sql, params, (err, results) => {
    if (err) reject(err);
    else resolve(results);
  });
});

// Get all leave requests (for HR/Admin)
const getAllLeaveRequests = async (req, res) => {
  try {
    console.log('=== getAllLeaveRequests called ===');
    
    const rows = await query(
      `SELECT 
        id,
        employee_id,
        employee_name,
        from_date,
        to_date,
        number_of_days,
        description,
        status,
        applied_date,
        reviewed_by,
        reviewed_at,
        created_date,
        last_updated_date
       FROM tbl_employee_leave_request 
       ORDER BY 
         CASE status 
           WHEN '0' THEN 1  -- requested first
           WHEN '1' THEN 2  -- approved
           WHEN '2' THEN 3  -- declined
         END,
         applied_date DESC,
         created_date DESC`
    );
    
    console.log(`Found ${rows.length} total leave requests`);
    
    // Map status codes to text for frontend
    const formattedRows = (Array.isArray(rows) ? rows : []).map(row => ({
      ...row,
      status_text: getStatusText(row.status)
    }));
    
    res.json({
      success: true,
      data: formattedRows
    });
  } catch (error) {
    console.error('Error fetching leave requests:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch leave requests',
      details: error.message 
    });
  }
};

// Get leave requests by employee ID - ENHANCED WITH DEBUGGING
const getLeaveRequestsByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    console.log('==============================================');
    console.log('=== getLeaveRequestsByEmployee called ===');
    console.log('Employee ID from params:', employeeId);
    console.log('Employee ID type:', typeof employeeId);
    console.log('Timestamp:', new Date().toISOString());
    console.log('==============================================');
    
    // First, let's verify the employee exists in the employees table
    console.log('\n[STEP 1] Checking if employee exists...');
    const employeeCheck = await query(
      'SELECT id, first_name, last_name FROM tbl_employee WHERE id = ?',
      [employeeId]
    );
    
    console.log('Employee check result:', employeeCheck);
    
    if (!employeeCheck || employeeCheck.length === 0) {
      console.error(`❌ Employee ${employeeId} NOT FOUND in tbl_employee`);
      return res.status(404).json({
        success: false,
        error: 'Employee not found'
      });
    }
    
    console.log(`✓ Employee found: ${employeeCheck[0].first_name} ${employeeCheck[0].last_name}`);
    
    // Now fetch leave requests
    console.log('\n[STEP 2] Fetching leave requests...');
    console.log('SQL Query:', `SELECT ... FROM tbl_employee_leave_request WHERE employee_id = ${employeeId}`);
    
    const rows = await query(
      `SELECT 
        id,
        employee_id,
        employee_name,
        from_date,
        to_date,
        number_of_days,
        description,
        status,
        applied_date,
        reviewed_by,
        reviewed_at,
        created_date,
        last_updated_date
       FROM tbl_employee_leave_request 
       WHERE employee_id = ? 
       ORDER BY applied_date DESC, created_date DESC`,
      [employeeId]
    );
    
    console.log(`\n[STEP 3] Query executed successfully`);
    console.log(`Number of rows returned: ${rows.length}`);
    
    if (rows.length === 0) {
      console.log('\n⚠️  NO LEAVE REQUESTS FOUND');
      console.log('This could mean:');
      console.log('  1. Employee has not submitted any leave requests');
      console.log('  2. There is a mismatch in employee_id values');
      
      // Let's check what employee IDs actually exist in leave requests
      console.log('\n[DEBUG] Checking all employee IDs in leave requests table...');
      const allEmployeeIds = await query(
        'SELECT DISTINCT employee_id FROM tbl_employee_leave_request ORDER BY employee_id'
      );
      console.log('Employee IDs with leave requests:', allEmployeeIds.map(row => row.employee_id));
      
      // Check total count
      const totalCount = await query('SELECT COUNT(*) as total FROM tbl_employee_leave_request');
      console.log('Total leave requests in system:', totalCount[0].total);
    } else {
      console.log('\n✓ LEAVE REQUESTS FOUND');
      console.log('First leave request:', {
        id: rows[0].id,
        employee_id: rows[0].employee_id,
        employee_name: rows[0].employee_name,
        from_date: rows[0].from_date,
        to_date: rows[0].to_date,
        status: rows[0].status,
        description: rows[0].description?.substring(0, 50)
      });
      
      console.log('All leave request IDs:', rows.map(r => r.id));
    }
    
    // Map status codes to text for frontend
    const formattedRows = (Array.isArray(rows) ? rows : []).map(row => ({
      ...row,
      status_text: getStatusText(row.status)
    }));
    
    console.log('\n[STEP 4] Sending response to frontend');
    console.log('Response format:', {
      success: true,
      data: `Array of ${formattedRows.length} items`
    });
    console.log('=== END getLeaveRequestsByEmployee ===\n');
    
    res.json({
      success: true,
      data: formattedRows
    });
    
  } catch (error) {
    console.error('\n❌❌❌ ERROR IN getLeaveRequestsByEmployee ❌❌❌');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('❌❌❌ END ERROR ❌❌❌\n');
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch leave requests',
      details: error.message 
    });
  }
};

// Create new leave request
const createLeaveRequest = async (req, res) => {
  try {
    const body = req.body || {};

    console.log('=== Creating leave request ===');
    console.log('Request body:', body);

    // Accept both snake_case and camelCase from frontend
    let employee_id = body.employee_id ?? body.employeeId ?? body.fk_employee_id;
    let employee_name = body.employee_name ?? body.employeeName;
    let from_date = body.from_date ?? body.fromDate;
    let to_date = body.to_date ?? body.toDate;
    let number_of_days = body.number_of_days ?? body.numberOfDays;
    const description = body.description;

    // Basic presence validation
    if (!employee_id) {
      return res.status(400).json({ success: false, error: 'Employee ID is required. Please login again.' });
    }
    if (!from_date || !to_date || !description) {
      return res.status(400).json({ success: false, error: 'from_date, to_date and description are required' });
    }

    // Normalize number_of_days if missing or not a positive number
    const from = new Date(from_date);
    const to = new Date(to_date);
    if (isNaN(from) || isNaN(to)) {
      return res.status(400).json({ success: false, error: 'Invalid date format. Use YYYY-MM-DD.' });
    }
    if (to < from) {
      return res.status(400).json({ success: false, error: 'From date cannot be after to date' });
    }

    if (!number_of_days || Number(number_of_days) < 1) {
      const diffTime = Math.abs(to - from);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive
      number_of_days = diffDays;
    } else {
      number_of_days = Number(number_of_days);
    }

    if (number_of_days < 1) {
      return res.status(400).json({ success: false, error: 'Number of days must be at least 1' });
    }

    // If employee_name missing, try to fetch from employee table
    if (!employee_name) {
      try {
        const empRows = await query(
          'SELECT first_name, last_name FROM tbl_employee WHERE id = ?',
          [employee_id]
        );
        if (Array.isArray(empRows) && empRows.length > 0) {
          const first = empRows[0].first_name || '';
          const last = empRows[0].last_name || '';
          employee_name = `${first} ${last}`.trim() || null;
        }
      } catch (e) {
        console.error('Error fetching employee name:', e);
      }
    }

    if (!employee_name) {
      return res.status(400).json({ success: false, error: 'Employee name is required or could not be resolved.' });
    }

    const result = await query(
      `INSERT INTO tbl_employee_leave_request 
       (employee_id, employee_name, from_date, to_date, number_of_days, description, applied_date) 
       VALUES (?, ?, ?, ?, ?, ?, CURDATE())`,
      [employee_id, employee_name, from_date, to_date, number_of_days, description]
    );

    console.log('Leave request created with ID:', result.insertId);

    // Fetch the created record to return
    const newRecord = await query(
      `SELECT 
        id,
        employee_id,
        employee_name,
        from_date,
        to_date,
        number_of_days,
        description,
        status,
        applied_date,
        reviewed_by,
        reviewed_at,
        created_date,
        last_updated_date
       FROM tbl_employee_leave_request WHERE id = ?`,
      [result.insertId]
    );

    const formattedRecord = {
      ...newRecord[0],
      status_text: getStatusText(newRecord[0].status)
    };

    res.status(201).json({
      success: true,
      message: 'Leave request submitted successfully',
      data: formattedRecord
    });
  } catch (error) {
    console.error('Error creating leave request:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to submit leave request',
      details: error.message 
    });
  }
};

// Update leave request status (Approve/Decline)
const updateLeaveRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reviewed_by } = req.body;

    console.log('=== Updating leave request status ===');
    console.log('Leave Request ID:', id);
    console.log('New Status:', status);
    console.log('Reviewed By:', reviewed_by);

    // Convert status text to code if needed
    let statusCode = status;
    if (['requested', 'approved', 'declined'].includes(status)) {
      statusCode = getStatusCode(status);
    }

    // Validation
    if (!statusCode || !['0', '1', '2'].includes(statusCode)) {
      return res.status(400).json({ 
        success: false,
        error: 'Valid status is required (0=requested, 1=approved, 2=declined)' 
      });
    }

    if (statusCode !== '0' && !reviewed_by) {
      return res.status(400).json({ 
        success: false,
        error: 'Reviewer name is required when approving or declining' 
      });
    }

    const result = await query(
      `UPDATE tbl_employee_leave_request 
       SET status = ?, reviewed_by = ?, reviewed_at = NOW(), last_updated_date = NOW()
       WHERE id = ?`,
      [statusCode, reviewed_by, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Leave request not found' 
      });
    }

    // Fetch updated record
    const updatedRecords = await query(
      `SELECT 
        id,
        employee_id,
        employee_name,
        from_date,
        to_date,
        number_of_days,
        description,
        status,
        applied_date,
        reviewed_by,
        reviewed_at,
        created_date,
        last_updated_date
       FROM tbl_employee_leave_request WHERE id = ?`,
      [id]
    );

    const updatedRecord = Array.isArray(updatedRecords) && updatedRecords.length > 0 ? updatedRecords[0] : null;
    if (!updatedRecord) {
      return res.status(404).json({ 
        success: false,
        error: 'Updated record not found' 
      });
    }

    const formattedRecord = {
      ...updatedRecord,
      status_text: getStatusText(updatedRecord.status)
    };

    const statusMessages = {
      '0': 'Leave request set to requested',
      '1': 'Leave request approved successfully',
      '2': 'Leave request declined successfully'
    };

    console.log('Leave request updated successfully');

    res.json({
      success: true,
      message: statusMessages[statusCode],
      data: formattedRecord
    });
  } catch (error) {
    console.error('Error updating leave request:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update leave request',
      details: error.message 
    });
  }
};

// Get leave request statistics for employee
const getLeaveStats = async (req, res) => {
  try {
    const { employeeId } = req.params;

    console.log('=== Getting leave stats for employee:', employeeId, '===');

    const stats = await query(
      `SELECT 
        COUNT(*) as total_requests,
        SUM(CASE WHEN status = '1' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = '2' THEN 1 ELSE 0 END) as declined,
        SUM(CASE WHEN status = '0' THEN 1 ELSE 0 END) as requested
       FROM tbl_employee_leave_request 
       WHERE employee_id = ?`,
      [employeeId]
    );

    const statData = Array.isArray(stats) && stats.length > 0 ? stats[0] : { total_requests: 0, approved: 0, declined: 0, requested: 0 };

    console.log('Stats:', statData);

    res.json({
      success: true,
      data: statData
    });
  } catch (error) {
    console.error('Error fetching leave stats:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch leave statistics',
      details: error.message 
    });
  }
};

// Get pending leave requests count (for HR/Admin dashboard)
const getPendingLeaveCount = async (req, res) => {
  try {
    console.log('=== Getting pending leave count ===');
    
    const result = await query(
      `SELECT COUNT(*) as pending_count 
       FROM tbl_employee_leave_request 
       WHERE status = '0'`
    );

    const count = Array.isArray(result) && result.length > 0 ? result[0].pending_count : 0;

    console.log('Pending leave requests:', count);

    res.json({
      success: true,
      data: {
        pending_leave_requests: count
      }
    });
  } catch (error) {
    console.error('Error fetching pending leave count:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch pending leave count',
      details: error.message 
    });
  }
};

// Delete leave request (Admin only)
const deleteLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('=== Deleting leave request:', id, '===');

    const result = await query(
      'DELETE FROM tbl_employee_leave_request WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Leave request not found' 
      });
    }

    console.log('Leave request deleted successfully');

    res.json({ 
      success: true,
      message: 'Leave request deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting leave request:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete leave request',
      details: error.message 
    });
  }
};

module.exports = {
  getAllLeaveRequests,
  getLeaveRequestsByEmployee,
  createLeaveRequest,
  updateLeaveRequestStatus,
  getLeaveStats,
  getPendingLeaveCount,
  deleteLeaveRequest
};
