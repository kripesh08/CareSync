const pool = require("../config/db");

const findByEmail = async (email) => {
  const { rows } = await pool.query(
    "SELECT * FROM users WHERE email = $1 AND is_active = true",
    [email]
  );
  return rows[0];
};

const createUser = async (user) => {
  const query = `
    INSERT INTO users (full_name, email, phone, password_hash, role)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING user_id, full_name, email, role
  `;
  const values = [
    user.full_name,
    user.email,
    user.phone,
    user.password_hash,
    user.role,
  ];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

module.exports = { findByEmail, createUser };
