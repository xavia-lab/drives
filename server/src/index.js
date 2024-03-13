const express = require("express");

const dotenv = require("dotenv");
dotenv.config();

const db = require("./models");
const app = express();

// parse requests of content-type - application/json
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers",
  );
  next();
});

// Root route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Drives Application API Server." });
});

// api v1 Routes
app.use("/api/v1", require("./routes/api/v1"));

// Healthcheck route
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message;
  res.status(status).json({ message: message });
});

// Sync database
db.sequelize
  .sync({
    // force: true,
    // match: /test$/,
  })
  .then(() => {
    console.log("Drop and re-sync db.");
  });

// set port, listen for requests
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
