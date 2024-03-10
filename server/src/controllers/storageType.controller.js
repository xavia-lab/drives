const { validationResult } = require("express-validator");

const StorageType = require("../models/storageType.model");
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
