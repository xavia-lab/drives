const controller = require('../controllers/retailer.controller');
const router = require('express').Router();

// CRUD Routes for /retailers
router.get('/', controller.findAll); // /retailers
router.get('/:id', controller.findOne); // /retailers/:id
router.post('/', controller.create); // /retailers
router.put('/:id', controller.update); // /retailers/:id
router.delete('/:id', controller.delete); // /retailers/:id

module.exports = router;
