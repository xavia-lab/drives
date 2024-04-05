const { validationResult } = require("express-validator");

const Interface = require("../models/interface.model");
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
    Interface.describe()
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
          Interface.findAndCountAll({
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

// Find a single Interface with an id
exports.findOne = (req, res) => {
  const id = req.params.id;
  Interface.findByPk(id)
    .then((item) => {
      if (!item)
        res.status(404).json({
          success: false,
          errors: ["Interface not found!"],
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

// Create and Save a new Interface
exports.create = (req, res) => {
  const name = req.body.name;
  const throughput = req.body.throughput;
  Interface.create({
    name: name,
    speed: throughput,
  })
    .then((result) => {
      console.log("Created interface");
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

// Update a Interface by the id in the request
exports.update = (req, res) => {
  const id = req.params.id;
  const name = req.body.name;
  const throughput = req.body.throughput;
  Interface.findByPk(id)
    .then((item) => {
      if (!item) {
        return { status: 404, message: "Interface not found!" };
      } else if (item.managed) {
        return {
          status: 409,
          message: "System managed interface cannot be deleted!",
        };
      } else {
        item.name = name;
        item.throughput = throughput;

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

// Delete a Interface with the specified id in the request
exports.delete = (req, res) => {
  const id = req.params.id;
  Interface.findByPk(id)
    .then((item) => {
      if (!item) {
        return { status: 404, message: "Interface not found!" };
      } else if (item.managed) {
        return {
          status: 409,
          message: "System managed interface cannot be deleted!",
        };
      } else {
        const out = item.destroy({
          where: {
            id: id,
          },
        });
        return {
          status: 200,
          message: `Deleted interface id: ${id}`,
          out: out,
        };
      }
    })
    .then((result) => {
      console.log(`Deleted response for interface id: ${id}`);
      console.log(JSON.stringify(result));
      res.status(result.status).json({ message: `${result.message}` });
    })
    .catch((err) => console.log(err));
};
