const { validationResult } = require("express-validator");

const Drive = require("../models/drive.model");
const QueryParamsBuilder = require("../builders/query.params.builder");

exports.findAll = (req, res) => {
  const requestQueryParams = req.query;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const queryParams = QueryParamsBuilder.build(requestQueryParams);

  Drive.findAndCountAll({
    ...queryParams,
    include: { all: true, nested: true },
  })
    .then((result) => {
      res
        .status(200)
        .set("X-Pagination-Total-Count", result.count)
        .json(result.rows);
    })
    .catch((err) => console.log(err));
};

// Find a single Drive with an id
exports.findOne = (req, res) => {
  const driveId = req.params.id;
  Drive.findByPk(driveId, { include: { all: true, nested: true } })
    .then((drive) => {
      if (!drive) {
        return res.status(404).json({ message: "Drive not found!" });
      }
      res.status(200).json(drive);
    })
    .catch((err) => console.log(err));
};

// Create and Save a new Drive
exports.create = (req, res) => {
  const driveName = req.body.name;
  const driveLabel = req.body.label;
  const driveSerial = req.body.serial;
  const driveDatePurchased = req.body.datePurchased;
  const modelId = req.body.modelId;
  const retailerId = req.body.retailerId;
  Drive.create({
    name: driveName,
    label: driveLabel,
    serial: driveSerial,
    datePurchased: driveDatePurchased,
    modelId: modelId,
    retailerId: retailerId,
  })
    .then((result) => {
      console.log("Created drive");
      res.status(201).json(result);
    })
    .catch((err) => {
      console.log(err);
    });
};

// Update a Drive by the id in the request
exports.update = (req, res) => {
  const driveId = req.params.id;
  const driveName = req.body.name;
  const driveLabel = req.body.label;
  const driveSerial = req.body.serial;
  const driveDatePurchased = req.body.datePurchased;
  const modelId = req.body.modelId;
  const retailerId = req.body.retailerId;
  Drive.findByPk(driveId)
    .then((drive) => {
      if (!drive) {
        return res.status(404).json({ message: "Drive not found!" });
      }

      return drive.update({
        name: driveName,
        label: driveLabel,
        serial: driveSerial,
        datePurchased: driveDatePurchased,
        modelId: modelId,
        retailerId: retailerId,
      });
    })
    .then((result) => {
      res.status(200).json(result);
    })
    .catch((err) => console.log(err));
};

// Delete a Drive with the specified id in the request
exports.delete = (req, res) => {
  const driveId = req.params.id;
  Drive.findByPk(driveId)
    .then((drive) => {
      if (!drive) {
        return res.status(404).json({ message: "Drive not found!" });
      }
      return drive.destroy({
        where: {
          id: driveId,
        },
      });
    })
    .then((result) => {
      res.status(200).json({ message: "Drive deleted" });
    })
    .catch((err) => console.log(err));
};
