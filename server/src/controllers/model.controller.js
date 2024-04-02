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
  const id = req.params.id;
  Model.findByPk(id)
    .then((item) => {
      if (!item) {
        return res.status(404).json({ message: "Model not found!" });
      }
      res.status(200).json(item);
    })
    .catch((err) => console.log(err));
};

// Create and Save a new Model
exports.create = (req, res) => {
  const name = req.body.name;
  const number = req.body.number;
  const capacityId = req.body.capacityId;
  const formFactorId = req.body.formFactorId;
  const interfaceId = req.body.interfaceId;
  const manufacturerId = req.body.manufacturerId;
  const storageTypeId = req.body.storageTypeId;
  Model.create({
    name: name,
    number: number,
    capacityId: capacityId,
    formFactorId: formFactorId,
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
  const id = req.params.id;
  const name = req.body.name;
  const number = req.body.number;
  const capacityId = req.body.capacityId;
  const formFactorId = req.body.formFactorId;
  const interfaceId = req.body.interfaceId;
  const manufacturerId = req.body.manufacturerId;
  const storageTypeId = req.body.storageTypeId;
  Model.findByPk(id)
    .then((item) => {
      if (!item) {
        return { status: 404, message: "Model not found!" };
      } else {
        const out = item.update({
          name: name,
          number: number,
          capacityId: capacityId,
          formFactorId: formFactorId,
          interfaceId: interfaceId,
          manufacturerId: manufacturerId,
          storageTypeId: storageTypeId,
        });
        return { status: 200, result: out };
      }
    })
    .then((result) => {
      res.status(result.message).json(result.out);
    })
    .catch((err) => console.log(err));
};

// Delete a Model with the specified id in the request
exports.delete = (req, res) => {
  const id = req.params.id;
  Model.findByPk(id)
    .then((item) => {
      if (!item) {
        return { status: 404, message: "Model not found!" };
      } else {
        const out = item.destroy({
          where: {
            id: id,
          },
        });
        return {
          status: 200,
          message: `Deleted model id: ${id}`,
          out: out,
        };
      }
    })
    .then((result) => {
      console.log(`Deleted response for model id: ${id}`);
      console.log(JSON.stringify(result));
      res.status(result.status).json({ message: `${result.message}` });
    })
    .catch((err) => console.log(err));
};
