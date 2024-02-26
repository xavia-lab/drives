const controller = require('../controllers/interface.controller');
const router = require('express').Router();

// CRUD Routes for /interfaces
router.get('/', controller.findAll); // /interfaces
router.get('/:id', controller.findOne); // /interfaces/:id
router.post('/', controller.create); // /interfaces
router.put('/:id', controller.update); // /interfaces/:id
router.delete('/:id', controller.delete); // /interfaces/:id

module.exports = router;
