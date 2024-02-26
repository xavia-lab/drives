const controller = require('../controllers/manufacturer.controller');
const router = require('express').Router();

// CRUD Routes for /manufacturers
router.get('/', controller.findAll); // /manufacturers
router.get('/:id', controller.findOne); // /manufacturers/:id
router.post('/', controller.create); // /manufacturers
router.put('/:id', controller.update); // /manufacturers/:id
router.delete('/:id', controller.delete); // /manufacturers/:id

module.exports = router;
