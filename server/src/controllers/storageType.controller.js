const { validationResult } = require("express-validator");

const StorageType = require("../models/storageType.model");
const PaginationHandler = require("../utils/pagination.util");

// Retrieve all storageTypes from the database.
exports.findAll = (req, res) => {
  const pageNumber = req.query.pageNumber;
  const pageSize = req.query.pageSize;
  const sortField = req.query.sortField;
  const sortOrder = req.query.sortOrder;
  const filterField = req.query.filterField;
  const filterOperator = req.query.filterOperator;
  const filterValue = req.query.filterValue;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const queryParams = PaginationHandler.paginate(
    (paging = { page: pageNumber, size: pageSize }),
    (sorting = { field: sortField, order: sortOrder }),
    (filtering = {
      field: filterField,
      operator: filterOperator,
      value: filterValue,
    }),
  );

  StorageType.findAndCountAll({
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

// Find a single StorageType with an id
exports.findOne = (req, res) => {
  const storageTypeId = req.params.id;
  StorageType.findByPk(storageTypeId)
    .then((storageType) => {
      if (!storageType) {
        return res.status(404).json({ message: "StorageType not found!" });
      }
      res.status(200).json(storageType);
    })
    .catch((err) => console.log(err));
};

// Create and Save a new StorageType
exports.create = (req, res) => {
  const storageTypeName = req.body.name;
  StorageType.create({
    name: storageTypeName,
  })
    .then((result) => {
      console.log("Created storageType");
      res.status(201).json(result);
    })
    .catch((err) => {
      console.log(err);
    });
};

// Update a StorageType by the id in the request
exports.update = (req, res) => {
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
      res.status(200).json(result);
    })
    .catch((err) => console.log(err));
};

// Delete a StorageType with the specified id in the request
exports.delete = (req, res) => {
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
