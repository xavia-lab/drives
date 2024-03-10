const { validationResult } = require("express-validator");

const Capacity = require("../models/capacity.model");
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

  Capacity.findAndCountAll({
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

// Find a single Capacity with an id
exports.findOne = (req, res) => {
  const capacityId = req.params.id;
  Capacity.findByPk(capacityId)
    .then((capacity) => {
      if (!capacity) {
        return res.status(404).json({ message: "Capacity not found!" });
      }
      res.status(200).json(capacity);
    })
    .catch((err) => console.log(err));
};

exports.create = (req, res) => {
  const capacityName = req.body.name;
  const capacityUnit = req.body.unit;
  const capacityValue = req.body.value;
  Capacity.create({
    name: capacityName,
    unit: capacityUnit,
    value: capacityValue,
  })
    .then((result) => {
      console.log("Created capacity");
      res.status(201).json(result);
    })
    .catch((err) => {
      console.log(err);
    });
};

// Update a Capacity by the id in the request
exports.update = (req, res) => {
  const capacityId = req.params.id;
  const capacityName = req.body.name;
  const capacityUnit = req.body.unit;
  const capacityValue = req.body.value;
  Capacity.findByPk(capacityId)
    .then((capacity) => {
      if (!capacity) {
        return res.status(404).json({ message: "Capacity not found!" });
      }
      capacity.name = capacityName;
      capacity.unit = capacityUnit;
      capacity.value = capacityValue;

      return capacity.save();
    })
    .then((result) => {
      res.status(200).json(result);
    })
    .catch((err) => console.log(err));
};

// Delete a Capacity with the specified id in the request
exports.delete = (req, res) => {
  const capacityId = req.params.id;
  Capacity.findByPk(capacityId)
    .then((capacity) => {
      if (!capacity) {
        return res.status(404).json({ message: "Capacity not found!" });
      }
      return capacity.destroy({
        where: {
          id: capacityId,
        },
      });
    })
    .then((result) => {
      res.status(200).json({ message: "Capacity deleted" });
    })
    .catch((err) => console.log(err));
};
