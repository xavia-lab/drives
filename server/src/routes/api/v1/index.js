const router = require("express").Router();

// CRUD Routes
router.use("/capacities", require("./capacities"));
router.use("/drives", require("./drives"));
router.use("/interfaces", require("./interfaces"));
router.use("/manufacturers", require("./manufacturers"));
router.use("/models", require("./models"));
router.use("/retailers", require("./retailers"));
router.use("/storageTypes", require("./storageTypes"));

module.exports = router;
