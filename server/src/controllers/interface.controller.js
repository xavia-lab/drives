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
  const interfaceId = req.params.id;
  Interface.findByPk(interfaceId)
    .then((interface) => {
      if (!interface) {
        return res.status(404).json({ message: "Interface not found!" });
      }
      res.status(200).json(interface);
    })
    .catch((err) => console.log(err));
};

// Create and Save a new Interface
exports.create = (req, res) => {
  const interfaceName = req.body.name;
  const interfaceThroughput = req.body.throughput;
  Interface.create({
    name: interfaceName,
    speed: interfaceThroughput,
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
  const interfaceId = req.params.id;
  const interfaceName = req.body.name;
  const interfaceThroughput = req.body.throughput;
  Interface.findByPk(interfaceId)
    .then((interface) => {
      if (!interface) {
        return { status: 404, message: "Interface not found!" };
      } else if (interface.managed) {
        return {
          status: 409,
          message: "System managed interface cannot be deleted!",
        };
      } else {
        interface.name = interfaceName;
        interface.throughput = interfaceThroughput;

        const out = interface.save();
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
  const interfaceId = req.params.id;
  Interface.findByPk(interfaceId)
    .then((interface) => {
      if (!interface) {
        return { status: 404, message: "Interface not found!" };
      } else if (interface.managed) {
        return {
          status: 409,
          message: "System managed interface cannot be deleted!",
        };
      } else {
        const out = interface.destroy({
          where: {
            id: interfaceId,
          },
        });
        return {
          status: 200,
          message: `Deleted interfaceId: ${interfaceId}`,
          out: out,
        };
      }
    })
    .then((result) => {
      console.log(`Deleted response for interfaceId: ${interfaceId}`);
      console.log(JSON.stringify(result));
      res.status(result.status).json({ message: `${result.message}` });
    })
    .catch((err) => console.log(err));
};
