const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth.routes");
const protectedRoutes = require("./routes/protected.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/protected", protectedRoutes);

app.get("/", (req, res) => {
  res.send("CareSync Backend API Running");
});

module.exports = app;
