const db = require("../db");

// Manages room listing and availability checks based on dates
module.exports = (app) => {
  
  // Checks room availability by detecting overlapping reservations using date-based logic
  app.get("/rooms", (req, res) => {
    db.query("SELECT id, room_number, price FROM rooms ORDER BY room_number", (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results);
    });
  });
  app.get("/rooms/availability", (req, res) => {
    const { check_in, check_out } = req.query;

    if (!check_in || !check_out) {
      return res.status(400).json({ message: "Dates required" });
    }

    const sql = `
      SELECT
        r.id,
        r.room_number,
        r.price,
        NOT EXISTS (
          SELECT 1
          FROM reservations res
          WHERE res.room_id = r.id
            AND res.status IN ('paid','checked_in')
            AND res.check_in < ?
            AND res.check_out > ?
        ) AS available
      FROM rooms r
      ORDER BY r.room_number
    `;

    db.query(sql, [check_out, check_in], (err, rows) => {
      if (err) return res.status(500).json(err);
      res.json(rows);
    });
  });
};