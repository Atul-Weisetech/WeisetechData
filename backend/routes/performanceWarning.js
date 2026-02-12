const express = require('express');
const router = express.Router();
const {
  getAllPerformanceWarnings,
  getPerformanceWarningsByEmployee,
  getPerformanceWarningById,
  createPerformanceWarning,
  updatePerformanceWarning,
  deletePerformanceWarning
} = require('../controllers/performanceWarningController');

// Get all performance warnings
router.get('/', getAllPerformanceWarnings);

// Get performance warnings by employee
router.get('/employee/:employeeId', getPerformanceWarningsByEmployee);

// Get single performance warning with full details (for editing)
router.get('/:id', getPerformanceWarningById);

// Create new performance warning
router.post('/', createPerformanceWarning);

// Update performance warning
router.put('/:id', updatePerformanceWarning);

// Delete performance warning
router.delete('/:id', deletePerformanceWarning);

module.exports = router;
