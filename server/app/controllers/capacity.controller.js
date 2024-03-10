const { validationResult } = require("express-validator");

const Capacity = require("../models/capacity.model");
const PaginationHandler = require("../utils/pagination.util");

// Retrieve all capacities from the database.
exports.findAll = (req, res) => {
  const pageNumber = req.query.pageNumber;
  const pageSize = req.query.pageSize;
  const sortField = req.query.sortField;
  const sortOrder = req.query.sortOrder;
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

// Create and Save a new Capacity
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
