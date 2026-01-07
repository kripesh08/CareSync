const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth.routes");
const protectedRoutes = require("./routes/protected.routes");
const pharmacyRoutes = require("./routes/pharmacy.routes");
const verificationRoutes = require("./routes/verification.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/protected", protectedRoutes);
app.use("/api/pharmacy", pharmacyRoutes);
app.use("/api/verification", verificationRoutes);

app.get("/", (req, res) => {
  res.send("CareSync Backend API Running");
});

module.exports = app;
