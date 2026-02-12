const db = require('../config/db');

const query = (sql, params) => new Promise((resolve, reject) => {
  db.query(sql, params, (err, results) => {
    if (err) reject(err);
    else resolve(results);
  });
});

const TABLE = 'tbl_performance_warning';
const TYPE_TABLE = 'tbl_performance_warning_type';

// Get all performance warnings with their warning types
const getAllPerformanceWarnings = async (req, res) => {
  try {
    // First get all warnings
    const warnings = await query(
      `SELECT id, employee_id, employee_name, overall_notes, created_by, created_at, updated_at
       FROM ${TABLE}
       ORDER BY created_at DESC`
    );

    // Then get all warning types for these warnings
    if (warnings && warnings.length > 0) {
      const warningIds = warnings.map(w => w.id);
      const placeholders = warningIds.map(() => '?').join(',');
      const types = await query(
        `SELECT id, id_performance_warning, warning_type, description, created_at, updated_at
         FROM ${TYPE_TABLE}
         WHERE id_performance_warning IN (${placeholders})
         ORDER BY id_performance_warning, created_at`,
        warningIds
      );

      // Group types by warning id (only store warning_type names, not descriptions)
      const typesByWarning = {};
      types.forEach(type => {
        if (!typesByWarning[type.id_performance_warning]) {
          typesByWarning[type.id_performance_warning] = [];
        }
        typesByWarning[type.id_performance_warning].push(type.warning_type);
      });

      // Combine warnings with their types (warning_types as array of strings)
      const result = warnings.map(warning => ({
        id: warning.id,
        employee_id: warning.employee_id,
        employee_name: warning.employee_name,
        overall_notes: warning.overall_notes || '',
        warning_types: typesByWarning[warning.id] || [],
        created_by: warning.created_by,
        created_at: warning.created_at,
        updated_at: warning.updated_at
      }));

      res.json({ success: true, data: result });
    } else {
      res.json({ success: true, data: [] });
    }
  } catch (error) {
    console.error('Error fetching performance warnings:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch performance warnings', details: error.message });
  }
};

// Get performance warnings by employee with their warning types
const getPerformanceWarningsByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const empId = parseInt(employeeId, 10);
    if (isNaN(empId)) {
      return res.status(400).json({ success: false, error: 'Invalid employee ID' });
    }

    // Get warnings for this employee
    const warnings = await query(
      `SELECT id, employee_id, employee_name, overall_notes, created_by, created_at, updated_at
       FROM ${TABLE} WHERE employee_id = ? ORDER BY created_at DESC`,
      [empId]
    );

    if (warnings && warnings.length > 0) {
      const warningIds = warnings.map(w => w.id);
      const placeholders = warningIds.map(() => '?').join(',');
      const types = await query(
        `SELECT id, id_performance_warning, warning_type, description, created_at, updated_at
         FROM ${TYPE_TABLE}
         WHERE id_performance_warning IN (${placeholders})
         ORDER BY id_performance_warning, created_at`,
        warningIds
      );

      // Group types by warning id (only store warning_type names, not descriptions)
      const typesByWarning = {};
      types.forEach(type => {
        if (!typesByWarning[type.id_performance_warning]) {
          typesByWarning[type.id_performance_warning] = [];
        }
        typesByWarning[type.id_performance_warning].push(type.warning_type);
      });

      // Combine warnings with their types (warning_types as array of strings)
      const result = warnings.map(warning => ({
        id: warning.id,
        employee_id: warning.employee_id,
        employee_name: warning.employee_name,
        overall_notes: warning.overall_notes || '',
        warning_types: typesByWarning[warning.id] || [],
        created_by: warning.created_by,
        created_at: warning.created_at,
        updated_at: warning.updated_at
      }));

      res.json({ success: true, data: result });
    } else {
      res.json({ success: true, data: [] });
    }
  } catch (error) {
    console.error('Error fetching employee performance warnings:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch performance warnings', details: error.message });
  }
};

// Create new performance warning with multiple warning types
const createPerformanceWarning = async (req, res) => {
  try {
    const body = req.body || {};
    console.log('[performance-warning] POST create – body:', JSON.stringify(body));

    let employee_id = body.employee_id ?? body.employeeId ?? body.fk_employee_id;
    let employee_name = body.employee_name ?? body.employeeName;
    const overall_notes = body.overall_notes ?? body.overallNotes ?? '';
    const warning_types = body.warning_types || []; // Array of { warning_type, description }
    const created_by = body.created_by ?? body.createdBy ?? req.user?.name ?? 'HR/Admin';

    if (employee_id === undefined || employee_id === null || employee_id === '') {
      return res.status(400).json({ 
        success: false, 
        error: 'Employee ID is required.', 
        message: 'Employee ID is required.' 
      });
    }
    employee_id = parseInt(employee_id, 10);
    if (isNaN(employee_id)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid employee ID.', 
        message: 'Invalid employee ID.' 
      });
    }

    if (!Array.isArray(warning_types) || warning_types.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'At least one warning type is required.', 
        message: 'At least one warning type is required.' 
      });
    }

    // Validate warning types
    for (const wt of warning_types) {
      if (!wt.warning_type || !String(wt.warning_type).trim()) {
        return res.status(400).json({ 
          success: false, 
          error: 'Each warning type must have a type name.', 
          message: 'Each warning type must have a type name.' 
        });
      }
    }

    // If employee_name missing, try to fetch from employee table
    if (!employee_name) {
      try {
        const empRows = await query('SELECT first_name, last_name FROM tbl_employee WHERE employee_id = ?', [employee_id]);
        if (empRows && empRows.length > 0) {
          employee_name = `${empRows[0].first_name || ''} ${empRows[0].last_name || ''}`.trim();
        } else {
          return res.status(404).json({ 
            success: false, 
            error: 'Employee not found.', 
            message: 'Employee not found.' 
          });
        }
      } catch (err) {
        console.error('Error fetching employee name:', err);
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to fetch employee information.', 
          message: 'Failed to fetch employee information.' 
        });
      }
    }

    // Count existing warnings for this employee BEFORE creating new one
    const existingCountResult = await query(
      `SELECT COUNT(*) as count FROM ${TABLE} WHERE employee_id = ?`,
      [employee_id]
    );
    const previous_warning_count = existingCountResult[0]?.count || 0;

    // Always create a NEW performance warning record (even if employee already has warnings)
    const result = await query(
      `INSERT INTO ${TABLE} (employee_id, employee_name, overall_notes, created_by)
       VALUES (?, ?, ?, ?)`,
      [employee_id, employee_name, overall_notes || '', created_by]
    );

    const warningId = result.insertId;

    // Insert warning type records for this new warning
    for (const wt of warning_types) {
      await query(
        `INSERT INTO ${TYPE_TABLE} (id_performance_warning, warning_type, description)
         VALUES (?, ?, ?)`,
        [warningId, wt.warning_type, wt.description || '']
      );
    }

    // Fetch the complete warning with types
    const newWarning = await query(
      `SELECT id, employee_id, employee_name, overall_notes, created_by, created_at, updated_at
       FROM ${TABLE} WHERE id = ?`,
      [warningId]
    );

    const types = await query(
      `SELECT warning_type, description FROM ${TYPE_TABLE} WHERE id_performance_warning = ?`,
      [warningId]
    );

    const responseData = {
      ...newWarning[0],
      warning_types: types.map(t => ({
        warning_type: t.warning_type,
        description: t.description || ''
      }))
    };

    res.status(201).json({ 
      success: true, 
      message: 'Performance warning created successfully',
      previous_warning_count: previous_warning_count,
      data: responseData
    });
  } catch (error) {
    console.error('Error creating performance warning:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create performance warning', 
      message: error.message,
      details: error.message 
    });
  }
};

// Get single performance warning with full details (including descriptions) for editing
const getPerformanceWarningById = async (req, res) => {
  try {
    const { id } = req.params;
    const warning_id = parseInt(id, 10);
    
    if (isNaN(warning_id)) {
      return res.status(400).json({ success: false, error: 'Invalid warning ID' });
    }

    const warning = await query(
      `SELECT id, employee_id, employee_name, overall_notes, created_by, created_at, updated_at
       FROM ${TABLE} WHERE id = ?`,
      [warning_id]
    );

    if (!warning || warning.length === 0) {
      return res.status(404).json({ success: false, error: 'Warning not found' });
    }

    const types = await query(
      `SELECT warning_type, description FROM ${TYPE_TABLE} WHERE id_performance_warning = ?`,
      [warning_id]
    );

    // Format response as per requirement
    const responseData = {
      id_performance_warning: warning[0].id,
      employee: {
        id: warning[0].employee_id || null,
        name: warning[0].employee_name || `Employee ${warning[0].employee_id || 'Unknown'}`
      },
      overall_note: warning[0].overall_notes || '',
      warning_types: types.map(t => ({
        warning_type: t.warning_type,
        description: t.description || ''
      })),
      created_by: warning[0].created_by,
      created_at: warning[0].created_at,
      updated_at: warning[0].updated_at
    };

    console.log('[performance-warning] GET by ID response:', JSON.stringify(responseData, null, 2));
    res.json({ success: true, data: responseData });
  } catch (error) {
    console.error('Error fetching performance warning:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch performance warning', details: error.message });
  }
};

// Update performance warning (can update overall notes and warning types)
const updatePerformanceWarning = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const warning_id = parseInt(id, 10);
    
    if (isNaN(warning_id)) {
      return res.status(400).json({ success: false, error: 'Invalid warning ID' });
    }

    const overall_notes = body.overall_notes ?? body.overallNotes;
    const warning_types = body.warning_types; // Optional: array of { warning_type, description }

    const updates = [];
    const params = [];

    if (overall_notes !== undefined) {
      updates.push('overall_notes = ?');
      params.push(overall_notes);
    }

    if (updates.length > 0) {
      params.push(warning_id);
      await query(
        `UPDATE ${TABLE} SET ${updates.join(', ')} WHERE id = ?`,
        params
      );
    }

    // If warning_types provided, replace all existing types
    if (Array.isArray(warning_types)) {
      // Delete existing types
      await query(`DELETE FROM ${TYPE_TABLE} WHERE id_performance_warning = ?`, [warning_id]);
      
      // Insert new types
      for (const wt of warning_types) {
        if (wt.warning_type && String(wt.warning_type).trim()) {
          await query(
            `INSERT INTO ${TYPE_TABLE} (id_performance_warning, warning_type, description)
             VALUES (?, ?, ?)`,
            [warning_id, wt.warning_type, wt.description || '']
          );
        }
      }
    }

    // Fetch updated warning
    const updated = await query(
      `SELECT id, employee_id, employee_name, overall_notes, created_by, created_at, updated_at
       FROM ${TABLE} WHERE id = ?`,
      [warning_id]
    );

    const types = await query(
      `SELECT warning_type, description FROM ${TYPE_TABLE} WHERE id_performance_warning = ?`,
      [warning_id]
    );

    const responseData = {
      ...updated[0],
      warning_types: types.map(t => ({
        warning_type: t.warning_type,
        description: t.description || ''
      }))
    };

    res.json({ 
      success: true, 
      message: 'Performance warning updated successfully',
      data: responseData
    });
  } catch (error) {
    console.error('Error updating performance warning:', error);
    res.status(500).json({ success: false, error: 'Failed to update performance warning', details: error.message });
  }
};

// Delete performance warning (cascade will delete warning types)
const deletePerformanceWarning = async (req, res) => {
  try {
    const { id } = req.params;
    const warning_id = parseInt(id, 10);
    
    if (isNaN(warning_id)) {
      return res.status(400).json({ success: false, error: 'Invalid warning ID' });
    }

    await query(`DELETE FROM ${TABLE} WHERE id = ?`, [warning_id]);
    // Warning types will be deleted automatically due to CASCADE

    res.json({ success: true, message: 'Performance warning deleted successfully' });
  } catch (error) {
    console.error('Error deleting performance warning:', error);
    res.status(500).json({ success: false, error: 'Failed to delete performance warning', details: error.message });
  }
};

module.exports = {
  getAllPerformanceWarnings,
  getPerformanceWarningsByEmployee,
  getPerformanceWarningById,
  createPerformanceWarning,
  updatePerformanceWarning,
  deletePerformanceWarning
};
