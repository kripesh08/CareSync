const pool = require("../config/db");

/**
 * Check if pharmacy profile already exists for user
 */
const findByUserId = async (user_id) => {
  const { rows } = await pool.query(
    "SELECT * FROM pharmacies WHERE user_id = $1",
    [user_id]
  );
  return rows[0];
};

/**
 * Create pharmacy profile
 */
const createPharmacy = async (data) => {
  const query = `
    INSERT INTO pharmacies 
      (user_id, pharmacy_name, license_number, address, city)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;

  const values = [
    data.user_id,
    data.pharmacy_name,
    data.license_number,
    data.address,
    data.city,
  ];

  const { rows } = await pool.query(query, values);
  return rows[0];
};

module.exports = {
  findByUserId,
  createPharmacy,
};
