const mysql = require("mysql2");
require("dotenv").config();

// Database configuration: timezone set to UTC to avoid date shifts
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  timezone: 'Z',
  dateStrings: true
});

db.connect(err => {
  if (err) {
    console.error("MySQL connection error:", err);
    return;
  }
  console.log("Connected to MySQL");
});

module.exports = db;