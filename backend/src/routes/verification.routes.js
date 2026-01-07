const express = require("express");
const router = express.Router();

const authenticate = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");
const verificationService = require("../services/verification.service");

/**
 * PHARMACY: Upload verification document
 */
router.post(
  "/upload",
  authenticate,
  authorizeRoles("PHARMACY"),
  async (req, res) => {
    try {
      const document = await verificationService.upload(
        req.user.user_id,
        req.body
      );

      res.status(201).json({
        success: true,
        message: "Document uploaded for verification",
        document,
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
 * ADMIN: View pending documents
 */
router.get(
  "/pending/:entityType",
  authenticate,
  authorizeRoles("ADMIN"),
  async (req, res) => {
    const documents = await verificationService.listPending(
      req.params.entityType
    );

    res.json({
      success: true,
      documents,
    });
  }
);

/**
 * ADMIN: Approve / Reject document
 */
router.put(
  "/review/:documentId",
  authenticate,
  authorizeRoles("ADMIN"),
  async (req, res) => {
    try {
      const { status } = req.body;

      const document = await verificationService.reviewDocument(
        req.params.documentId,
        status
      );

      res.json({
        success: true,
        message: `Document ${status}`,
        document,
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
