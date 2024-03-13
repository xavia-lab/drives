const { validationResult } = require("express-validator");

const Manufacturer = require("../models/manufacturer.model");
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
        return { status: 404, message: "Manufacturer not found!" };
      } else if (manufacturer.managed) {
        return {
          status: 409,
          message: "System managed manufacturer cannot be deleted!",
        };
      } else {
        manufacturer.name = manufacturerName;
        manufacturer.address = manufacturerAddress;
        manufacturer.country = manufacturerCountry;
        manufacturer.phone = manufacturerPhone;
        manufacturer.email = manufacturerEmail;
        manufacturer.website = manufacturerWebsite;

        const out = manufacturer.save();
        return { status: 200, result: out };
      }
    })
    .then((result) => {
      res.status(result.message).json(result.out);
    })
    .catch((err) => console.log(err));
};

// Delete a Manufacturer with the specified id in the request
exports.delete = (req, res) => {
  const manufacturerId = req.params.id;
  Manufacturer.findByPk(manufacturerId)
    .then((manufacturer) => {
      if (!manufacturer) {
        return { status: 404, message: "Manufacturer not found!" };
      } else if (manufacturer.managed) {
        return {
          status: 409,
          message: "System managed manufacturer cannot be deleted!",
        };
      } else {
        const out = manufacturer.destroy({
          where: {
            id: manufacturerId,
          },
        });
        return {
          status: 200,
          message: `Deleted manufacturerId: ${manufacturerId}`,
          out: out,
        };
      }
    })
    .then((result) => {
      console.log(`Deleted response for manufacturerId: ${manufacturerId}`);
      console.log(JSON.stringify(result));
      res.status(result.status).json({ message: `${result.message}` });
    })
    .catch((err) => console.log(err));
};
