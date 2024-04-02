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
  const id = req.params.id;
  Drive.findByPk(id)
    .then((item) => {
      if (!item) {
        return res.status(404).json({ message: "Drive not found!" });
      }
      res.status(200).json(item);
    })
    .catch((err) => console.log(err));
};

// Create and Save a new Drive
exports.create = (req, res) => {
  const name = req.body.name;
  const label = req.body.label;
  const serial = req.body.serial;
  const datePurchased = req.body.datePurchased;
  const modelId = req.body.modelId;
  const retailerId = req.body.retailerId;
  Drive.create({
    name: name,
    label: label,
    serial: serial,
    datePurchased: datePurchased,
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
  const id = req.params.id;
  const name = req.body.name;
  const label = req.body.label;
  const serial = req.body.serial;
  const datePurchased = req.body.datePurchased;
  const modelId = req.body.modelId;
  const retailerId = req.body.retailerId;
  Drive.findByPk(id)
    .then((item) => {
      if (!item) {
        return { status: 404, message: "Drive not found!" };
      } else {
        const out = item.update({
          name: name,
          label: label,
          serial: serial,
          datePurchased: datePurchased,
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
  const id = req.params.id;
  Drive.findByPk(id)
    .then((item) => {
      if (!item) {
        return { status: 404, message: "Drive not found!" };
      } else {
        const out = item.destroy({
          where: {
            id: id,
          },
        });
        return {
          status: 200,
          message: `Deleted drive id: ${id}`,
          out: out,
        };
      }
    })
    .then((result) => {
      console.log(`Deleted response for drive id: ${id}`);
      console.log(JSON.stringify(result));
      res.status(result.status).json({ message: `${result.message}` });
    })
    .catch((err) => console.log(err));
};
