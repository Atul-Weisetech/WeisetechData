const express = require('express');
const router = express.Router();
const {
  getNotificationsByEmployeeId,
  getUnreadCountByEmployeeId,
  markAsRead,
} = require('../controllers/notificationController');

// Get unread count for an employee (must be before /employee/:employeeId)
router.get('/employee/:employeeId/unread-count', getUnreadCountByEmployeeId);

// Get all notifications for an employee (ordered by created_at DESC)
router.get('/employee/:employeeId', getNotificationsByEmployeeId);

// Mark notification as read
router.patch('/:id/read', markAsRead);

module.exports = router;
