const controller = require('../controllers/model.controller');
const router = require('express').Router();

// CRUD Routes for /models
router.get('/', controller.findAll); // /models
router.get('/:id', controller.findOne); // /models/:id
router.post('/', controller.create); // /models
router.put('/:id', controller.update); // /models/:id
router.delete('/:id', controller.delete); // /models/:id

module.exports = router;
