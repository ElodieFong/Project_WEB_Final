// Handles the full reservation lifecycle: payment, availability checks, cancellation rules, check-in/check-out, and reservation views
module.exports = (app) => {
  const db = require("../db");

  // Creates and pays a reservation
  app.post("/reservation/pay", (req, res) => {
    const { user_id, room_id, check_in, check_out, amount } = req.body;
    if (!user_id || !room_id || !check_in || !check_out || !amount) {
      return res.status(400).json({ message: "Missing fields" });
    }

    if (check_out <= check_in) {
      return res.status(400).json({ message: "Invalid stay dates" });
    }
    const overlapQuery = `
      SELECT 1
      FROM reservations
      WHERE room_id = ?
        AND status IN ('paid','checked_in')
        AND check_in < ?
        AND check_out > ?
      LIMIT 1
    `;
    db.query(
      overlapQuery,
      [room_id, check_out, check_in],
      (err, rows) => {
        if (err) {
          return res.status(500).json({ message: "Database error" });
        }

        if (rows.length > 0) {
          return res.status(400).json({ message: "Room not available" });
        }

        const insertQuery = `
          INSERT INTO reservations
          (user_id, room_id, check_in, check_out, amount, status)
          VALUES (?, ?, ?, ?, ?, 'paid')
        `;

        db.query(
          insertQuery,
          [user_id, room_id, check_in, check_out, amount],
          (err, result) => {
            if (err) {
              return res.status(500).json({ message: "Payment failed" });
            }

            res.json({
              message: "Reservation paid successfully",
              reservation_id: result.insertId
            });
          }
        );
      }
    );
  });
  // Returns all reservations for one user
  app.get("/reservations/user/:id", (req, res) => {
    const userId = req.params.id;

    const query = `
      SELECT r.id, r.check_in, r.check_out, r.amount, r.status, rm.room_number
      FROM reservations r
      JOIN rooms rm ON r.room_id = rm.id
      WHERE r.user_id = ?
      ORDER BY r.check_in DESC
    `;

    db.query(query, [userId], (err, rows) => {
      if (err) return res.status(500).json(err);
      res.json(rows);
    });
  });

  // Cancels a reservation if more than 24h before check-in
  app.post("/reservation/cancel/:id", (req, res) => {
    const reservationId = req.params.id;

    const query = `
      UPDATE reservations
      SET status = 'cancelled'
      WHERE id = ?
        AND status = 'paid'
        AND NOW() < TIMESTAMP(check_in, '14:00:00') - INTERVAL 24 HOUR
    `;

    db.query(query, [reservationId], (err, result) => {
      if (err) return res.status(500).json(err);

      if (result.affectedRows === 0) {
        return res.status(400).json({
          message:
            "Cancellation not allowed. Cancellations must be made at least 24 hours before check-in."
        });
      }

      res.json({ message: "Reservation cancelled successfully" });
    });
  });

  // Allows receptionist check-in only if: Reservation is 'paid', current date is within the stay period
  app.post("/checkin/:id", (req, res) => {
    const reservationId = req.params.id;

    const query = `
      UPDATE reservations r
      SET r.status = 'checked_in'
      WHERE r.id = ?
        AND r.status = 'paid'
        AND NOW() >= CONCAT(DATE(r.check_in), ' 14:00:00')
        AND NOW() < r.check_out
    `;

    db.query(query, [reservationId], (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.sqlMessage });
      }

      if (result.affectedRows === 0) {
        return res.status(400).json({
          message:
            "Check-in not allowed. The stay has not started yet or is already finished."
        });
      }

      res.json({ message: "Check-in successful" });
    });
  });

  // Allows check-out only after the stay is completed
  app.post("/checkout/:id", (req, res) => {
    const reservationId = req.params.id;

    const query = `
      UPDATE reservations
      SET status = 'checked_out'
      WHERE id = ?
        AND status = 'checked_in'
        AND (
        CURRENT_DATE() > check_out
        OR (CURRENT_DATE() = check_out AND CURRENT_TIME() >= '12:00:00')
      )
    `;

    db.query(query, [reservationId], (err, result) => {
      if (err) return res.status(500).json(err);

      if (result.affectedRows === 0) {
        return res.status(400).json({
          message: "Check-out not allowed (too early or wrong status)"
        });
      }

      res.json({ message: "Check-out successful" });
    });
  });

  // Returns full details of a single reservation (receptionist view)
  app.get("/reservation/:id", (req, res) => {
    const reservationId = req.params.id;

    const query = `
      SELECT 
        r.id,
        r.check_in,
        r.check_out,
        r.amount,
        r.status,
        rm.room_number,
        rm.price
      FROM reservations r
      JOIN rooms rm ON r.room_id = rm.id
      WHERE r.id = ?
    `;

    db.query(query, [reservationId], (err, rows) => {
      if (err) return res.status(500).json(err);
      if (rows.length === 0)
        return res.status(404).json({ message: "Reservation not found" });

      res.json(rows[0]);
    });
  });

  // Computes the total price of a reservation (room + services)
  app.get("/reservation/:id/total", (req, res) => {
    const reservationId = req.params.id;

    const query = `
      SELECT 
        r.amount AS room_amount,
        IFNULL(SUM(es.price), 0) AS services_amount,
        r.amount + IFNULL(SUM(es.price), 0) AS total
      FROM reservations r
      LEFT JOIN extra_services es ON es.reservation_id = r.id
      WHERE r.id = ?
      GROUP BY r.id
    `;

    db.query(query, [reservationId], (err, rows) => {
      if (err) return res.status(500).json(err);
      res.json(rows[0]);
    });
  });

  // Returns enriched reservation data for a user, including total amounts and services
  app.get("/reservations/user/:id/details", (req, res) => {
    const userId = req.params.id;

    const query = `
    SELECT 
      r.id,
      r.created_at,
      DATE_FORMAT(r.check_in, '%Y-%m-%d')  AS check_in,
      DATE_FORMAT(r.check_out, '%Y-%m-%d') AS check_out,
      r.status,
      rm.room_number,
      r.amount AS room_amount,
      IFNULL(SUM(es.price), 0) AS services_amount,
      r.amount + IFNULL(SUM(es.price), 0) AS total
    FROM reservations r
    JOIN rooms rm ON r.room_id = rm.id
    LEFT JOIN extra_services es ON es.reservation_id = r.id
    WHERE r.user_id = ?
    GROUP BY r.id
    ORDER BY r.created_at DESC, r.id DESC
    `;

    db.query(query, [userId], (err, rows) => {
      if (err) return res.status(500).json(err);
      res.json(rows);
    });
  });

  // Returns all reservations for the receptionist panel, ordered from most recent to oldest
  app.get("/reservations", (req, res) => {
    const query = `
      SELECT
        r.id,
        DATE_FORMAT(r.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
        DATE_FORMAT(r.check_in, '%Y-%m-%d')  AS check_in,
        DATE_FORMAT(r.check_out, '%Y-%m-%d') AS check_out,
        r.status,
        rm.room_number,
        u.username,

        r.amount AS room_amount,
        IFNULL(SUM(es.price), 0) AS services_amount,
        r.amount + IFNULL(SUM(es.price), 0) AS total

      FROM reservations r
      JOIN rooms rm ON r.room_id = rm.id
      JOIN users u ON r.user_id = u.id
      LEFT JOIN extra_services es ON es.reservation_id = r.id

      GROUP BY r.id
      ORDER BY r.created_at DESC, r.id DESC
    `;

    db.query(query, (err, rows) => {
      if (err) return res.status(500).json(err);
      res.json(rows);
    });
  });

  // Allows the receptionist to cancel a reservation up to 24 hours before check-in
  app.post("/reservation/:id/cancel-by-receptionist", (req, res) => {
    const reservationId = req.params.id;

    const query = `
      UPDATE reservations
      SET status = 'cancelled'
      WHERE id = ?
        AND status = 'paid'
        AND NOW() < TIMESTAMP(check_in, '14:00:00') - INTERVAL 24 HOUR
    `;

    db.query(query, [reservationId], (err, result) => {
      if (err) return res.status(500).json(err);

      if (result.affectedRows === 0) {
        return res.status(400).json({
          message:
            "Cancellation not allowed. The reservation is less than 24 hours from check-in or already started."
        });
      }

      res.json({ message: "Reservation cancelled by receptionist" });
    });
  });

};