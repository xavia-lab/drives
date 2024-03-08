const router = require("express").Router();

const controller = require("../controllers/drive.controller");
const validator = require("../validations/pagination.validation");

// CRUD Routes for /drives
router.get("/", validator, controller.findAll); // /drives
router.get("/:id", controller.findOne); // /drives/:id
router.post("/", controller.create); // /drives
router.put("/:id", controller.update); // /drives/:id
router.delete("/:id", controller.delete); // /drives/:id

module.exports = router;
