const Drive = require('../models/drive.model');

// Retrieve all drives from the database.
exports.findAll = (req, res, next) => {
    Drive.findAll({ include: { all: true, nested: true }})
        .then(drives => {
            res.status(200).json({ drives: drives });
        })
        .catch(err => console.log(err));
};

// Find a single Drive with an id
exports.findOne = (req, res, next) => {
    const driveId = req.params.id;
    Drive.findByPk(driveId, { include: { all: true, nested: true }})
        .then(drive => {
            if (!drive) {
                return res.status(404).json({ message: 'Drive not found!'});
            }
            res.status(200).json({ drive: drive });
        })
        .catch(err => console.log(err));
};

// Create and Save a new Drive
exports.create = (req, res, next) => {
    const driveLabel = req.body.label;
    const driveSerial = req.body.serial;
    const driveDatePurchased = req.body.datePurchased;
    const modelId = req.body.modelId;
    const retailerId = req.body.retailerId;
    Drive.create({
        label: driveLabel,
        serial: driveSerial,
        datePurchased: driveDatePurchased,
        modelId: modelId,
        retailerId: retailerId,
    })
    .then(result => {
        console.log('Created drive');
        res.status(201).json({
            message: 'Drive created succssfully!',
            drive: result
        });
    })
    .catch(err => {
        console.log(err);
    })
};

// Update a Drive by the id in the request
exports.update = (req, res, next) => {
    const driveId = req.params.id;
    const driveLabel = req.body.label;
    const driveSerial = req.body.serial;
    const driveDatePurchased = req.body.datePurchased;
    const modelId = req.body.modelId;
    const retailerId = req.body.retailerId;
    Drive.findByPk(driveId)
        .then(drive => {
            if (!drive) {
                return res.status(404).json({ message: 'Drive not found!'});
            }

            return drive.update({
                label: driveLabel,
                serial: driveSerial,
                datePurchased: driveDatePurchased,
                modelId: modelId,
                retailerId: retailerId,
            });
        })
        .then(result => {
            res.status(200).json({ message: 'Drive updated', drive: result });
        })
        .catch(err => console.log(err));
};

// Delete a Drive with the specified id in the request
exports.delete = (req, res, next) => {
    const driveId = req.params.id;
    Drive.findByPk(driveId)
        .then(drive => {
            if (!drive) {
                return res.status(404).json({ message: 'Drive not found!'});
            }
            return drive.destroy({
                where: {
                    id: driveId
                }
            });
        })
        .then(result => {
            res.status(200).json({ message: 'Drive deleted' });
        })
        .catch(err => console.log(err));
};
