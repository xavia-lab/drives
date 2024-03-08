const { validationResult } = require("express-validator");

const StorageType = require("../models/storageType.model");
const PaginationHandler = require("../utils/pagination.util");

// Retrieve all storageTypes from the database.
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

  StorageType.findAll({
    ...pagingAttributes,
  })
    .then((storageTypes) => {
      res.status(200).json({ storageTypes: storageTypes });
    })
    .catch((err) => console.log(err));
};

// Find a single StorageType with an id
exports.findOne = (req, res, next) => {
  const storageTypeId = req.params.id;
  StorageType.findByPk(storageTypeId)
    .then((storageType) => {
      if (!storageType) {
        return res.status(404).json({ message: "StorageType not found!" });
      }
      res.status(200).json({ storageType: storageType });
    })
    .catch((err) => console.log(err));
};

// Create and Save a new StorageType
exports.create = (req, res, next) => {
  const storageTypeName = req.body.name;
  StorageType.create({
    name: storageTypeName,
  })
    .then((result) => {
      console.log("Created storageType");
      res.status(201).json({
        message: "StorageType created succssfully!",
        storageType: result,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

// Update a StorageType by the id in the request
exports.update = (req, res, next) => {
  const storageTypeId = req.params.id;
  const storageTypeName = req.body.name;
  StorageType.findByPk(storageTypeId)
    .then((storageType) => {
      if (!storageType) {
        return res.status(404).json({ message: "StorageType not found!" });
      }
      storageType.name = storageTypeName;

      return storageType.save();
    })
    .then((result) => {
      res
        .status(200)
        .json({ message: "StorageType updated", storageType: result });
    })
    .catch((err) => console.log(err));
};

// Delete a StorageType with the specified id in the request
exports.delete = (req, res, next) => {
  const storageTypeId = req.params.id;
  StorageType.findByPk(storageTypeId)
    .then((storageType) => {
      if (!storageType) {
        return res.status(404).json({ message: "StorageType not found!" });
      }
      return storageType.destroy({
        where: {
          id: storageTypeId,
        },
      });
    })
    .then((result) => {
      res.status(200).json({ message: "StorageType deleted" });
    })
    .catch((err) => console.log(err));
};