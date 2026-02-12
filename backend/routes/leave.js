const express = require('express');
const router = express.Router();
const {
  getAllLeaveRequests,
  getLeaveRequestsByEmployee,
  createLeaveRequest,
  updateLeaveRequestStatus,
  getLeaveStats,
  getPendingLeaveCount,
  deleteLeaveRequest
} = require('../controllers/leaveController');

// Middleware to check if user is authenticated
const authenticate = (req, res, next) => {
  // You can integrate with your existing auth middleware
  // For now, we'll assume the user is authenticated
  next();
};

// Middleware to check if user is HR/Admin
const requireHR = (req, res, next) => {
  // You can integrate with your existing role-based middleware
  // For now, we'll allow all authenticated users
  next();
};

// Get all leave requests (HR/Admin only)
router.get('/', authenticate, requireHR, getAllLeaveRequests);

// Get pending leave requests count
router.get('/pending-count', authenticate, requireHR, getPendingLeaveCount);

// Get leave requests by employee ID
router.get('/employee/:employeeId', authenticate, getLeaveRequestsByEmployee);

// Get leave statistics for employee
router.get('/stats/:employeeId', authenticate, getLeaveStats);

// Create new leave request
router.post('/', authenticate, createLeaveRequest);

// Update leave request status (Approve/Decline)
router.put('/:id/status', authenticate, requireHR, updateLeaveRequestStatus);

// Delete leave request (Admin only)
router.delete('/:id', authenticate, requireHR, deleteLeaveRequest);

module.exports = router;