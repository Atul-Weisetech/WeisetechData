const express = require("express");
const router = express.Router();
const payrollController = require("../controllers/payrollController");

router.post("/", payrollController.createPayroll);
router.get("/", payrollController.getAllPayrolls);
router.get("/published", payrollController.getPublishedPayrollsByMonthYear);

// Specific employee-related routes first
router.get("/employee/breakdown", payrollController.getPayrollBreakdown);
router.get("/employee/:id/breakdowns", payrollController.getPayrollBreakdownByEmployee);
// Alias to avoid any client-side mismatch
router.get("/employee/:id/breakdown", payrollController.getPayrollBreakdownByEmployee);
router.get("/employee/:id", payrollController.getPayrollByEmployeeId);
router.post("/employeeBreakdown/breakdown", payrollController.addPayrollBreakdown);
router.put("/employeeBreakdown/:id", payrollController.updatePayrollBreakdown);
router.delete("/employeeBreakdown/:id", payrollController.deletePayrollBreakdown);

// Publish single
router.post("/publish/:id", payrollController.publishPayroll);
// Publish all unpublished payrolls for a given month (e.g. "March 2025")
router.post("/publish-all/:monthKey", payrollController.publishAllForMonth);

// Generic id routes after specific ones
router.get("/:id", payrollController.getPayrollById);
router.put("/:id", payrollController.updatePayroll);
router.delete("/:id", payrollController.deletePayroll);

// router.get("/breakdown9", payrollController.getPayrollBreakdown);
// router.delete("/breakdown/:id", payrollController.deletePayrollBreakdown);
// router.put("/breakdown/:id", payrollController.updatePayrollBreakdown);
// router.post("/send-mail", payrollController.sendPayrollMail);
// router.post("/send-mail-all", payrollController.sendAllPayrollMails);


module.exports = router;