// Application entry point: initializes server and routes
require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// Register application routes
require("./routes/auth.routes")(app);
require("./routes/rooms.routes")(app);
require("./routes/reservations.routes")(app);
require("./routes/services.routes")(app);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});