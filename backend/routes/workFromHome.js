const express = require('express');
const router = express.Router();
const {
  getAllWorkFromHomeRequests,
  getWorkFromHomeByEmployee,
  createWorkFromHomeRequest,
  updateWorkFromHomeStatus,
  getPendingWorkFromHomeCount,
  deleteWorkFromHomeRequest
} = require('../controllers/workFromHomeController');

const authenticate = (req, res, next) => next();
const requireHR = (req, res, next) => next();

router.get('/', authenticate, requireHR, getAllWorkFromHomeRequests);
router.get('/pending-count', authenticate, requireHR, getPendingWorkFromHomeCount);
router.get('/employee/:employeeId', authenticate, getWorkFromHomeByEmployee);
router.post('/', authenticate, createWorkFromHomeRequest);
router.put('/:id/status', authenticate, requireHR, updateWorkFromHomeStatus);
router.delete('/:id', authenticate, requireHR, deleteWorkFromHomeRequest);

module.exports = router;
