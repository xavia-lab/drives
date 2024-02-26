const Interface = require('../models/interface.model');

// Retrieve all interfaces from the database.
exports.findAll = (req, res, next) => {
    Interface.findAll()
        .then(interfaces => {
            res.status(200).json({ interfaces: interfaces });
        })
        .catch(err => console.log(err));
};

// Find a single Interface with an id
exports.findOne = (req, res, next) => {
    const interfaceId = req.params.id;
    Interface.findByPk(interfaceId)
        .then(interface => {
            if (!interface) {
                return res.status(404).json({ message: 'Interface not found!'});
            }
            res.status(200).json({ interface: interface });
        })
        .catch(err => console.log(err));
};

// Create and Save a new Interface
exports.create = (req, res, next) => {
    const interfaceName = req.body.name;
    const interfaceForm = req.body.form;
    const interfaceSpeed = req.body.speed;
    Interface.create({
        name: interfaceName,
        form: interfaceForm,
        speed: interfaceSpeed,
    })
    .then(result => {
        console.log('Created interface');
        res.status(201).json({
            message: 'Interface created succssfully!',
            interface: result
        });
    })
    .catch(err => {
        console.log(err);
    })
};

// Update a Interface by the id in the request
exports.update = (req, res, next) => {
    const interfaceId = req.params.id;
    const interfaceName = req.body.name;
    const interfaceForm = req.body.form;
    const interfaceSpeed = req.body.speed;
    Interface.findByPk(interfaceId)
        .then(interface => {
            if (!interface) {
                return res.status(404).json({ message: 'Interface not found!'});
            }
            interface.name = interfaceName;
            interface.form = interfaceForm;
            interface.speed = interfaceSpeed;
    
            return interface.save();
        })
        .then(result => {
            res.status(200).json({ message: 'Interface updated', interface: result });
        })
        .catch(err => console.log(err));
};

// Delete a Interface with the specified id in the request
exports.delete = (req, res, next) => {
    const interfaceId = req.params.id;
    Interface.findByPk(interfaceId)
        .then(interface => {
            if (!interface) {
                return res.status(404).json({ message: 'Interface not found!'});
            }
            return interface.destroy({
                where: {
                    id: interfaceId
                }
            });
        })
        .then(result => {
            res.status(200).json({ message: 'Interface deleted' });
        })
        .catch(err => console.log(err));
};
