const Capacity = require('../models/capacity.model');

// Retrieve all capacities from the database.
exports.findAll = (req, res, next) => {
    Capacity.findAll()
        .then(capacities => {
            res.status(200).json({ capacities: capacities });
        })
        .catch(err => console.log(err));
};

// Find a single Capacity with an id
exports.findOne = (req, res, next) => {
    const capacityId = req.params.id;
    Capacity.findByPk(capacityId)
        .then(capacity => {
            if (!capacity) {
                return res.status(404).json({ message: 'Capacity not found!'});
            }
            res.status(200).json({ capacity: capacity });
        })
        .catch(err => console.log(err));
};

// Create and Save a new Capacity
exports.create = (req, res, next) => {
    const capacityName = req.body.name;
    const capacityUnit = req.body.unit;
    const capacityValue = req.body.value;
    Capacity.create({
        name: capacityName,
        unit: capacityUnit,
        value: capacityValue,
    })
    .then(result => {
        console.log('Created capacity');
        res.status(201).json({
            message: 'Capacity created succssfully!',
            capacity: result
        });
    })
    .catch(err => {
        console.log(err);
    })
};

// Update a Capacity by the id in the request
exports.update = (req, res, next) => {
    const capacityId = req.params.id;
    const capacityName = req.body.name;
    const capacityUnit = req.body.unit;
    const capacityValue = req.body.value;
    Capacity.findByPk(capacityId)
        .then(capacity => {
            if (!capacity) {
                return res.status(404).json({ message: 'Capacity not found!'});
            }
            capacity.name = capacityName;
            capacity.unit = capacityUnit;
            capacity.value = capacityValue;
    
            return capacity.save();
        })
        .then(result => {
            res.status(200).json({ message: 'Capacity updated', capacity: result });
        })
        .catch(err => console.log(err));
};

// Delete a Capacity with the specified id in the request
exports.delete = (req, res, next) => {
    const capacityId = req.params.id;
    Capacity.findByPk(capacityId)
        .then(capacity => {
            if (!capacity) {
                return res.status(404).json({ message: 'Capacity not found!'});
            }
            return capacity.destroy({
                where: {
                    id: capacityId
                }
            });
        })
        .then(result => {
            res.status(200).json({ message: 'Capacity deleted' });
        })
        .catch(err => console.log(err));
};
