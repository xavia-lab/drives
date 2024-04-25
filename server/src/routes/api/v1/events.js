const router = require("express").Router();

const controller = require("../../../controllers/event.controller");
const validator = require("../../../validations/pagination.validation");

// CRUD Routes for /events
router.get("/", validator, controller.findAll); // /events
router.get("/:id", controller.findOne); // /events/:id
router.post("/", controller.create); // /events
router.put("/:id", controller.update); // /events/:id
router.delete("/:id", controller.delete); // /events/:id

module.exports = router;
