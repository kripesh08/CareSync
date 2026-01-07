const verificationService = require("../services/verification.service");

const checkPharmacyApproval = async (req, res, next) => {
  try {
    const { user_id, role } = req.user;

    // Safety guard
    if (!user_id || role !== "PHARMACY") {
      return next();
    }

    const hasLicense = await verificationService.hasApprovedLicense(user_id);

    if (!hasLicense) {
      return res.status(403).json({
        success: false,
        message: "Pharmacy approval pending",
      });
    }

    next();
  } catch (error) {
    console.error("Pharmacy approval check failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Approval verification failed",
    });
  }
};




module.exports = checkPharmacyApproval;
