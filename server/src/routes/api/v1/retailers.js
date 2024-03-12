const router = require("express").Router();

const controller = require("../../../controllers/retailer.controller");
const validator = require("../../../validations/pagination.validation");

// CRUD Routes for /retailers
router.get("/", validator, controller.findAll); // /retailers
router.get("/:id", controller.findOne); // /retailers/:id
router.post("/", controller.create); // /retailers
router.put("/:id", controller.update); // /retailers/:id
router.delete("/:id", controller.delete); // /retailers/:id

module.exports = router;
