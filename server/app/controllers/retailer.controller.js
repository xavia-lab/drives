const { validationResult } = require("express-validator");

const Retailer = require("../models/retailer.model");
const PaginationHandler = require("../utils/pagination.util");

// Retrieve all retailers from the database.
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

  Retailer.findAll({
    ...pagingAttributes,
  })
    .then((retailers) => {
      res.status(200).json({ retailers: retailers });
    })
    .catch((err) => console.log(err));
};

// Find a single Retailer with an id
exports.findOne = (req, res, next) => {
  const retailerId = req.params.id;
  Retailer.findByPk(retailerId)
    .then((retailer) => {
      if (!retailer) {
        return res.status(404).json({ message: "Retailer not found!" });
      }
      res.status(200).json({ retailer: retailer });
    })
    .catch((err) => console.log(err));
};

// Create and Save a new Retailer
exports.create = (req, res, next) => {
  const retailerName = req.body.name;
  const retailerAddress = req.body.address;
  const retailerCountry = req.body.country;
  const retailerPhone = req.body.phone;
  const retailerEmail = req.body.email;
  const retailerWebsite = req.body.website;
  Retailer.create({
    name: retailerName,
    address: retailerAddress,
    country: retailerCountry,
    phone: retailerPhone,
    email: retailerEmail,
    website: retailerWebsite,
  })
    .then((result) => {
      console.log("Created retailer");
      res.status(201).json({
        message: "Retailer created succssfully!",
        retailer: result,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

// Update a Retailer by the id in the request
exports.update = (req, res, next) => {
  const retailerId = req.params.id;
  const retailerName = req.body.name;
  const retailerAddress = req.body.address;
  const retailerCountry = req.body.country;
  const retailerPhone = req.body.phone;
  const retailerEmail = req.body.email;
  const retailerWebsite = req.body.website;
  Retailer.findByPk(retailerId)
    .then((retailer) => {
      if (!retailer) {
        return res.status(404).json({ message: "Retailer not found!" });
      }
      retailer.name = retailerName;
      retailer.address = retailerAddress;
      retailer.country = retailerCountry;
      retailer.phone = retailerPhone;
      retailer.email = retailerEmail;
      retailer.website = retailerWebsite;

      return retailer.save();
    })
    .then((result) => {
      res.status(200).json({ message: "Retailer updated", retailer: result });
    })
    .catch((err) => console.log(err));
};

// Delete a Retailer with the specified id in the request
exports.delete = (req, res, next) => {
  const retailerId = req.params.id;
  Retailer.findByPk(retailerId)
    .then((retailer) => {
      if (!retailer) {
        return res.status(404).json({ message: "Retailer not found!" });
      }
      return retailer.destroy({
        where: {
          id: retailerId,
        },
      });
    })
    .then((result) => {
      res.status(200).json({ message: "Retailer deleted" });
    })
    .catch((err) => console.log(err));
};
