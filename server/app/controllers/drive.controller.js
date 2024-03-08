const { validationResult } = require("express-validator");

const Drive = require("../models/drive.model");
const PaginationHandler = require("../utils/pagination.util");

// Retrieve all drives from the database.
exports.findAll = (req, res) => {
  const pageNumber = req.query.page;
  const pageSize = req.query.size;
  const orderBy = req.query.orderBy;
  const sortBy = req.query.sortBy;
  const filterBy = req.query.filterBy;
  const filter = req.query.filter;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const pagingAttributes = PaginationHandler.paginate(
    (paging = { page: pageNumber, size: pageSize }),
    (ordering = { orderBy: orderBy, sortBy: sortBy }),
    (filtering = { filterBy: filterBy, filter: filter }),
  );

  Drive.findAll({
    ...pagingAttributes,
    include: { all: true, nested: true },
  })
    .then((drives) => {
      res.status(200).json({ drives: drives });
    })
    .catch((err) => console.log(err));
};

// Find a single Drive with an id
exports.findOne = (req, res, next) => {
  const driveId = req.params.id;
  Drive.findByPk(driveId, { include: { all: true, nested: true } })
    .then((drive) => {
      if (!drive) {
        return res.status(404).json({ message: "Drive not found!" });
      }
      res.status(200).json({ drive: drive });
    })
    .catch((err) => console.log(err));
};

// Create and Save a new Drive
exports.create = (req, res, next) => {
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
      res.status(201).json({
        message: "Drive created succssfully!",
        drive: result,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

// Update a Drive by the id in the request
exports.update = (req, res, next) => {
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
      res.status(200).json({ message: "Drive updated", drive: result });
    })
    .catch((err) => console.log(err));
};

// Delete a Drive with the specified id in the request
exports.delete = (req, res, next) => {
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
