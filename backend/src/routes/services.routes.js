// Handles extra services added to reservations (meals, laundry)
module.exports = (app) => {
  const db = require("../db");

  // Centralized service pricing to avoid hard-coded values
  const PRICES = {
    meal: 20,
    laundry: 15
  };

  // Adds an extra service to a reservation, only allowed for checked-in reservations
  app.post("/service", (req, res) => {
    const { reservation_id, type } = req.body;

    if (!reservation_id || !type) {
      return res.status(400).json({ message: "Missing fields" });
    }

    if (!PRICES[type]) {
      return res.status(400).json({ message: "Invalid service type" });
    }

    db.query(
      `SELECT status FROM reservations WHERE id = ?`,
      [reservation_id],
      (err, rows) => {
        if (err) return res.status(500).json(err);

        if (rows.length === 0) {
          return res.status(404).json({ message: "Reservation not found" });
        }

        const status = rows[0].status;

        if (status !== "checked_in") {
          return res.status(400).json({
            message: "Cannot add service after check-out or cancellation"
          });
        }

        db.query(
          `
          INSERT INTO extra_services (reservation_id, type, price)
          VALUES (?, ?, ?)
          `,
          [reservation_id, type, PRICES[type]],
          (err) => {
            if (err) return res.status(500).json(err);
            res.json({ message: "Service added" });
          }
        );
      }
    );
  });

  // Returns all extra services for a given reservation
  app.get("/reservation/:id/services", (req, res) => {
    const reservationId = req.params.id;

    const query = `
      SELECT id, type, price, created_at
      FROM extra_services
      WHERE reservation_id = ?
      ORDER BY created_at ASC
    `;

    db.query(query, [reservationId], (err, rows) => {
      if (err) return res.status(500).json(err);
      res.json(rows);
    });
  });
};