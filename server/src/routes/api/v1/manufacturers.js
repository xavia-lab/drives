const router = require("express").Router();

const controller = require("../../../controllers/manufacturer.controller");
const validator = require("../../../validations/pagination.validation");

// CRUD Routes for /manufacturers
router.get("/", validator, controller.findAll); // /manufacturers
router.get("/:id", controller.findOne); // /manufacturers/:id
router.post("/", controller.create); // /manufacturers
router.put("/:id", controller.update); // /manufacturers/:id
router.delete("/:id", controller.delete); // /manufacturers/:id

module.exports = router;
