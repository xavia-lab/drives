const router = require("express").Router();

// CRUD Routes
router.use("/drives", require("./drives"));
router.use("/manufacturers", require("./manufacturers"));
router.use("/models", require("./models"));
router.use("/retailers", require("./retailers"));
router.use("/capacities", require("./capacities"));
router.use("/interfaces", require("./interfaces"));
router.use("/formFactors", require("./formFactors"));
router.use("/storageTypes", require("./storageTypes"));

module.exports = router;
