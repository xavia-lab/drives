const express = require("express");
const bodyParser = require("body-parser");
// const cors = require("cors");
const sequelize = require("./util/database");

const app = express();

// var corsOptions = {
//   origin: "http://localhost:5000"
// };

// app.use(cors(corsOptions));

// parse requests of content-type - application/json
app.use(bodyParser.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

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
app.use("/interfaces", require('./routes/interfaces'));
app.use("/manufacturers", require('./routes/manufacturers'));
app.use("/models", require('./routes/models'));

app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message;
  res.status(status).json({ message: message });
});


// Sync database
sequelize.sync(
  // { force: true }
).then(() => {
  console.log("Drop and re-sync db.");
});


// set port, listen for requests
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
