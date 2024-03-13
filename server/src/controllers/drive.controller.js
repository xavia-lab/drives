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
  Drive.findByPk(driveId)
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
        return { status: 404, message: "Drive not found!" };
      } else {
        const out = drive.update({
          name: driveName,
          label: driveLabel,
          serial: driveSerial,
          datePurchased: driveDatePurchased,
          modelId: modelId,
          retailerId: retailerId,
        });
        return { status: 200, result: out };
      }
    })
    .then((result) => {
      res.status(result.message).json(result.out);
    })
    .catch((err) => console.log(err));
};

// Delete a Drive with the specified id in the request
exports.delete = (req, res) => {
  const driveId = req.params.id;
  Drive.findByPk(driveId)
    .then((drive) => {
      if (!drive) {
        return { status: 404, message: "Drive not found!" };
      } else {
        const out = drive.destroy({
          where: {
            id: driveId,
          },
        });
        return {
          status: 200,
          message: `Deleted driveId: ${driveId}`,
          out: out,
        };
      }
    })
    .then((result) => {
      console.log(`Deleted response for driveId: ${driveId}`);
      console.log(JSON.stringify(result));
      res.status(result.status).json({ message: `${result.message}` });
    })
    .catch((err) => console.log(err));
};
