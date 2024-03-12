const router = require("express").Router();

const controller = require("../../../controllers/capacity.controller");
const validator = require("../../../validations/pagination.validation");

// CRUD Routes for /capacities
router.get("/", validator, controller.findAll); // /capacities
router.get("/:id", controller.findOne); // /capacities/:id
router.post("/", controller.create); // /capacities
router.put("/:id", controller.update); // /capacities/:id
router.delete("/:id", controller.delete); // /capacities/:id

module.exports = router;
