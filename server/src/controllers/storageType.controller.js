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
        return res.status(404).json({ message: "Storage type not found!" });
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
      console.log("Created storage type");
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
        return { status: 404, message: "Storage type not found!" };
      } else if (storageType.managed) {
        return {
          status: 409,
          message: "System managed storage type cannot be deleted!",
        };
      } else {
        storageType.name = storageTypeName;

        const out = storageType.save();
        return { status: 200, result: out };
      }
    })
    .then((result) => {
      res.status(result.message).json(result.out);
    })
    .catch((err) => console.log(err));
};

// Delete a StorageType with the specified id in the request
exports.delete = (req, res) => {
  const storageTypeId = req.params.id;
  StorageType.findByPk(storageTypeId)
    .then((storageType) => {
      if (!storageType) {
        return { status: 404, message: "Storage type not found!" };
      } else if (storageType.managed) {
        return {
          status: 409,
          message: "System managed storage type cannot be deleted!",
        };
      } else {
        const out = storageType.destroy({
          where: {
            id: storageTypeId,
          },
        });
        return {
          status: 200,
          message: `Deleted storageTypeId: ${storageTypeId}`,
          out: out,
        };
      }
    })
    .then((result) => {
      console.log(`Deleted response for storageTypeId: ${storageTypeId}`);
      console.log(JSON.stringify(result));
      res.status(result.status).json({ message: `${result.message}` });
    })
    .catch((err) => console.log(err));
};
