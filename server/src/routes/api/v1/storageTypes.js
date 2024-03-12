const router = require("express").Router();

const controller = require("../../../controllers/storageType.controller");
const validator = require("../../../validations/pagination.validation");

// CRUD Routes for /storageTypes
router.get("/", validator, controller.findAll); // /storageTypes
router.get("/:id", controller.findOne); // /storageTypes/:id
router.post("/", controller.create); // /storageTypes
router.put("/:id", controller.update); // /storageTypes/:id
router.delete("/:id", controller.delete); // /storageTypes/:id

module.exports = router;
