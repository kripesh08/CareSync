const pool = require("../config/db");

const checkApproval = async (req, res, next) => {
  // ✅ SAFETY GUARD
  if (!req.user || !req.user.role) {
    return next();
  }

  const { user_id, role } = req.user;

  // ✅ DO NOT CHECK APPROVAL FOR THESE ROLES
  if (role === "PATIENT" || role === "ADMIN") {
    return next();
  }

  try {
    if (role === "PHARMACY") {
      const { rows } = await pool.query(
        "SELECT is_approved FROM pharmacies WHERE user_id = $1",
        [user_id]
      );

      if (!rows.length) {
        return res.status(403).json({
          success: false,
          message: "Pharmacy profile not created",
        });
      }

      if (!rows[0].is_approved) {
        return res.status(403).json({
          success: false,
          message: "Pharmacy approval pending",
        });
      }
    }

    if (role === "HOSPITAL") {
      const { rows } = await pool.query(
        "SELECT is_approved FROM hospitals WHERE user_id = $1",
        [user_id]
      );

      if (!rows.length) {
        return res.status(403).json({
          success: false,
          message: "Hospital profile not created",
        });
      }

      if (!rows[0].is_approved) {
        return res.status(403).json({
          success: false,
          message: "Hospital approval pending",
        });
      }
    }

    next();
  } catch (error) {
    console.error("Approval check error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Approval verification failed",
    });
  }
};

module.exports = checkApproval;
