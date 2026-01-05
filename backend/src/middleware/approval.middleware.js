const pool = require("../config/db");

const checkApproval = async (req, res, next) => {
  const { user_id, role } = req.user;

  try {
    if (role === "PHARMACY") {
      const { rows } = await pool.query(
        "SELECT is_approved FROM pharmacies WHERE user_id = $1",
        [user_id]
      );

      if (!rows.length || !rows[0].is_approved) {
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

      if (!rows.length || !rows[0].is_approved) {
        return res.status(403).json({
          success: false,
          message: "Hospital approval pending",
        });
      }
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Approval verification failed",
    });
  }
};

module.exports = checkApproval;
