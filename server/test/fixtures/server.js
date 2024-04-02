const dotenv = require("dotenv");
const express = require("express");

dotenv.config();
const app = express();

const env = process.env.NODE_ENV || "test";

// api v1 Routes
app.use("/api/v1", require("../../src/routes/api/v1"));

// set port, listen for requests
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});

server.close();
