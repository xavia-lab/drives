const { validationResult } = require("express-validator");

const Interface = require("../models/interface.model");
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
};

// Find a single Interface with an id
exports.findOne = (req, res) => {
  const id = req.params.id;
  Interface.findByPk(id)
    .then((item) => {
      if (!item) {
        return res.status(404).json({ message: "Interface not found!" });
      }
      res.status(200).json(item);
    })
    .catch((err) => console.log(err));
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

        const out = item.save();
        return { status: 200, result: out };
      }
    })
    .then((result) => {
      res.status(result.message).json(result.out);
    })
    .catch((err) => console.log(err));
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
