const { validationResult } = require("express-validator");

const Manufacturer = require("../models/manufacturer.model");
const PaginationHandler = require("../utils/pagination.util");

// Retrieve all manufacturers from the database.
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

  Manufacturer.findAndCountAll({
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

// Find a single Manufacturer with an id
exports.findOne = (req, res) => {
  const manufacturerId = req.params.id;
  Manufacturer.findByPk(manufacturerId)
    .then((manufacturer) => {
      if (!manufacturer) {
        return res.status(404).json({ message: "Manufacturer not found!" });
      }
      res.status(200).json(manufacturer);
    })
    .catch((err) => console.log(err));
};

// Create and Save a new Manufacturer
exports.create = (req, res) => {
  const manufacturerName = req.body.name;
  const manufacturerAddress = req.body.address;
  const manufacturerCountry = req.body.country;
  const manufacturerPhone = req.body.phone;
  const manufacturerEmail = req.body.email;
  const manufacturerWebsite = req.body.website;
  Manufacturer.create({
    name: manufacturerName,
    address: manufacturerAddress,
    country: manufacturerCountry,
    phone: manufacturerPhone,
    email: manufacturerEmail,
    website: manufacturerWebsite,
  })
    .then((result) => {
      console.log("Created manufacturer");
      res.status(201).json({
        message: "Manufacturer created succssfully!",
        manufacturer: result,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

// Update a Manufacturer by the id in the request
exports.update = (req, res) => {
  const manufacturerId = req.params.id;
  const manufacturerName = req.body.name;
  const manufacturerAddress = req.body.address;
  const manufacturerCountry = req.body.country;
  const manufacturerPhone = req.body.phone;
  const manufacturerEmail = req.body.email;
  const manufacturerWebsite = req.body.website;
  Manufacturer.findByPk(manufacturerId)
    .then((manufacturer) => {
      if (!manufacturer) {
        return res.status(404).json({ message: "Manufacturer not found!" });
      }
      manufacturer.name = manufacturerName;
      manufacturer.address = manufacturerAddress;
      manufacturer.country = manufacturerCountry;
      manufacturer.phone = manufacturerPhone;
      manufacturer.email = manufacturerEmail;
      manufacturer.website = manufacturerWebsite;

      return manufacturer.save();
    })
    .then((result) => {
      res.status(200).json(result);
    })
    .catch((err) => console.log(err));
};

// Delete a Manufacturer with the specified id in the request
exports.delete = (req, res) => {
  const manufacturerId = req.params.id;
  Manufacturer.findByPk(manufacturerId)
    .then((manufacturer) => {
      if (!manufacturer) {
        return res.status(404).json({ message: "Manufacturer not found!" });
      }
      return manufacturer.destroy({
        where: {
          id: manufacturerId,
        },
      });
    })
    .then((result) => {
      res.status(200).json({ message: "Manufacturer deleted" });
    })
    .catch((err) => console.log(err));
};
