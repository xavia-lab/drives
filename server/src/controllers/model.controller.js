const { validationResult } = require("express-validator");

const Model = require("../models/model.model");
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

  Model.findAndCountAll({
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

// Find a single Model with an id
exports.findOne = (req, res) => {
  const modelId = req.params.id;
  Model.findByPk(modelId, { include: { all: true, nested: true } })
    .then((model) => {
      if (!model) {
        return res.status(404).json({ message: "Model not found!" });
      }
      res.status(200).json(model);
    })
    .catch((err) => console.log(err));
};

// Create and Save a new Model
exports.create = (req, res) => {
  const modelName = req.body.name;
  const modelNumber = req.body.number;
  const capacityId = req.body.capacityId;
  const interfaceId = req.body.interfaceId;
  const manufacturerId = req.body.manufacturerId;
  const storageTypeId = req.body.storageTypeId;
  Model.create({
    name: modelName,
    number: modelNumber,
    capacityId: capacityId,
    interfaceId: interfaceId,
    manufacturerId: manufacturerId,
    storageTypeId: storageTypeId,
  })
    .then((result) => {
      console.log("Created model");
      res.status(201).json(result);
    })
    .catch((err) => {
      console.log(err);
    });
};

// Update a Model by the id in the request
exports.update = (req, res) => {
  const modelId = req.params.id;
  const modelName = req.body.name;
  const modelNumber = req.body.number;
  const capacityId = req.body.capacityId;
  const interfaceId = req.body.interfaceId;
  const manufacturerId = req.body.manufacturerId;
  const storageTypeId = req.body.storageTypeId;
  Model.findByPk(modelId)
    .then((model) => {
      if (!model) {
        return res.status(404).json({ message: "Model not found!" });
      }

      return model.update({
        name: modelName,
        number: modelNumber,
        capacityId: capacityId,
        interfaceId: interfaceId,
        manufacturerId: manufacturerId,
        storageTypeId: storageTypeId,
      });
    })
    .then((result) => {
      res.status(200).json(result);
    })
    .catch((err) => console.log(err));
};

// Delete a Model with the specified id in the request
exports.delete = (req, res) => {
  const modelId = req.params.id;
  Model.findByPk(modelId)
    .then((model) => {
      if (!model) {
        return res.status(404).json({ message: "Model not found!" });
      }
      return model.destroy({
        where: {
          id: modelId,
        },
      });
    })
    .then((result) => {
      res.status(200).json({ message: "Model deleted" });
    })
    .catch((err) => console.log(err));
};
