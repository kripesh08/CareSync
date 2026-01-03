const express = require("express");
const router = express.Router();
const authService = require("../services/auth.service");

router.post("/register", async (req, res) => {
  try {
    const user = await authService.register(req.body);
    res.status(201).json({ success: true, user });
  } catch (err) {
    res.status(400).json({ success: false, message: err });
  }
});

router.post("/login", async (req, res) => {
  try {
    const result = await authService.login(req.body.email, req.body.password);
    res.json({ success: true, ...result });
  } catch (err) {
        res.status(401).json({
        success: false,
        message: err.message || err
    });
  }
});

module.exports = router;
