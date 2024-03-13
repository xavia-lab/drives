const router = require("express").Router();

const controller = require("../../../controllers/formFactor.controller");
const validator = require("../../../validations/pagination.validation");

// CRUD Routes for /formFactors
router.get("/", validator, controller.findAll); // /formFactors
router.get("/:id", controller.findOne); // /formFactors/:id
router.post("/", controller.create); // /formFactors
router.put("/:id", controller.update); // /formFactors/:id
router.delete("/:id", controller.delete); // /formFactors/:id

module.exports = router;
