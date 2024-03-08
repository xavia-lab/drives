const { validationResult } = require("express-validator");

const Manufacturer = require("../models/manufacturer.model");
const PaginationHandler = require("../utils/pagination.util");

// Retrieve all manufacturers from the database.
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

  Manufacturer.findAll({
    ...pagingAttributes,
  })
    .then((manufacturers) => {
      res.status(200).json({ manufacturers: manufacturers });
    })
    .catch((err) => console.log(err));
};

// Find a single Manufacturer with an id
exports.findOne = (req, res, next) => {
  const manufacturerId = req.params.id;
  Manufacturer.findByPk(manufacturerId)
    .then((manufacturer) => {
      if (!manufacturer) {
        return res.status(404).json({ message: "Manufacturer not found!" });
      }
      res.status(200).json({ manufacturer: manufacturer });
    })
    .catch((err) => console.log(err));
};

// Create and Save a new Manufacturer
exports.create = (req, res, next) => {
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
exports.update = (req, res, next) => {
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
      res
        .status(200)
        .json({ message: "Manufacturer updated", manufacturer: result });
    })
    .catch((err) => console.log(err));
};

// Delete a Manufacturer with the specified id in the request
exports.delete = (req, res, next) => {
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
