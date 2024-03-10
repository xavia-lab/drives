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
  const interfaceForm = req.body.form;
  const interfaceSpeed = req.body.speed;
  Interface.create({
    name: interfaceName,
    form: interfaceForm,
    speed: interfaceSpeed,
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
  const interfaceForm = req.body.form;
  const interfaceSpeed = req.body.speed;
  Interface.findByPk(interfaceId)
    .then((interface) => {
      if (!interface) {
        return res.status(404).json({ message: "Interface not found!" });
      }
      interface.name = interfaceName;
      interface.form = interfaceForm;
      interface.speed = interfaceSpeed;

      return interface.save();
    })
    .then((result) => {
      res.status(200).json(result);
    })
    .catch((err) => console.log(err));
};

// Delete a Interface with the specified id in the request
exports.delete = (req, res) => {
  const interfaceId = req.params.id;
  Interface.findByPk(interfaceId)
    .then((interface) => {
      if (!interface) {
        return res.status(404).json({ message: "Interface not found!" });
      }
      return interface.destroy({
        where: {
          id: interfaceId,
        },
      });
    })
    .then((result) => {
      res.status(200).json({ message: "Interface deleted" });
    })
    .catch((err) => console.log(err));
};
