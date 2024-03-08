const { validationResult } = require("express-validator");

const Model = require("../models/model.model");
const PaginationHandler = require("../utils/pagination.util");

// Retrieve all models from the database.
exports.findAll = (req, res) => {
  const pageNumber = req.query.pageNumber;
  const pageSize = req.query.pageSize;
  const sortField = req.query.sortField;
  const sortOrder = req.query.orderOrder;
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

  Model.findAll({
    ...queryParams,
    include: { all: true, nested: true },
  })
    .then((result) => {
      res.status(200).json(result);
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
