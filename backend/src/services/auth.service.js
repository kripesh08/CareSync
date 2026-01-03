const jwt = require("jsonwebtoken");
const jwtConfig = require("../config/jwt");
const userRepo = require("../repositories/user.repository");
const { hashPassword, comparePassword } = require("../utils/password.util");

const register = async (data) => {
  const existing = await userRepo.findByEmail(data.email);
  if (existing) throw "User already exists";

  const password_hash = await hashPassword(data.password);

  return userRepo.createUser({
    full_name: data.full_name,
    email: data.email,
    phone: data.phone,
    password_hash,
    role: data.role,
  });
};

const login = async (email, password) => {
  const user = await userRepo.findByEmail(email);
  if (!user) throw new Error("Invalid email or password");


  const valid = await comparePassword(password, user.password_hash);
  if (!valid) throw new Error("Invalid email or password");


  const token = jwt.sign(
    { user_id: user.user_id, role: user.role },
    jwtConfig.secret,
    { expiresIn: jwtConfig.expiresIn }
  );

  return { token, role: user.role };
};

module.exports = { register, login };
