const express = require("express");
const router = express.Router();

const authenticate = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");
const pharmacyService = require("../services/pharmacy.service");

/**
 * CREATE PHARMACY PROFILE
 * Role: PHARMACY
 * Approval: NOT DONE HERE
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
        message: "Pharmacy profile created. Await document verification and admin approval.",
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

module.exports = router;
