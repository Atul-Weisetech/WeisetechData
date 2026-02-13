const db = require('../config/db');

const query = (sql, params) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });

const TABLE = 'tbl_notifications';

// Get all notifications for an employee, ordered by created_at DESC
const getNotificationsByEmployeeId = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const userId = parseInt(employeeId, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ success: false, error: 'Invalid employee ID' });
    }

    const rows = await query(
      `SELECT id, user_id, title, message, type, reference_id, is_read, created_at
       FROM ${TABLE}
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );

    const data = (rows || []).map((row) => ({
      id: row.id,
      user_id: row.user_id,
      title: row.title,
      message: row.message,
      type: row.type,
      reference_id: row.reference_id != null ? row.reference_id : null,
      is_read: Boolean(row.is_read),
      created_at: row.created_at,
    }));

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications',
      details: error.message,
    });
  }
};

// Get unread count for an employee
const getUnreadCountByEmployeeId = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const userId = parseInt(employeeId, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ success: false, error: 'Invalid employee ID' });
    }

    const rows = await query(
      `SELECT COUNT(*) as count FROM ${TABLE} WHERE user_id = ? AND is_read = 0`,
      [userId]
    );
    const count = rows && rows[0] ? Number(rows[0].count) : 0;
    res.json({ success: true, count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch unread count',
      details: error.message,
    });
  }
};

// Mark a notification as read
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notificationId = parseInt(id, 10);
    if (isNaN(notificationId)) {
      return res.status(400).json({ success: false, error: 'Invalid notification ID' });
    }

    await query(`UPDATE ${TABLE} SET is_read = 1 WHERE id = ?`, [notificationId]);
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read',
      details: error.message,
    });
  }
};

module.exports = {
  getNotificationsByEmployeeId,
  getUnreadCountByEmployeeId,
  markAsRead,
};
