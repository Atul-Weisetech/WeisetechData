// routes/employee.js (add these to your existing file)
const express = require('express');
const router = express.Router();
const {
  addEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  deactivateEmployee,
  activateEmployee,
  createPayroll,
  getEmployeePayrolls,
  getPayrollBreakdown  // Add this import
} = require('../controllers/employeeController');

// Existing employee routes
router.post('/employees', addEmployee);
router.get('/employees', getEmployees);
router.get('/employees/:id', getEmployeeById);
router.put('/employees/:id', updateEmployee);
router.delete('/employees/:id', deleteEmployee);
router.patch('/employees/:id/deactivate', deactivateEmployee);
router.patch('/employees/:id/activate', activateEmployee);

// Add these payroll routes
router.post('/payrolls', createPayroll);
router.get('/payrolls/employee/:id', getEmployeePayrolls);
router.get('/payrolls/:id/breakdown', getPayrollBreakdown);  // This is the missing route!

module.exports = router;