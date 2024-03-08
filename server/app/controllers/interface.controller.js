const { validationResult } = require("express-validator");

const Interface = require("../models/interface.model");
const PaginationHandler = require("../utils/pagination.util");

// Retrieve all interfaces from the database.
exports.findAll = (req, res) => {
  const pageNumber = req.query.page;
  const pageSize = req.query.size;
  const orderBy = req.query.orderBy;
  const sortBy = req.query.sortBy;
  const filterBy = req.query.filterBy;
  const filter = req.query.filter;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const pagingAttributes = PaginationHandler.paginate(
    (paging = { page: pageNumber, size: pageSize }),
    (ordering = { orderBy: orderBy, sortBy: sortBy }),
    (filtering = { filterBy: filterBy, filter: filter }),
  );

  Interface.findAll({
    ...pagingAttributes,
  })
    .then((interfaces) => {
      res.status(200).json({ interfaces: interfaces });
    })
    .catch((err) => console.log(err));
};

// Find a single Interface with an id
exports.findOne = (req, res, next) => {
  const interfaceId = req.params.id;
  Interface.findByPk(interfaceId)
    .then((interface) => {
      if (!interface) {
        return res.status(404).json({ message: "Interface not found!" });
      }
      res.status(200).json({ interface: interface });
    })
    .catch((err) => console.log(err));
};

// Create and Save a new Interface
exports.create = (req, res, next) => {
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
      res.status(201).json({
        message: "Interface created succssfully!",
        interface: result,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

// Update a Interface by the id in the request
exports.update = (req, res, next) => {
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
      res.status(200).json({ message: "Interface updated", interface: result });
    })
    .catch((err) => console.log(err));
};

// Delete a Interface with the specified id in the request
exports.delete = (req, res, next) => {
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
