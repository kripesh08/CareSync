require("dotenv").config();
const app = require("./app");
const pool = require("./config/db");


const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  try {
    await pool.query("SELECT 1");
    console.log(`🚀 CareSync backend running on port ${PORT}`);
  } catch (error) {
    console.error("❌ PostgreSQL connection failed:", error.message);
  }
});
