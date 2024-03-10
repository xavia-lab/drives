const router = require("express").Router();

const controller = require("../controllers/model.controller");
const validator = require("../validations/pagination.validation");

// CRUD Routes for /models
router.get("/", validator, controller.findAll); // /models
router.get("/:id", controller.findOne); // /models/:id
router.post("/", controller.create); // /models
router.put("/:id", controller.update); // /models/:id
router.delete("/:id", controller.delete); // /models/:id

module.exports = router;
