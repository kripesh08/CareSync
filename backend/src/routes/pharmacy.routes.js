const express = require("express");
const router = express.Router();

const authenticate = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");
const checkPharmacyApproval = require("../middleware/pharmacyApproval.middleware");

const pharmacyService = require("../services/pharmacy.service");

/**
 * ======================================================
 * CREATE PHARMACY PROFILE
 * Role: PHARMACY
 * Approval: NOT DONE HERE
 * ======================================================
 */
router.post(
  "/profile",
  authenticate,
  authorizeRoles("PHARMACY"),
  async (req, res) => {
    try {
      const pharmacy = await pharmacyService.createProfile(
        req.user.user_id,
        req.body
      );

      res.status(201).json({
        success: true,
        message:
          "Pharmacy profile created. Upload license document for verification.",
        pharmacy,
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  }
);

/**
 * ======================================================
 * PHARMACY DASHBOARD
 * Role: PHARMACY
 * Approval: REQUIRED (LICENSE must be approved by ADMIN)
 * ======================================================
 */
router.get(
  "/dashboard",
  authenticate,
  authorizeRoles("PHARMACY"),
  checkPharmacyApproval, // 🔥 ROLE-SPECIFIC APPROVAL
  async (req, res) => {
    try {
      const pharmacy = await pharmacyService.getByUserId(
        req.user.user_id
      );

      res.json({
        success: true,
        message: "Welcome to Pharmacy Dashboard",
        pharmacy,
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({
        success: false,
        message: "Failed to load pharmacy dashboard",
      });
    }
  }
);

module.exports = router;
