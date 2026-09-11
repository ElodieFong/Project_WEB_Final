const db = require("../db");

// Handles user authentication (login)
module.exports = (app) => {
  app.post("/login", (req, res) => {
    const { username, password } = req.body;
    db.query(
      "SELECT * FROM users WHERE username = ?",
      [username],
      (err, results) => {
        if (err) return res.status(500).json(err);

        if (results.length === 0) {
          return res.status(400).json({ message: "User not found" });
        }

        const user = results[0];

        if (user.password !== password) {
          return res.status(400).json({ message: "Incorrect password" });
        }

        res.json({
          message: "Login successful",
          user: {
            id: user.id,
            username: user.username,
            role: user.role
          }
        });
      }
    );
  });

};