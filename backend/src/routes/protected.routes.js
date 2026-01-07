const express = require("express");
const router = express.Router();

const authenticate = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");
const checkApproval = require("../middleware/approval.middleware");

/**
 * =========================
 * PATIENT DASHBOARD
 * No approval required
 * =========================
 */
router.get(
  "/patient/dashboard",
  authenticate,
  authorizeRoles("PATIENT"),
  (req, res) => {
    res.json({
      success: true,
      role: "PATIENT",
      message: "Welcome to Patient Dashboard",
    });
  }
);

/**
 * =========================
 * PHARMACY DASHBOARD
 * Approval required
 * =========================
 */
router.get(
  "/pharmacy/dashboard",
  authenticate,
  authorizeRoles("PHARMACY"),
  checkApproval,
  (req, res) => {
    res.json({
      success: true,
      role: "PHARMACY",
      message: "Welcome to Pharmacy Dashboard",
    });
  }
);

/**
 * =========================
 * HOSPITAL DASHBOARD
 * Approval required
 * =========================
 */
router.get(
  "/hospital/dashboard",
  authenticate,
  authorizeRoles("HOSPITAL"),
  checkApproval,
  (req, res) => {
    res.json({
      success: true,
      role: "HOSPITAL",
      message: "Welcome to Hospital Dashboard",
    });
  }
);

/**
 * =========================
 * ADMIN DASHBOARD
 * No approval required
 * =========================
 */
router.get(
  "/admin/dashboard",
  authenticate,
  authorizeRoles("ADMIN"),
  (req, res) => {
    res.json({
      success: true,
      role: "ADMIN",
      message: "Welcome to Admin Dashboard",
    });
  }
);

module.exports = router;
