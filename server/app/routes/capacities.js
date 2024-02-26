const controller = require('../controllers/capacity.controller');
const router = require('express').Router();

// CRUD Routes for /capacities
router.get('/', controller.findAll); // /capacities
router.get('/:id', controller.findOne); // /capacities/:id
router.post('/', controller.create); // /capacities
router.put('/:id', controller.update); // /capacities/:id
router.delete('/:id', controller.delete); // /capacities/:id

module.exports = router;
