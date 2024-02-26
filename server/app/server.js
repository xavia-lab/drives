const express = require("express");
const sequelize = require("./util/database");

const dotenv = require('dotenv');
dotenv.config();

const app = express();

// parse requests of content-type - application/json
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  next();
});


// Root route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Drives Application." });
});

// Hello route
app.get("/hello", (req, res) => {
  res.send('Hello, World!');
});

// CRUD Routes
app.use("/capacities", require('./routes/capacities'));
app.use("/drives", require('./routes/drives'));
app.use("/interfaces", require('./routes/interfaces'));
app.use("/manufacturers", require('./routes/manufacturers'));
app.use("/models", require('./routes/models'));
app.use("/retailers", require('./routes/retailers'));
app.use("/storageTypes", require('./routes/storageTypes'));

app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message;
  res.status(status).json({ message: message });
});


// Sync database
sequelize.sync(
  { force: true }
).then(() => {
  console.log("Drop and re-sync db.");
});


// set port, listen for requests
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
