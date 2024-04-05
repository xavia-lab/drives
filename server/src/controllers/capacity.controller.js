const { validationResult } = require("express-validator");

const BytesConverter = require("../utils/human.readable.bytes.converter");

const Capacity = require("../models/capacity.model");
const QueryParamsBuilder = require("../builders/query.params.builder");
const ColumnValidator = require("../validations/database.column.validation");

exports.findAll = (req, res) => {
  const requestQueryParams = req.query;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  } else {
    Capacity.describe()
      .then((tableSpec) => {
        const validationResult = ColumnValidator.validate(
          requestQueryParams,
          tableSpec,
        );
        console.log(
          `Column validation result: ${JSON.stringify(validationResult)}`,
        );
        if (!validationResult.success) {
          res.status(400).json(validationResult);
        } else {
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
        }
      })
      .catch((err) => {
        console.log(err);
        res.status(404).json({
          success: false,
          errors: [err],
        });
      });
  }
};

// Find a single Capacity with an id
exports.findOne = (req, res) => {
  const id = req.params.id;
  Capacity.findByPk(id)
    .then((item) => {
      if (!item)
        res.status(404).json({
          success: false,
          errors: ["Capacity not found!"],
        });
      else res.status(200).json(item);
    })
    .catch((err) => {
      console.log(err);
      res.status(404).json({
        success: false,
        errors: [err],
      });
    });
};

// Create and Save a new Capacity
exports.create = (req, res) => {
  const name = req.body.name;
  const unit = req.body.unit;
  const value = req.body.value;
  Capacity.create({
    name: name,
    unit: unit,
    value: value,
    absoluteCapacity: BytesConverter.toBytes(value, unit),
  })
    .then((result) => {
      console.log("Created capacity");
      res.status(201).json(result);
    })
    .catch((err) => {
      console.log(err);
      res.status(409).json({
        success: false,
        errors: [err],
      });
    });
};

// Update a Capacity by the id in the request
exports.update = (req, res) => {
  const id = req.params.id;
  const name = req.body.name;
  const unit = req.body.unit;
  const value = req.body.value;
  Capacity.findByPk(id)
    .then((item) => {
      if (!item) {
        return { status: 404, message: "Capacity not found!" };
      } else if (item.managed) {
        return {
          status: 409,
          message: "System managed capacity cannot be deleted!",
        };
      } else {
        item.name = name;
        item.unit = unit;
        item.value = value;
        item.absoluteCapacity = BytesConverter.toBytes(value, unit);

        item.save();
        return { status: 200, message: "Updated succssfully!" };
      }
    })
    .then((result) => {
      res.status(result.status).json(result.message);
    })
    .catch((err) => {
      console.log(err);
      res.status(409).json({
        success: false,
        errors: [err],
      });
    });
};

// Delete a Capacity with the specified id in the request
exports.delete = (req, res) => {
  const id = req.params.id;
  Capacity.findByPk(id)
    .then((item) => {
      if (!item) {
        return { status: 404, message: "Capacity not found!" };
      } else if (item.managed) {
        return {
          status: 409,
          message: "System managed capacity cannot be deleted!",
        };
      } else {
        const out = item.destroy({
          where: {
            id: id,
          },
        });
        return {
          status: 200,
          message: `Deleted capacity id: ${id}`,
          out: out,
        };
      }
    })
    .then((result) => {
      console.log(`Deleted response for capacity id: ${id}`);
      console.log(JSON.stringify(result));
      res.status(result.status).json({ message: `${result.message}` });
    })
    .catch((err) => console.log(err));
};
