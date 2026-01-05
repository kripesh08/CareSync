const express = require("express");
const router = express.Router();

const authenticate = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");
const checkApproval = require("../middleware/approval.middleware");

router.get(
  "/dashboard",
  authenticate,
  authorizeRoles("PHARMACY", "HOSPITAL"),
  checkApproval,
  (req, res) => {
    res.json({
      success: true,
      message: "Welcome to protected dashboard",
    });
  }
);

module.exports = router;
