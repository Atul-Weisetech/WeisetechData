const express = require("express");
const router = express.Router();
const payrollController = require("../controllers/payrollController");

// If you have a separate controller file, better move meta type logic there.
// For now, we’ll reuse payrollController.
router.get("/", payrollController.getPayrollMetaTypes);
router.post("/", payrollController.addPayrollMetaType);
router.put("/:id", payrollController.updatePayrollMetaType);
router.delete("/:id", payrollController.deletePayrollMetaType);

module.exports = router;
